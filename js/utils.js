// ===========================
// VAMPIRE SURVIVORS — UTILS.JS
// Math helpers, geometry, misc
// ===========================

const Utils = {
  // --- Distance ---
  dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  distSq(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return dx * dx + dy * dy;
  },

  // --- Angle ---
  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  // --- Normalize ---
  normalize(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    return { x: dx / len, y: dy / len };
  },

  // --- Random ---
  rand(min, max) { return Math.random() * (max - min) + min; },
  randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  randSign() { return Math.random() < 0.5 ? -1 : 1; },

  // --- Clamp ---
  clamp(v, min, max) { return Math.min(Math.max(v, min), max); },

  // --- Lerp ---
  lerp(a, b, t) { return a + (b - a) * t; },

  // --- Circle Collision ---
  circlesOverlap(x1, y1, r1, x2, y2, r2) {
    return Utils.distSq(x1, y1, x2, y2) < (r1 + r2) * (r1 + r2);
  },

  // --- Canvas helpers ---
  circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
  },

  // --- Format time ---
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  // --- Format number ---
  formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(Math.floor(n));
  },

  // --- Chance ---
  chance(pct) { return Math.random() * 100 < pct; },

  // --- Hex to RGB ---
  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  },

  // --- Color lerp ---
  lerpColor(hex1, hex2, t) {
    const c1 = Utils.hexToRgb(hex1);
    const c2 = Utils.hexToRgb(hex2);
    const r = Math.round(Utils.lerp(c1.r, c2.r, t));
    const g = Math.round(Utils.lerp(c1.g, c2.g, t));
    const b = Math.round(Utils.lerp(c1.b, c2.b, t));
    return `rgb(${r},${g},${b})`;
  },

  // --- Spawn ring positions ---
  spawnOnCircle(cx, cy, radius) {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  },

  // --- Map world position to screen ---
  worldToScreen(wx, wy, camX, camY, screenW, screenH) {
    return {
      sx: wx - camX + screenW / 2,
      sy: wy - camY + screenH / 2
    };
  },

  // --- Pool manager ---
  createPool(factory, size = 50) {
    const pool = [];
    for (let i = 0; i < size; i++) pool.push(factory());
    return {
      items: pool,
      active: [],
      get() {
        return pool.length > 0 ? pool.pop() : factory();
      },
      release(item) {
        item.active = false;
        pool.push(item);
      }
    };
  }
};
