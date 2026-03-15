// ===========================
// VAMPIRE SURVIVORS — WORLD.JS
// Tilemap generation & rendering
// ===========================

class World {
  constructor() {
    this.TILE = CONFIG.TILE_SIZE;
    this.W    = CONFIG.WORLD_W;
    this.H    = CONFIG.WORLD_H;
    this.tilesX = Math.ceil(this.W / this.TILE) + 2;
    this.tilesY = Math.ceil(this.H / this.TILE) + 2;

    // Pre-generate tile data
    this.tileData = this._generateTiles();
    this.decorations = this._generateDecorations();
  }

  _generateTiles() {
    const map = [];
    for (let ty = 0; ty < this.tilesY; ty++) {
      map[ty] = [];
      for (let tx = 0; tx < this.tilesX; tx++) {
        const r = Math.random();
        map[ty][tx] = {
          color: Utils.randChoice(CONFIG.TILE_COLORS),
          variant: r < 0.12 ? 1 : r < 0.04 ? 2 : 0, // 1=dark patch, 2=detail
          detailColor: Utils.randChoice(CONFIG.TILE_DETAIL_COLORS)
        };
      }
    }
    return map;
  }

  _generateDecorations() {
    const decors = [];
    const count = 600;
    const halfW = this.W / 2, halfH = this.H / 2;
    const decorTypes = [
      { type: 'grave', w: 20, h: 28, color: '#8a8a8a', darkColor: '#606060' },
      { type: 'rock',  w: 16, h: 12, color: '#707070', darkColor: '#505050' },
      { type: 'bone',  w: 24, h: 8,  color: '#c8b87a', darkColor: '#a09060' },
      { type: 'tree',  w: 16, h: 32, color: '#1a3010', darkColor: '#0e1e08' }
    ];
    for (let i = 0; i < count; i++) {
      const d = Utils.randChoice(decorTypes);
      decors.push({
        x: Utils.rand(-halfW, halfW),
        y: Utils.rand(-halfH, halfH),
        ...d
      });
    }
    return decors;
  }

  draw(ctx, camX, camY, W, H) {
    const T = this.TILE;
    const hw = W / 2, hh = H / 2;

    // Visible tile range
    const startTX = Math.floor((camX - hw) / T) - 1;
    const startTY = Math.floor((camY - hh) / T) - 1;
    const endTX   = startTX + Math.ceil(W / T) + 3;
    const endTY   = startTY + Math.ceil(H / T) + 3;

    // Draw tiles
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const sx = tx * T - camX + hw;
        const sy = ty * T - camY + hh;

        // Get tile data (wrap around for seamless repeat)
        const dtx = ((tx % this.tilesX) + this.tilesX) % this.tilesX;
        const dty = ((ty % this.tilesY) + this.tilesY) % this.tilesY;
        const tile = this.tileData[dty] && this.tileData[dty][dtx];

        if (!tile) {
          ctx.fillStyle = CONFIG.TILE_COLORS[0];
        } else {
          ctx.fillStyle = tile.color;
        }
        ctx.fillRect(sx, sy, T + 1, T + 1);

        // Tile detail/variant
        if (tile) {
          if (tile.variant === 1) {
            ctx.fillStyle = tile.detailColor;
            ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
          } else if (tile.variant === 2) {
            ctx.fillStyle = tile.detailColor;
            ctx.beginPath();
            ctx.arc(sx + T * 0.5, sy + T * 0.5, T * 0.35, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Subtle grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, T, T);
      }
    }

    // Fog of war / darkness vignette (canvas-based)
    const fogGrad = ctx.createRadialGradient(hw, hh, W * 0.25, hw, hh, W * 0.7);
    fogGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fogGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorations
    for (const d of this.decorations) {
      const sx = d.x - camX + hw;
      const sy = d.y - camY + hh;
      if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;

      ctx.save();
      switch (d.type) {
        case 'grave':
          // Base
          ctx.fillStyle = d.darkColor;
          ctx.fillRect(sx - d.w * 0.3, sy + d.h * 0.4, d.w * 0.6, d.h * 0.6);
          // Stone
          ctx.fillStyle = d.color;
          ctx.fillRect(sx - d.w * 0.35, sy, d.w * 0.7, d.h * 0.55);
          // Arch top
          ctx.beginPath();
          ctx.arc(sx, sy + d.h * 0.2, d.w * 0.35, Math.PI, 0);
          ctx.fill();
          // Cross
          ctx.fillStyle = d.darkColor;
          ctx.fillRect(sx - 1, sy + d.h * 0.1, 2, d.h * 0.35);
          ctx.fillRect(sx - d.w * 0.15, sy + d.h * 0.2, d.w * 0.3, 2);
          break;

        case 'rock':
          ctx.fillStyle = d.darkColor;
          ctx.beginPath();
          ctx.ellipse(sx + 2, sy + 2, d.w * 0.5, d.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.ellipse(sx, sy, d.w * 0.5, d.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.ellipse(sx - d.w * 0.15, sy - d.h * 0.15, d.w * 0.2, d.h * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'bone':
          ctx.fillStyle = d.color;
          ctx.fillRect(sx - d.w * 0.5, sy - d.h * 0.15, d.w, d.h * 0.3);
          // Knobs
          ctx.beginPath();
          ctx.arc(sx - d.w * 0.45, sy, d.h * 0.4, 0, Math.PI * 2);
          ctx.arc(sx + d.w * 0.45, sy, d.h * 0.4, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'tree':
          // Trunk
          ctx.fillStyle = d.darkColor;
          ctx.fillRect(sx - 3, sy, 6, d.h);
          // Canopy
          ctx.shadowBlur = 8; ctx.shadowColor = d.color;
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.arc(sx, sy - 4, d.w, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
      }
      ctx.restore();
    }

    // World border
    const bx = -this.W / 2 - camX + hw;
    const by = -this.H / 2 - camY + hh;
    ctx.strokeStyle = 'rgba(192,21,42,0.5)';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20; ctx.shadowColor = '#c0152a';
    ctx.strokeRect(bx, by, this.W, this.H);
    ctx.shadowBlur = 0;
  }
}
