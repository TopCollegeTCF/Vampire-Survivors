// ===========================
// GAME EVENTS - Обработка событий
// ===========================

Game.prototype.damageEnemy = function(enemy, damage, player, projectile = null) {
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
};

Game.prototype.damagePlayer = function(amount) {
  const actual = this.player.takeDamage(amount);
  if (actual > 0) {
    this.ui.screenFlash('red');
    this.particles.spawnBlood(this.player.x, this.player.y, 5);
    const sx = this.canvas.width / 2;
    const sy = this.canvas.height / 2;
    this.ui.spawnFloatText(`-${actual}`, sx + Utils.rand(-20, 20), sy - 40, 'damage');
  }
};

Game.prototype._onLevelUp = function() {
  this.state = 'levelup';
  this.particles.spawnLevelUpBurst(this.player.x, this.player.y);
  this.ui.screenFlash('gold');
  this.ui.showLevelUp(this.player, (choice) => {
    this._applyChoice(choice);
    this.state = 'playing';
    this.ui.showScreen('gameScreen');
  });
};

Game.prototype._applyChoice = function(choice) {
  if (choice.type === 'new_weapon') {
    this.player.addWeapon(choice.weaponId);
  } else if (choice.type === 'weapon_upgrade') {
    const w = this.player.weapons.find(w => w.data.id === choice.weaponId);
    if (w) w.upgrade();
  } else if (choice.type === 'passive') {
    this.player.addPassive(choice.passiveId);
  }
};

Game.prototype._gameOver = function() {
  this.state = 'gameover';
  this.stopLoop();
  this.ui.screenFlash('red');
  setTimeout(() => {
    this.ui.showGameOver(this.player, this.gameTime, this.score, this.kills, false);
  }, 600);
};

Game.prototype._victory = function() {
  this.state = 'victory';
  this.stopLoop();
  this.ui.screenFlash('gold');
  setTimeout(() => {
    this.ui.showGameOver(this.player, this.gameTime, this.score, this.kills, true);
  }, 600);
};
