window.drawFloor = function(ctx) {
    var canvas = ctx.canvas;
    var cellSize = 50;

    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Вертикальные линии
    for (var x = 0; x < canvas.width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Горизонтальные линии
    for (var y = 0; y < canvas.height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.restore();
};


// ------------------------------------------------------------------
// Участник 2: Сундук с сокровищами
// Использование: drawChest(ctx, x, y)
// ------------------------------------------------------------------
window.drawChest = function(ctx, x, y) {
    ctx.save();

    // Основание сундука
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - 15, y - 10, 30, 20);

    // Крышка
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(x - 18, y - 15, 36, 8);

    // Замок
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x - 3, y - 8, 6, 6);

    // Золото внутри (блик)
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y - 5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};


// ------------------------------------------------------------------
// Участник 3: Свеча с огоньком
// Использование: drawCandle(ctx, x, y)
// ------------------------------------------------------------------
window.drawCandle = function(ctx, x, y) {
    ctx.save();

    // Тело свечи
    ctx.fillStyle = '#f4a460';
    ctx.fillRect(x - 5, y - 15, 10, 20);

    // Огонь (основной)
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 20);
    ctx.lineTo(x, y - 30);
    ctx.lineTo(x + 4, y - 20);
    ctx.fill();

    // Блик огня
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y - 24, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

