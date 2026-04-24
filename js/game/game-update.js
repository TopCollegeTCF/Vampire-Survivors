// ===========================
// GAME UPDATE - Методы обновления
// ===========================

Game.prototype._update = function() {
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
};

Game.prototype._draw = function() {
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
};
