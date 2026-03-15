// ===========================
// VAMPIRE SURVIVORS — WEAPONS.JS
// Weapon instances, projectiles, pools
// ===========================

class Projectile {
  constructor() { this.reset(); }
  reset() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.damage = 0;
    this.radius = 8;
    this.life = 0; this.maxLife = 1;
    this.active = false;
    this.color = '#fff';
    this.glowColor = '#fff';
    this.piercing = 1;
    this.hitEnemies = null;
    this.type = 'bolt';
    this.weaponId = '';
    this.burnDamage = 0; this.burnDuration = 0;
    this.isCrit = false;
    // Boomerang specific
    this.returning = false;
    this.ownerX = 0; this.ownerY = 0;
    this.maxDist = 0; this.distTraveled = 0;
  }
}

class AoeZone {
  constructor() { this.reset(); }
  reset() {
    this.x = 0; this.y = 0;
    this.radius = 50;
    this.damage = 0;
    this.tickRate = 0.5;
    this.tickTimer = 0;
    this.life = 0;
    this.active = false;
    this.color = 'rgba(100,200,255,0.3)';
    this.hitEnemies = new Set();
    this.type = 'pool';
  }
}

class WeaponInstance {
  constructor(data, player) {
    this.data = { ...data };
    this.player = player;
    this.level = 1;
    this.timer = 0;

    // Computed stats
    this.damage      = data.baseDamage;
    this.cooldown    = data.baseCooldown;
    this.range       = data.baseRange;
    this.count       = data.projectileCount || 1;
    this.speed       = data.speed || 300;
    this.piercing    = data.piercing || 1;
    this.arcAngle    = data.arcAngle || Math.PI * 0.5;
    this.chainCount  = data.chainCount || 0;
    this.chainRange  = data.chainRange || 120;
    this.poolRadius  = data.poolRadius || 50;
    this.poolDur     = data.poolDuration || 3.0;
    this.tickRate    = data.tickRate || 0.5;
    this.burnDamage  = data.burnDamage || 0;
    this.burnDuration= data.burnDuration || 0;
  }

  upgrade() {
    if (this.level >= this.data.maxLevel) return;
    const upg = this.data.upgrades[this.level - 1];
    if (!upg) return;
    if (upg.dmg)     this.damage   *= upg.dmg;
    if (upg.cd)      this.cooldown *= upg.cd;
    if (upg.range)   this.range    *= upg.range;
    if (upg.count)   this.count    += upg.count;
    if (upg.piercing)this.piercing += upg.piercing;
    if (upg.arc)     this.arcAngle *= upg.arc;
    if (upg.chain)   this.chainCount += upg.chain;
    if (upg.chainR)  this.chainRange *= upg.chainR;
    if (upg.poolR)   this.poolRadius *= upg.poolR;
    if (upg.poolDur) this.poolDur   *= upg.poolDur;
    if (upg.burnDmg) this.burnDamage  *= upg.burnDmg;
    if (upg.burnDur) this.burnDuration *= upg.burnDur;
    if (upg.speed)   this.speed    *= upg.speed;
    this.level++;
  }

  getEffectiveCooldown() {
    return this.cooldown * (this.player.cdMult || 1);
  }

  getEffectiveDamage() {
    return this.damage * (this.player.dmgMult || 1);
  }
}

class WeaponSystem {
  constructor() {
    this.projectiles = [];
    this.aoeZones    = [];
    this.maxProjectiles = 200;
  }

  // ---- Fire logic per weapon type ----
  fire(weapon, player, enemies, particles, game) {
    const id = weapon.data.id;
    const cd = weapon.getEffectiveCooldown();
    weapon.timer += game.dt;
    if (weapon.timer < cd) return;
    weapon.timer = 0;

    switch (id) {
      case 'SWORD_ARC':       this._fireSwordArc(weapon, player, enemies, particles, game); break;
      case 'MAGIC_BOLT':      this._fireMagicBolt(weapon, player, enemies, particles, game); break;
      case 'HOLY_WATER':      this._fireHolyWater(weapon, player, enemies, particles, game); break;
      case 'CROSS_BOOMERANG': this._fireCross(weapon, player, enemies, particles, game); break;
      case 'LIGHTNING':       this._fireLightning(weapon, player, enemies, particles, game); break;
      case 'FIRE_WAND':       this._fireFireWand(weapon, player, enemies, particles, game); break;
      case 'GARLIC':          this._fireGarlic(weapon, player, enemies, particles, game); break;
      case 'SHADOW_BLADE':    this._fireShadowBlade(weapon, player, enemies, particles, game); break;
    }
  }

