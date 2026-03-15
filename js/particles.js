// ===========================
// VAMPIRE SURVIVORS — PARTICLES.JS
// Visual particles & effects
// ===========================

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.xpGems   = [];
    this.maxParticles = 400;
  }

  // ---- Spawn effects ----
  spawnBlood(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Utils.rand(30, 120);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r:  Utils.rand(2, 5),
        life: Utils.rand(0.4, 0.9),
        maxLife: 0.9,
        color: Utils.randChoice(['#c0152a','#8b0000','#ff2244']),
        gravity: 60,
        type: 'circle'
      });
    }
  }

  spawnHitSpark(x, y, color = '#ffe44a', count = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Utils.rand(60, 180);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Utils.rand(1.5, 3.5),
        life: Utils.rand(0.2, 0.5),
        maxLife: 0.5,
        color, type: 'circle', glow: true
      });
    }
  }

  spawnXpPopup(x, y, isLarge = false) {
    const count = isLarge ? 10 : 5;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Utils.rand(40, 100);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Utils.rand(2, 4),
        life: Utils.rand(0.5, 1.0),
        maxLife: 1.0,
        color: '#5dade2', type: 'circle', glow: true
      });
    }
  }

  spawnDeathExplosion(x, y, enemyColor = '#c0152a') {
    this.spawnBlood(x, y, 10);
    this.spawnHitSpark(x, y, enemyColor, 8);
    // Ring
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = Utils.rand(50, 150);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Utils.rand(3, 7),
        life: Utils.rand(0.4, 0.8),
        maxLife: 0.8,
        color: enemyColor, type: 'circle', fade: true
      });
    }
  }

  spawnLevelUpBurst(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Utils.rand(80, 250);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Utils.rand(3, 7),
        life: Utils.rand(0.6, 1.2),
        maxLife: 1.2,
        color: Utils.randChoice(['#e8b84b','#ffd97a','#fff','#ff6600']),
        type: 'star', glow: true
      });
    }
  }

  spawnFireTrail(x, y) {
    this.particles.push({
      x: x + Utils.rand(-4, 4),
      y: y + Utils.rand(-4, 4),
      vx: Utils.rand(-20, 20),
      vy: Utils.rand(-60, -120),
      r: Utils.rand(3, 7),
      life: Utils.rand(0.3, 0.6),
      maxLife: 0.6,
      color: Utils.randChoice(['#ff8800','#ff4400','#ffcc00']),
      type: 'circle', glow: true
    });
  }

  spawnLightningEffect(x1, y1, x2, y2) {
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const mx = Utils.lerp(x1, x2, t) + Utils.rand(-20, 20);
      const my = Utils.lerp(y1, y2, t) + Utils.rand(-20, 20);
      this.particles.push({
        x: mx, y: my,
        vx: 0, vy: 0,
        r: Utils.rand(2, 5),
        life: Utils.rand(0.1, 0.25),
        maxLife: 0.25,
        color: '#a0e0ff', type: 'circle', glow: true
      });
    }
  }

  spawnHealEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Utils.rand(30, 80);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        r: Utils.rand(2, 5),
        life: Utils.rand(0.5, 1.0),
        maxLife: 1.0,
        color: '#2ecc71', type: 'circle', glow: true
      });
    }
  }

  // ---- XP Gems ----
  addXpGem(x, y, xpValue, size = 'small') {
    const sizeData = CONFIG.XP_GEM_SIZES[size] || CONFIG.XP_GEM_SIZES.small;
    this.xpGems.push({
      x, y,
      vx: Utils.rand(-30, 30),
      vy: Utils.rand(-60, -20),
      r: sizeData.r,
      xp: xpValue,
      color: sizeData.color,
      life: 15.0, // seconds before despawn
      collected: false,
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: Utils.rand(2, 4)
    });
  }

  // ---- Update ----
  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.vx *= (1 - dt * 3);
      p.vy *= (1 - dt * 3);
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
    }

    // Trim if too many
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }

    // Update XP gems
    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const g = this.xpGems[i];
      if (g.collected) { this.xpGems.splice(i, 1); continue; }
      g.x  += g.vx * dt;
      g.y  += g.vy * dt;
      g.vy += 40 * dt; // gentle gravity
      g.vx *= (1 - dt * 2);
      g.vy *= (1 - dt * 2);
      g.life -= dt;
      if (g.life <= 0) { this.xpGems.splice(i, 1); }
    }
  }

  // ---- Draw ----
  draw(ctx, camX, camY, W, H) {
    const hw = W / 2, hh = H / 2;

    // Particles
    for (const p of this.particles) {
      const sx = p.x - camX + hw;
      const sy = p.y - camY + hh;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.glow) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
      }
      ctx.fillStyle = p.color;

      if (p.type === 'star') {
        this._drawStar(ctx, sx, sy, p.r);
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, p.r * (0.5 + 0.5 * alpha), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // XP Gems
    const now = performance.now() * 0.001;
    for (const g of this.xpGems) {
      const sx = g.x - camX + hw;
      const sy = g.y - camY + hh;
      if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;

      const bob = Math.sin(now * g.bobSpeed + g.bobOffset) * 3;
      const pulse = 0.85 + 0.15 * Math.sin(now * 3 + g.bobOffset);

      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = g.color;

      // Gem shape (diamond)
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.moveTo(sx, sy + bob - g.r * 1.4 * pulse);
      ctx.lineTo(sx + g.r * pulse, sy + bob);
      ctx.lineTo(sx, sy + bob + g.r * 1.4 * pulse);
      ctx.lineTo(sx - g.r * pulse, sy + bob);
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(sx, sy + bob - g.r * 1.2 * pulse);
      ctx.lineTo(sx + g.r * 0.4 * pulse, sy + bob - g.r * 0.2 * pulse);
      ctx.lineTo(sx - g.r * 0.1 * pulse, sy + bob + g.r * 0.3 * pulse);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  _drawStar(ctx, x, y, r) {
    const spikes = 5;
    const outerR = r, innerR = r * 0.45;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const rad = i % 2 === 0 ? outerR : innerR;
      if (i === 0) ctx.moveTo(x + Math.cos(angle) * rad, y + Math.sin(angle) * rad);
      else ctx.lineTo(x + Math.cos(angle) * rad, y + Math.sin(angle) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }
}
