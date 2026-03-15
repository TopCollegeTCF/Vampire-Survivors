// ===========================
// VAMPIRE SURVIVORS — ENEMIES.JS
// Enemy spawning, AI, rendering
// ===========================

let _enemyIdCounter = 0;

class Enemy {
  constructor() { this.id = 0; this.reset(); }

  reset() {
    this.x = 0; this.y = 0;
    this.hp = 0; this.maxHp = 0;
    this.speed = 0; this.damage = 0;
    this.radius = 14;
    this.active = false;
    this.data = null;
    this.hitFlash = 0;     // seconds of hit flash
    this.burnTimer = 0;    // burn DoT remaining
    this.burnDamage = 0;
    this.burnTick = 0;
    this.stagger = 0;      // knockback/stagger timer
    this.vx = 0; this.vy = 0;
    this.bobOffset = 0;
    this.xpSize = 'small';
  }
}

class EnemySystem {
  constructor() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.maxEnemies = 300;
  }

  reset() {
    this.enemies = [];
    this.spawnTimer = 0;
  }

  spawn(type, px, py, gameTime) {
    if (this.enemies.filter(e => e.active).length >= this.maxEnemies) return;

    const data = CONFIG.ENEMY_TYPES[type];
    if (!data) return;

    // Scale difficulty with time
    const scale = 1 + gameTime / 120; // +1 per 2 min

    let e = this.enemies.find(e => !e.active);
    if (!e) { e = new Enemy(); this.enemies.push(e); }

    const pos = Utils.spawnOnCircle(px, py, Utils.rand(CONFIG.SPAWN_RADIUS_MIN, CONFIG.SPAWN_RADIUS_MAX));
    e.reset();
    e.id = ++_enemyIdCounter;
    e.x = pos.x; e.y = pos.y;
    e.maxHp = Math.round(data.hp * Math.pow(scale, 0.6));
    e.hp = e.maxHp;
    e.speed = data.speed;
    e.damage = Math.round(data.damage * Math.pow(scale, 0.4));
    e.radius = data.radius;
    e.active = true;
    e.data = data;
    e.bobOffset = Math.random() * Math.PI * 2;
    e.xpSize = data.isBoss ? 'large' : (data.xp >= 8 ? 'medium' : 'small');
    e.vx = 0; e.vy = 0;
  }

  update(dt, player, particles, game) {
    const now = performance.now() * 0.001;

    for (const e of this.enemies) {
      if (!e.active) continue;

      // Burn DoT
      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.burnTick  -= dt;
        if (e.burnTick <= 0) {
          e.burnTick = 0.5;
          e.hp -= e.burnDamage;
          particles.spawnFireTrail(e.x, e.y);
          if (e.hp <= 0) { this._die(e, player, particles, game); continue; }
        }
      }

      // Hit flash cooldown
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.stagger > 0) {
        e.stagger -= dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vx *= (1 - dt * 8);
        e.vy *= (1 - dt * 8);
        continue;
      }

      // Chase player
      const dx = player.x - e.x, dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const spd = e.speed;

      e.x += (dx / dist) * spd * dt;
      e.y += (dy / dist) * spd * dt;

      // Slight separation from other enemies
      let sepX = 0, sepY = 0;
      for (const o of this.enemies) {
        if (!o.active || o === e) continue;
        const ddx = e.x - o.x, ddy = e.y - o.y;
        const dd = ddx * ddx + ddy * ddy;
        const minD = e.radius + o.radius;
        if (dd < minD * minD && dd > 0.01) {
          const d = Math.sqrt(dd);
          sepX += (ddx / d) * (minD - d) * 0.4;
          sepY += (ddy / d) * (minD - d) * 0.4;
        }
      }
      e.x += sepX * dt * 3;
      e.y += sepY * dt * 3;

      // Hit player
      if (!player.invincible && Utils.circlesOverlap(e.x, e.y, e.radius, player.x, player.y, player.radius)) {
        game.damagePlayer(e.damage);
      }
    }

    // Spawn enemies
    const wave = this._getCurrentWave(game.gameTime);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = wave.rate;
      const type = Utils.randChoice(wave.types);
      this.spawn(type, player.x, player.y, game.gameTime);

      // Extra spawns at wave ends
      const active = this.enemies.filter(e => e.active).length;
      if (active < 20 && game.gameTime > 30) {
        for (let i = 0; i < 3; i++) {
          const t = Utils.randChoice(wave.types);
          this.spawn(t, player.x, player.y, game.gameTime);
        }
      }
    }
  }

  applyHit(enemy, damage, knockbackDir = 0, knockback = 80) {
    const armor = 0;
    const actualDmg = Math.max(1, damage - armor);
    enemy.hp -= actualDmg;
    enemy.hitFlash = 0.1;
    // Knockback
    enemy.vx = Math.cos(knockbackDir) * knockback;
    enemy.vy = Math.sin(knockbackDir) * knockback;
    enemy.stagger = 0.08;
    return actualDmg;
  }

  applyBurn(enemy, burnDamage, burnDuration) {
    enemy.burnDamage = Math.max(enemy.burnDamage, burnDamage);
    enemy.burnTimer  = Math.max(enemy.burnTimer, burnDuration);
    enemy.burnTick   = Math.min(enemy.burnTick, 0.5);
  }

  _die(e, player, particles, game) {
    particles.spawnDeathExplosion(e.x, e.y, e.data.color);

    // Drop XP
    const xpVal = e.data.xp;
    const gemCount = e.data.isBoss ? 5 : (xpVal >= 10 ? 2 : 1);
    for (let i = 0; i < gemCount; i++) {
      particles.addXpGem(
        e.x + Utils.rand(-20, 20),
        e.y + Utils.rand(-20, 20),
        Math.ceil(xpVal / gemCount),
        e.xpSize
      );
    }

    game.score += e.data.scoreValue;
    game.kills++;
    e.active = false;
  }

  draw(ctx, camX, camY, W, H) {
    const hw = W / 2, hh = H / 2;
    const now = performance.now() * 0.001;

    for (const e of this.enemies) {
      if (!e.active) continue;
      const sx = e.x - camX + hw;
      const sy = e.y - camY + hh;
      if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;

      const bob = Math.sin(now * 2.5 + e.bobOffset) * 2;
      const flash = e.hitFlash > 0;
      const burning = e.burnTimer > 0;

      ctx.save();

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + e.radius * 0.9, e.radius * 0.9, e.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body glow
      if (!flash) {
        ctx.shadowBlur = burning ? 25 : 12;
        ctx.shadowColor = burning ? '#ff6600' : e.data.color;
      }

      // Main body circle
      const gradient = ctx.createRadialGradient(sx, sy + bob - e.radius * 0.2, 0, sx, sy + bob, e.radius);
      gradient.addColorStop(0, flash ? '#ffffff' : e.data.colorInner);
      gradient.addColorStop(1, flash ? 'rgba(255,200,200,0.8)' : e.data.color);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(sx, sy + bob, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.shadowBlur = 0;
      const eyeY = sy + bob - e.radius * 0.1;
      ctx.fillStyle = flash ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.8)';
      ctx.beginPath();
      ctx.arc(sx - e.radius * 0.28, eyeY, e.radius * 0.16, 0, Math.PI * 2);
      ctx.arc(sx + e.radius * 0.28, eyeY, e.radius * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Glowing eye pupils
      ctx.fillStyle = flash ? '#ff0000' : '#ff3030';
      ctx.shadowBlur = 8; ctx.shadowColor = '#ff0000';
      ctx.beginPath();
      ctx.arc(sx - e.radius * 0.28, eyeY, e.radius * 0.08, 0, Math.PI * 2);
      ctx.arc(sx + e.radius * 0.28, eyeY, e.radius * 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Boss crown
      if (e.data.isBoss) {
        ctx.fillStyle = '#e8b84b';
        ctx.shadowBlur = 15; ctx.shadowColor = '#e8b84b';
        ctx.font = `bold ${e.radius * 0.9}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('👑', sx, sy + bob - e.radius * 1.3);
        ctx.shadowBlur = 0;
      }

      // Burn overlay
      if (burning) {
        const opacity = 0.3 + 0.2 * Math.sin(now * 10);
        ctx.fillStyle = `rgba(255,100,0,${opacity})`;
        ctx.beginPath();
        ctx.arc(sx, sy + bob, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // HP Bar (only if damaged)
      if (e.hp < e.maxHp) {
        const barW = e.radius * 2.2;
        const barH = 4;
        const bx = sx - barW / 2;
        const by = sy - e.radius - 10 + bob;
        const pct = Utils.clamp(e.hp / e.maxHp, 0, 1);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(bx, by, barW, barH);

        const hpColor = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#c0152a';
        ctx.fillStyle = hpColor;
        ctx.fillRect(bx, by, barW * pct, barH);
      }
    }
  }

  _getCurrentWave(gameTime) {
    const waves = CONFIG.SPAWN_WAVES;
    let wave = waves[0];
    for (const w of waves) {
      if (gameTime >= w.time) wave = w;
      else break;
    }
    return wave;
  }

  getActiveCount() { return this.enemies.filter(e => e.active).length; }
}
