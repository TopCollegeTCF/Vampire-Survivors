// ===========================
// WEAPONS CORE - Базовые классы оружия
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
