// ===========================
// VAMPIRE SURVIVORS — PLAYER.JS
// Player state, movement, rendering
// ===========================

class Player {
  constructor() { this.reset(); }

  reset() {
    // Position
    this.x = 0; this.y = 0;

    // Stats
    this.maxHp       = CONFIG.PLAYER_BASE_HP;
    this.hp          = this.maxHp;
    this.speed       = CONFIG.PLAYER_BASE_SPEED;
    this.armor       = 0;
    this.regen       = 0;
    this.regenTimer  = 0;
    this.critChance  = 5;
    this.cdMult      = 1.0;
    this.dmgMult     = 1.0;
    this.xpMult      = 1.0;
    this.xpMagnetRadius = 60;

    // Level / XP
    this.level   = 1;
    this.xp      = 0;
    this.xpToNext = CONFIG.XP_LEVELS[1];

    // Combat
    this.radius     = CONFIG.PLAYER_RADIUS;
    this.invincible = false;
    this.iframeTimer = 0;

    // Weapons / passives
    this.weapons    = [];
    this.passives   = {}; // { id: level }

    // Visual
    this.lastDir    = 0;
    this.facing     = 1; // 1 = right, -1 = left
    this.bobOffset  = 0;
    this.walkAnim   = 0;
    this.isMoving   = false;

    // Input state
    this.keys = { up:false, down:false, left:false, right:false };
  }

  addWeapon(weaponId) {
    const data = WEAPONS_DATA[weaponId];
    if (!data) return;
    const existing = this.weapons.find(w => w.data.id === weaponId);
    if (existing) { existing.upgrade(); return; }
    this.weapons.push(new WeaponInstance(data, this));
  }

  addPassive(passiveId) {
    const data = PASSIVES_DATA[passiveId];
    if (!data) return;
    const lvl = (this.passives[passiveId] || 0) + 1;
    if (lvl > data.maxLevel) return;
    this.passives[passiveId] = lvl;
    data.apply(this);
  }

  gainXp(amount) {
    const actual = Math.round(amount * (this.xpMult || 1));
    this.xp += actual;
    let leveled = false;
    while (this.level < CONFIG.XP_LEVELS.length - 1 && this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = CONFIG.XP_LEVELS[this.level] - CONFIG.XP_LEVELS[this.level - 1];
      leveled = true;
    }
    return leveled;
  }

  getXpPercent() {
    return Utils.clamp(this.xp / this.xpToNext, 0, 1);
  }

  takeDamage(amount) {
    if (this.invincible) return 0;
    const actual = Math.max(1, amount - (this.armor || 0));
    this.hp = Math.max(0, this.hp - actual);
    this.invincible = true;
    this.iframeTimer = CONFIG.PLAYER_IFRAMES / 1000;
    return actual;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  update(dt, input) {
    // I-frames
    if (this.invincible) {
      this.iframeTimer -= dt;
      if (this.iframeTimer <= 0) { this.invincible = false; }
    }

    // Regen
    if (this.regen > 0) {
      this.regenTimer += dt;
      if (this.regenTimer >= 1.0) {
        this.regenTimer = 0;
        this.heal(this.regen);
      }
    }

    // Movement
    let dx = 0, dy = 0;
    if (input.up   || input.w) dy -= 1;
    if (input.down || input.s) dy += 1;
    if (input.left || input.a) dx -= 1;
    if (input.right|| input.d) dx += 1;

    const moving = dx !== 0 || dy !== 0;
    this.isMoving = moving;

    if (moving) {
      const norm = Utils.normalize(dx, dy);
      this.x += norm.x * this.speed * dt;
      this.y += norm.y * this.speed * dt;
      this.lastDir = Math.atan2(dy, dx);
      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      this.walkAnim += dt * 8;
    }

    // Clamp to world
    this.x = Utils.clamp(this.x, -CONFIG.WORLD_W / 2, CONFIG.WORLD_W / 2);
    this.y = Utils.clamp(this.y, -CONFIG.WORLD_H / 2, CONFIG.WORLD_H / 2);
  }

  draw(ctx, camX, camY, W, H) {
    const sx = this.x - camX + W / 2;
    const sy = this.y - camY + H / 2;

    const now = performance.now() * 0.001;
    const bob = this.isMoving ? Math.sin(this.walkAnim) * 3 : 0;
    const bobY = sy + bob;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius, this.radius * 0.9, this.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // I-frame flicker
    if (this.invincible && Math.floor(now * 12) % 2 === 0) {
      ctx.restore();
      return;
    }

    // Cape
    ctx.shadowBlur = 20; ctx.shadowColor = '#6a0dad';
    const capeGrad = ctx.createLinearGradient(sx - this.radius, bobY, sx + this.radius, bobY + this.radius * 2.5);
    capeGrad.addColorStop(0, '#4a0080');
    capeGrad.addColorStop(1, '#1a0030');
    ctx.fillStyle = capeGrad;
    ctx.beginPath();
    ctx.moveTo(sx - this.radius * 0.8, bobY + this.radius * 0.3);
    ctx.lineTo(sx - this.radius * 1.3, bobY + this.radius * 2.8);
    ctx.lineTo(sx + this.radius * 1.3, bobY + this.radius * 2.8);
    ctx.lineTo(sx + this.radius * 0.8, bobY + this.radius * 0.3);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.shadowBlur = 15; ctx.shadowColor = '#c0152a';
    const bodyGrad = ctx.createRadialGradient(sx - 3, bobY - 3, 1, sx, bobY, this.radius);
    bodyGrad.addColorStop(0, '#ff4466');
    bodyGrad.addColorStop(0.5, '#c0152a');
    bodyGrad.addColorStop(1, '#6a0000');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(sx, bobY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.shadowBlur = 0;
    // Eyes
    const eyeOffset = this.facing * 4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(sx + eyeOffset - 4, bobY - 2, 3, 0, Math.PI * 2);
    ctx.arc(sx + eyeOffset + 4, bobY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff3333';
    ctx.shadowBlur = 6; ctx.shadowColor = '#ff0000';
    ctx.beginPath();
    ctx.arc(sx + eyeOffset - 4, bobY - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(sx + eyeOffset + 4, bobY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fangs
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(sx + eyeOffset - 3, bobY + 5);
    ctx.lineTo(sx + eyeOffset - 5, bobY + 10);
    ctx.lineTo(sx + eyeOffset - 1, bobY + 10);
    ctx.closePath();
    ctx.moveTo(sx + eyeOffset + 3, bobY + 5);
    ctx.lineTo(sx + eyeOffset + 1, bobY + 10);
    ctx.lineTo(sx + eyeOffset + 5, bobY + 10);
    ctx.closePath();
    ctx.fill();

    // Collar
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(sx, bobY + this.radius * 0.5, this.radius * 0.7, Math.PI * 0.1, Math.PI * 0.9);
    ctx.fill();

    // Aura when invincible
    if (this.invincible) {
      ctx.strokeStyle = 'rgba(192,21,42,0.6)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 20; ctx.shadowColor = '#c0152a';
      ctx.beginPath();
      ctx.arc(sx, bobY, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Garlic aura visualization
    const garlicWeapon = this.weapons.find(w => w.data.id === 'GARLIC');
    if (garlicWeapon) {
      ctx.save();
      const t = performance.now() * 0.001;
      ctx.strokeStyle = `rgba(100,255,100,${0.15 + 0.1 * Math.sin(t * 4)})`;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10; ctx.shadowColor = '#80ff80';
      ctx.beginPath();
      ctx.arc(sx, sy, garlicWeapon.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