  _fireSwordArc(weapon, player, enemies, particles, game) {
    // Arc attack in player's facing direction
    const dir = player.lastDir || 0;
    const halfArc = weapon.arcAngle / 2;
    const dmg = weapon.getEffectiveDamage();
    for (const e of enemies) {
      if (!e.active) continue;
      const d = Utils.dist(player.x, player.y, e.x, e.y);
      if (d > weapon.range) continue;
      const a = Math.atan2(e.y - player.y, e.x - player.x);
      let diff = a - dir;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= halfArc) {
        game.damageEnemy(e, dmg, player);
        particles.spawnHitSpark(e.x, e.y, '#ffe44a', 5);
      }
    }
    // Visual arc projectile
    for (let i = 0; i < weapon.count; i++) {
      const angOffset = weapon.count > 1 ? ((i / (weapon.count - 1)) - 0.5) * weapon.arcAngle : 0;
      const a = dir + angOffset;
      const p = this._spawnProjectile();
      p.x = player.x; p.y = player.y;
      p.vx = Math.cos(a) * 500; p.vy = Math.sin(a) * 500;
      p.damage = 0; // already applied
      p.life = 0.15; p.maxLife = 0.15;
      p.radius = 12; p.piercing = 99;
      p.color = '#ffe44a'; p.glowColor = '#ffaa00';
      p.type = 'arc'; p.weaponId = 'SWORD_ARC';
      p.hitEnemies = new Set();
    }
  }

  _fireMagicBolt(weapon, player, enemies, particles, game) {
    const targets = this._getNearestEnemies(player, enemies, weapon.range, weapon.count);
    for (const e of targets) {
      const p = this._spawnProjectile();
      const a = Utils.angle(player.x, player.y, e.x, e.y);
      p.x = player.x; p.y = player.y;
      p.vx = Math.cos(a) * weapon.speed; p.vy = Math.sin(a) * weapon.speed;
      p.damage = weapon.getEffectiveDamage();
      p.life = weapon.range / weapon.speed;
      p.maxLife = p.life;
      p.radius = 7; p.piercing = weapon.piercing;
      p.color = '#c060ff'; p.glowColor = '#9020e0';
      p.type = 'bolt'; p.weaponId = 'MAGIC_BOLT';
      p.hitEnemies = new Set();
      p.isCrit = Utils.chance(player.critChance || 0);
      if (p.isCrit) { p.damage *= 2; p.radius = 11; }
    }
  }

  _fireHolyWater(weapon, player, enemies, particles, game) {
    const targets = this._getNearestEnemies(player, enemies, weapon.range, weapon.count);
    const spawnPos = targets.length > 0
      ? { x: targets[0].x, y: targets[0].y }
      : { x: player.x + Utils.rand(-weapon.range, weapon.range), y: player.y + Utils.rand(-weapon.range, weapon.range) };

    const zone = this._spawnAoeZone();
    zone.x = spawnPos.x; zone.y = spawnPos.y;
    zone.radius = weapon.poolRadius;
    zone.damage = weapon.getEffectiveDamage();
    zone.tickRate = weapon.tickRate;
    zone.tickTimer = 0;
    zone.life = weapon.poolDur;
    zone.color = 'rgba(100,200,255,0.25)';
    zone.glowColor = '#80ccff';
    zone.type = 'pool';
    zone.hitEnemies = new Set();

    // Throw visual
    const p = this._spawnProjectile();
    const a = Utils.angle(player.x, player.y, spawnPos.x, spawnPos.y);
    p.x = player.x; p.y = player.y;
    p.vx = Math.cos(a) * 280; p.vy = Math.sin(a) * 280;
    p.damage = 0;
    p.life = Utils.dist(player.x, player.y, spawnPos.x, spawnPos.y) / 280;
    p.maxLife = p.life;
    p.radius = 6; p.piercing = 1;
    p.color = '#80ccff'; p.glowColor = '#40aaff';
    p.type = 'bolt'; p.weaponId = 'HOLY_WATER_THROW';
    p.hitEnemies = new Set();
  }

  _fireCross(weapon, player, enemies, particles, game) {
    const targets = this._getNearestEnemies(player, enemies, weapon.range * 2, weapon.count);
    for (let i = 0; i < weapon.count; i++) {
      const a = targets[i]
        ? Utils.angle(player.x, player.y, targets[i].x, targets[i].y)
        : Math.random() * Math.PI * 2;

      const p = this._spawnProjectile();
      p.x = player.x; p.y = player.y;
      p.vx = Math.cos(a) * weapon.speed; p.vy = Math.sin(a) * weapon.speed;
      p.damage = weapon.getEffectiveDamage();
      p.maxDist = weapon.range;
      p.distTraveled = 0;
      p.life = 3.0; p.maxLife = 3.0;
      p.radius = 10; p.piercing = 99;
      p.color = '#fffaaa'; p.glowColor = '#ffeeaa';
      p.type = 'boomerang'; p.weaponId = 'CROSS_BOOMERANG';
      p.returning = false;
      p.ownerX = player.x; p.ownerY = player.y;
      p.hitEnemies = new Set();
    }
  }

  _fireLightning(weapon, player, enemies, particles, game) {
    const nearest = this._getNearestEnemies(player, enemies, weapon.range, 1);
    if (!nearest.length) return;

    const hitSet = new Set();
    let current = nearest[0];
    let cx = player.x, cy = player.y;
    const dmg = weapon.getEffectiveDamage();
    const isCrit = Utils.chance(player.critChance || 0);

    // Main target
    game.damageEnemy(current, isCrit ? dmg * 2 : dmg, player);
    particles.spawnLightningEffect(cx, cy, current.x, current.y);
    particles.spawnHitSpark(current.x, current.y, '#a0e0ff', 8);
    hitSet.add(current);
    cx = current.x; cy = current.y;

    // Chain
    for (let c = 0; c < weapon.chainCount; c++) {
      const chainTarget = enemies.find(e =>
        e.active && !hitSet.has(e) &&
        Utils.dist(cx, cy, e.x, e.y) < weapon.chainRange
      );
      if (!chainTarget) break;
      game.damageEnemy(chainTarget, (isCrit ? dmg * 2 : dmg) * 0.7, player);
      particles.spawnLightningEffect(cx, cy, chainTarget.x, chainTarget.y);
      particles.spawnHitSpark(chainTarget.x, chainTarget.y, '#a0e0ff', 5);
      hitSet.add(chainTarget);
      cx = chainTarget.x; cy = chainTarget.y;
    }
  }

  _fireFireWand(weapon, player, enemies, particles, game) {
    const targets = this._getNearestEnemies(player, enemies, weapon.range, weapon.count);
    for (const e of targets) {
      const p = this._spawnProjectile();
      const a = Utils.angle(player.x, player.y, e.x, e.y);
      p.x = player.x; p.y = player.y;
      p.vx = Math.cos(a) * weapon.speed; p.vy = Math.sin(a) * weapon.speed;
      p.damage = weapon.getEffectiveDamage();
      p.life = weapon.range / weapon.speed;
      p.maxLife = p.life;
      p.radius = 9; p.piercing = 1;
      p.color = '#ff8800'; p.glowColor = '#ff4400';
      p.type = 'fire'; p.weaponId = 'FIRE_WAND';
      p.burnDamage = weapon.burnDamage;
      p.burnDuration = weapon.burnDuration;
      p.hitEnemies = new Set();
      p.isCrit = Utils.chance(player.critChance || 0);
      if (p.isCrit) p.damage *= 2;
    }
  }

  _fireGarlic(weapon, player, enemies, particles, game) {
    const dmg = weapon.getEffectiveDamage();
    const isCrit = Utils.chance(player.critChance || 0);
    for (const e of enemies) {
      if (!e.active) continue;
      if (Utils.dist(player.x, player.y, e.x, e.y) <= weapon.range) {
        game.damageEnemy(e, isCrit ? dmg * 2 : dmg, player);
        if (isCrit) particles.spawnHitSpark(e.x, e.y, '#ffe44a', 3);
      }
    }
  }

  _fireShadowBlade(weapon, player, enemies, particles, game) {
    const dmg = weapon.getEffectiveDamage();
    for (let i = 0; i < weapon.count; i++) {
      const a = (i / weapon.count) * Math.PI * 2;
      const p = this._spawnProjectile();
      p.x = player.x; p.y = player.y;
      p.vx = Math.cos(a) * weapon.speed; p.vy = Math.sin(a) * weapon.speed;
      p.damage = dmg;
      p.life = weapon.range / weapon.speed;
      p.maxLife = p.life;
      p.radius = 6; p.piercing = weapon.piercing;
      p.color = '#8040ff'; p.glowColor = '#6020cc';
      p.type = 'bolt'; p.weaponId = 'SHADOW_BLADE';
      p.hitEnemies = new Set();
      p.isCrit = Utils.chance(player.critChance || 0);
      if (p.isCrit) p.damage *= 2;
    }
  }

  // ---- Update ----
  update(dt, player, enemies, particles, game) {
    this._updateProjectiles(dt, enemies, particles, game);
    this._updateAoeZones(dt, enemies, particles, game);
    // Fire weapons
    for (const w of player.weapons) {
      this.fire(w, player, enemies, particles, game);
    }
  }

  _updateProjectiles(dt, enemies, particles, game) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.active) { this.projectiles.splice(i, 1); continue; }

      // Boomerang logic
      if (p.type === 'boomerang') {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        p.distTraveled += speed * dt;
        if (!p.returning && p.distTraveled >= p.maxDist) {
          p.returning = true;
          p.hitEnemies.clear();
        }
        if (p.returning) {
          const owner = game.player;
          const a = Utils.angle(p.x, p.y, owner.x, owner.y);
          const returnSpeed = 380;
          p.vx = Math.cos(a) * returnSpeed;
          p.vy = Math.sin(a) * returnSpeed;
          if (Utils.dist(p.x, p.y, owner.x, owner.y) < 20) { p.active = false; continue; }
        }
      }

      // Fire trail
      if (p.type === 'fire' && Math.random() < 0.4) {
        particles.spawnFireTrail(p.x, p.y);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }

      // Hit detection
      if (p.damage > 0) {
        for (const e of enemies) {
          if (!e.active) continue;
          if (p.hitEnemies && p.hitEnemies.has(e.id)) continue;
          if (Utils.circlesOverlap(p.x, p.y, p.radius, e.x, e.y, e.radius)) {
            game.damageEnemy(e, p.damage, game.player, p);
            particles.spawnHitSpark(e.x, e.y, p.glowColor, 4);
            if (p.hitEnemies) p.hitEnemies.add(e.id);
            if (!p.piercing || p.piercing <= 0 || p.hitEnemies.size >= p.piercing) {
              p.active = false; break;
            }
          }
        }
      }
    }
  }

  _updateAoeZones(dt, enemies, particles, game) {
    for (let i = this.aoeZones.length - 1; i >= 0; i--) {
      const z = this.aoeZones[i];
      if (!z.active) { this.aoeZones.splice(i, 1); continue; }
      z.life -= dt;
      if (z.life <= 0) { z.active = false; continue; }
      z.tickTimer += dt;
      if (z.tickTimer >= z.tickRate) {
        z.tickTimer = 0;
        z.hitEnemies.clear();
        for (const e of enemies) {
          if (!e.active) continue;
          if (Utils.dist(z.x, z.y, e.x, e.y) < z.radius + e.radius) {
            game.damageEnemy(e, z.damage, game.player);
            particles.spawnHitSpark(e.x, e.y, z.glowColor || '#80ccff', 2);
          }
        }
      }
    }
  }

  // ---- Draw ----
  draw(ctx, camX, camY, W, H) {
    const hw = W / 2, hh = H / 2;

    // AOE Zones
    for (const z of this.aoeZones) {
      if (!z.active) continue;
      const sx = z.x - camX + hw, sy = z.y - camY + hh;
      if (sx < -z.radius || sx > W + z.radius || sy < -z.radius || sy > H + z.radius) continue;
      const alpha = Utils.clamp(z.life / 0.5, 0, 1) * 0.7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 30; ctx.shadowColor = z.glowColor || '#80ccff';

      // Outer ring
      ctx.strokeStyle = z.glowColor || '#80ccff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, z.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner fill
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, z.radius);
      grad.addColorStop(0, z.color || 'rgba(100,200,255,0.1)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, z.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Projectiles
    for (const p of this.projectiles) {
      if (!p.active) continue;
      const sx = p.x - camX + hw, sy = p.y - camY + hh;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;

      ctx.save();
      ctx.shadowBlur = 20; ctx.shadowColor = p.glowColor || p.color;

      if (p.type === 'boomerang') {
        // Cross shape
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        const spin = performance.now() * 0.01;
        ctx.translate(sx, sy);
        ctx.rotate(spin);
        ctx.beginPath();
        ctx.moveTo(-p.radius * 1.2, 0); ctx.lineTo(p.radius * 1.2, 0);
        ctx.moveTo(0, -p.radius * 1.2); ctx.lineTo(0, p.radius * 1.2);
        ctx.stroke();
      } else if (p.type === 'arc') {
        // Slash arc
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'fire') {
        // Fireball
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.radius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius * 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Generic bolt
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.radius);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.4, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius * (p.isCrit ? 1.5 : 1), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ---- Helpers ----
  _spawnProjectile() {
    if (this.projectiles.length >= this.maxProjectiles) {
      this.projectiles[0].active = false;
      this.projectiles.shift();
    }
    const p = new Projectile();
    p.active = true;
    this.projectiles.push(p);
    return p;
  }

  _spawnAoeZone() {
    const z = new AoeZone();
    z.active = true;
    this.aoeZones.push(z);
    return z;
  }

  _getNearestEnemies(player, enemies, range, count) {
    const active = enemies.filter(e => e.active);
    active.sort((a, b) =>
      Utils.distSq(player.x, player.y, a.x, a.y) -
      Utils.distSq(player.x, player.y, b.x, b.y)
    );
    return active.filter(e => Utils.dist(player.x, player.y, e.x, e.y) <= range).slice(0, count);
  }
}
