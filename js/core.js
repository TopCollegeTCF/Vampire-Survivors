// ============================================================
// core.js — отрисовка героя, оружия, кристаллов (Canvas API)
// ============================================================

/**
 * Рисование героя (фиолетовый маг).
 * Проверка: drawHero(ctx, 400, 300)
 */
window.drawHero = function (ctx, x, y) {
    ctx.fillStyle = '#8a2be2';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
};

/**
 * Рисование оружия героя (волшебная палочка).
 * Проверка: drawWeapon(ctx, 400, 300, 0.5)
 */
window.drawWeapon = function (ctx, x, y, angle) {
    const endX = x + Math.cos(angle) * 35;
    const endY = y + Math.sin(angle) * 35;

    ctx.strokeStyle = 'gold';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fill();
};

/**
 * Рисование кристалла опыта.
 * Проверка: drawExpGem(ctx, 450, 250)
 */
window.drawExpGem = function (ctx, x, y) {
    ctx.fillStyle = '#4169e1';

    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x - 10, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
};
