// ===========================
// VAMPIRE SURVIVORS — GAME.JS
// Main game loop & state machine
// ===========================

class Game {
  constructor() {
    this.canvas  = document.getElementById('gameCanvas');
    this.ctx     = this.canvas.getContext('2d');
    this.running = false;
    this.paused  = false;
    this.state   = 'menu'; // menu, playing, levelup, gameover, paused

    this.dt = 0;
    this._lastTime = 0;
    this._rafId = null;

    // Systems
    this.world     = null;
    this.player    = null;
    this.enemies   = null;
    this.weapons   = null;
    this.particles = null;
    this.ui        = null;

    // Game state
    this.gameTime  = 0;
    this.score     = 0;
    this.kills     = 0;
    this.levelUpPending = false;

    // Input
    this.input = {
      up: false, down: false, left: false, right: false,
      w: false, a: false, s: false, d: false
    };

    // Camera
    this.camX = 0; this.camY = 0;

    this._resize();
    this._bindEvents();
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    // Keyboard
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup'    || k === 'w') this.input.up    = true;
      if (k === 'arrowdown'  || k === 's') this.input.down  = true;
      if (k === 'arrowleft'  || k === 'a') this.input.left  = true;
      if (k === 'arrowright' || k === 'd') this.input.right = true;
      if ((k === 'escape' || k === 'p') && this.state === 'playing') this.pause();
      else if ((k === 'escape' || k === 'p') && this.state === 'paused') this.resume();
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup'    || k === 'w') this.input.up    = false;
      if (k === 'arrowdown'  || k === 's') this.input.down  = false;
      if (k === 'arrowleft'  || k === 'a') this.input.left  = false;
      if (k === 'arrowright' || k === 'd') this.input.right = false;
    });

    // Buttons
    document.getElementById('btnStart').addEventListener('click', () => this.startGame());
    document.getElementById('btnHow').addEventListener('click', () => this.ui.showScreen('howToPlay'));
    document.getElementById('btnBackMenu').addEventListener('click', () => this.ui.showScreen('mainMenu'));
    document.getElementById('btnRestart').addEventListener('click', () => this.startGame());
    document.getElementById('btnMainMenu').addEventListener('click', () => { this.stopLoop(); this.ui.showScreen('mainMenu'); });
    document.getElementById('btnResume').addEventListener('click', () => this.resume());
    document.getElementById('btnPauseMenu').addEventListener('click', () => { this.stopLoop(); this.ui.showScreen('mainMenu'); });

    // Touch / mobile
    this._bindTouch();
  }

  _bindTouch() {
    let touchStartX = 0, touchStartY = 0;
    const DEAD_ZONE = 15;

    const onMove = (cx, cy) => {
      const dx = cx - touchStartX;
      const dy = cy - touchStartY;
      this.input.left  = dx < -DEAD_ZONE;
      this.input.right = dx > DEAD_ZONE;
      this.input.up    = dy < -DEAD_ZONE;
      this.input.down  = dy > DEAD_ZONE;
    };

    this.canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.input.left = this.input.right = this.input.up = this.input.down = false;
    });
  }

  // ---- INIT ----
  startGame() {
    this.gameTime = 0;
    this.score    = 0;
    this.kills    = 0;
    this.levelUpPending = false;

    // Reset input
    Object.keys(this.input).forEach(k => this.input[k] = false);

    // Systems
    this.world     = new World();
    this.player    = new Player();
    this.enemies   = new EnemySystem();
    this.weapons   = new WeaponSystem();
    this.particles = new ParticleSystem();

    if (!this.ui) this.ui = new UIManager(this);

    // Camera
    this.camX = 0; this.camY = 0;

    // Starting weapon
    this.player.addWeapon('MAGIC_BOLT');

    // Show game
    this.ui.showScreen('gameScreen');
    this.state = 'playing';
    this._startLoop();
  }

  // ---- LOOP ----
  _startLoop() {
    this.running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame((t) => this._loop(t));
  }

  stopLoop() {
    this.running = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  }

  _loop(timestamp) {
    if (!this.running) return;
    this.dt = Math.min((timestamp - this._lastTime) / 1000, 0.05);
    this._lastTime = timestamp;

    if (this.state === 'playing') {
      this._update();
      this._draw();
    } else if (this.state === 'paused') {
      this._draw(); // draw frozen frame
    }

    this._rafId = requestAnimationFrame((t) => this._loop(t));
  }

  // ---- UPDATE ----
  _update() {
    const dt = this.dt;
    this.gameTime += dt;

    // Check game time limit
    if (this.gameTime >= CONFIG.GAME_DURATION) {
      this._victory();
      return;
    }

    // Player update
    this.player.update(dt, this.input);

    // XP magnet
    const magnetR = this.player.xpMagnetRadius;
    for (const gem of this.particles.xpGems) {
      if (gem.collected) continue;
      const d = Utils.dist(this.player.x, this.player.y, gem.x, gem.y);
      if (d < magnetR) {
        // Attract
        const a = Utils.angle(gem.x, gem.y, this.player.x, this.player.y);
        const spd = Math.max(200, (magnetR - d) * 5);
        gem.vx += Math.cos(a) * spd * dt * 4;
        gem.vy += Math.sin(a) * spd * dt * 4;
      }
      if (d < this.player.radius + gem.r + 8) {
        gem.collected = true;
        const leveled = this.player.gainXp(gem.xp);
        this.score += gem.xp;
        this.ui.spawnFloatText(`+${gem.xp} XP`,
          gem.x - this.camX + this.canvas.width / 2,
          gem.y - this.camY + this.canvas.height / 2,
          'xp'
        );
        if (leveled) this._onLevelUp();
      }
    }

    // Enemies + weapons
    this.enemies.update(dt, this.player, this.particles, this);
    this.weapons.update(dt, this.player, this.enemies.enemies, this.particles, this);
    this.particles.update(dt);

    // Camera smooth follow
    this.camX = Utils.lerp(this.camX, this.player.x, CONFIG.CAM_LERP);
    this.camY = Utils.lerp(this.camY, this.player.y, CONFIG.CAM_LERP);

    // Player regen heal text (occasionally)
    if (this.player.regen > 0 && Math.floor(this.gameTime) !== Math.floor(this.gameTime - dt)) {
      const healed = Math.min(this.player.regen, this.player.maxHp - this.player.hp);
      if (healed > 0.1) {
        this.ui.spawnFloatText(`+${healed.toFixed(1)} HP`,
          this.canvas.width / 2 + Utils.rand(-20, 20),
          this.canvas.height / 2 - 30,
          'heal'
        );
      }
    }

    // HUD
    this.ui.updateHUD(this.player, this.gameTime, this.score, this.kills);

    // Death check
    if (this.player.hp <= 0) this._gameOver();
  }

  // ---- DRAW ----
  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    ctx.clearRect(0, 0, W, H);

    // World
    this.world.draw(ctx, this.camX, this.camY, W, H);

    // Particles (XP gems, behind everything)
    // (drawn in same pass as normal particles)

    // Enemies
    this.enemies.draw(ctx, this.camX, this.camY, W, H);

    // Weapon AOE / projectiles
    this.weapons.draw(ctx, this.camX, this.camY, W, H);

    // Particles
    this.particles.draw(ctx, this.camX, this.camY, W, H);

    // Player
    this.player.draw(ctx, this.camX, this.camY, W, H);

    // Debug enemy count (small)
    if (window._debug) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px monospace';
      ctx.fillText(`enemies: ${this.enemies.getActiveCount()} | proj: ${this.weapons.projectiles.length}`, 10, H - 10);
    }
  }

  // ---- EVENTS ----
  damageEnemy(enemy, damage, player, projectile = null) {
    const kb = projectile ? Math.atan2(projectile.vy, projectile.vx) : Math.atan2(enemy.y - player.y, enemy.x - player.x);
    const actualDmg = this.enemies.applyHit(enemy, damage, kb);

    // Apply burn
    if (projectile && projectile.burnDamage) {
      this.enemies.applyBurn(enemy, projectile.burnDamage, projectile.burnDuration);
    }

    // Float text
    const sx = enemy.x - this.camX + this.canvas.width / 2;
    const sy = enemy.y - this.camY + this.canvas.height / 2;
    const isCrit = projectile && projectile.isCrit;
    this.ui.spawnFloatText(
      isCrit ? `✦${Math.round(actualDmg)}` : Math.round(actualDmg),
      sx + Utils.rand(-15, 15),
      sy - Utils.rand(0, 20),
      isCrit ? 'crit' : 'damage'
    );

    if (enemy.hp <= 0) {
      // Die
      const particles = this.particles;
      const game = this;
      this.enemies._die(enemy, player, particles, game);
    }
  }

  damagePlayer(amount) {
    const actual = this.player.takeDamage(amount);
    if (actual > 0) {
      this.ui.screenFlash('red');
      this.particles.spawnBlood(this.player.x, this.player.y, 5);
      const sx = this.canvas.width / 2;
      const sy = this.canvas.height / 2;
      this.ui.spawnFloatText(`-${actual}`, sx + Utils.rand(-20, 20), sy - 40, 'damage');
    }
  }

  _onLevelUp() {
    this.state = 'levelup';
    this.particles.spawnLevelUpBurst(this.player.x, this.player.y);
    this.ui.screenFlash('gold');
    this.ui.showLevelUp(this.player, (choice) => {
      this._applyChoice(choice);
      this.state = 'playing';
      this.ui.showScreen('gameScreen');
    });
  }

  _applyChoice(choice) {
    if (choice.type === 'new_weapon') {
      this.player.addWeapon(choice.weaponId);
    } else if (choice.type === 'weapon_upgrade') {
      const w = this.player.weapons.find(w => w.data.id === choice.weaponId);
      if (w) w.upgrade();
    } else if (choice.type === 'passive') {
      this.player.addPassive(choice.passiveId);
    }
  }

  pause() {
    this.state = 'paused';
    this.ui.showScreen('pauseScreen');
    document.getElementById('gameScreen').classList.add('active');
  }

  resume() {
    this.state = 'playing';
    this.ui.showScreen('gameScreen');
    this._lastTime = performance.now();
  }

  _gameOver() {
    this.state = 'gameover';
    this.stopLoop();
    this.ui.screenFlash('red');
    setTimeout(() => {
      this.ui.showGameOver(this.player, this.gameTime, this.score, this.kills, false);
    }, 600);
  }

  _victory() {
    this.state = 'victory';
    this.stopLoop();
    this.ui.screenFlash('gold');
    setTimeout(() => {
      this.ui.showGameOver(this.player, this.gameTime, this.score, this.kills, true);
    }, 600);
  }
}

// ---- BOOT ----
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  console.log('%c🧛 VAMPIRE SURVIVORS CLONE LOADED', 'color:#c0152a;font-size:1.2em;font-weight:bold');
  console.log('%cWASD / Arrow keys to move. Weapons fire automatically!', 'color:#e8b84b');
  console.log('%cType window._debug=true to show debug info', 'color:#888');
});
