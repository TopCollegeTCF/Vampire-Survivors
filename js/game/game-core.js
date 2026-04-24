// ===========================
// GAME CORE - Основной класс игры
// ===========================

class Game {
  constructor() {
    this.canvas  = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.error('❌ gameCanvas не найден!');
      return;
    }
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

    // Buttons - с проверками на существование
    const btnStart = document.getElementById('btnStart');
    if (btnStart) btnStart.addEventListener('click', () => this.startGame());
    
    const btnHow = document.getElementById('btnHow');
    if (btnHow) btnHow.addEventListener('click', () => this.ui && this.ui.showScreen('howToPlay'));
    
    const btnBackMenu = document.getElementById('btnBackMenu');
    if (btnBackMenu) btnBackMenu.addEventListener('click', () => this.ui && this.ui.showScreen('mainMenu'));
    
    const btnRestart = document.getElementById('btnRestart');
    if (btnRestart) btnRestart.addEventListener('click', () => this.startGame());
    
    const btnMainMenu = document.getElementById('btnMainMenu');
    if (btnMainMenu) btnMainMenu.addEventListener('click', () => { this.stopLoop(); this.ui && this.ui.showScreen('mainMenu'); });
    
    const btnResume = document.getElementById('btnResume');
    if (btnResume) btnResume.addEventListener('click', () => this.resume());
    
    const btnPauseMenu = document.getElementById('btnPauseMenu');
    if (btnPauseMenu) btnPauseMenu.addEventListener('click', () => { this.stopLoop(); this.ui && this.ui.showScreen('mainMenu'); });

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
}

console.log('%c🎮 Game Core загружен!', 'color:#4caf50;font-size:1em;font-weight:bold');
