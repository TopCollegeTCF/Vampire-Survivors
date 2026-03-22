// ============================================================
// ui.js — HUD на Canvas: счёт, таймер, полоска опыта
// ============================================================

/**
 * Отображение счёта (вверху слева).
 * Проверка: drawScore(ctx, 1247)
 */
window.drawScore = function (ctx, score) {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Score: ${score}`, 20, 40);
};

/**
 * Отображение времени (под счётом).
 * Проверка: drawTimer(ctx, 5, 23)
 */
window.drawTimer = function (ctx, minutes, seconds) {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    const timeStr =
        minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    ctx.fillText(timeStr, 20, 70);
};

/**
 * Полоска опыта внизу экрана.
 * Проверка: drawExpBar(ctx, 75, 100)
 */
window.drawExpBar = function (ctx, currentExp, maxExp) {
    const barWidth = 300;
    const barHeight = 15;
    const x = 20;
    const y = 550;
    const fillPercent = currentExp / maxExp;

    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, '#4169e1');
    gradient.addColorStop(1, '#87ceeb');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth * fillPercent, barHeight);

    ctx.strokeStyle = '#ffd700';
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Level ' + (Math.floor(currentExp / 100) + 1), x + barWidth + 10, y + 12);
};
