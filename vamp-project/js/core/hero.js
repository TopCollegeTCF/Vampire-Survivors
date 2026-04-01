
// ============================================================
// hero.js - Логика игрока
// ============================================================

var GameHero = (function() {
    // Управление движением
    var movement = { up: false, down: false, left: false, right: false };

    function init() {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }

    function handleKeyDown(e) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') movement.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') movement.right = true;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') movement.up = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') movement.down = true;
    }

    function handleKeyUp(e) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') movement.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') movement.right = false;
        if (e.code === 'ArrowUp' || e.code === 'KeyW') movement.up = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') movement.down = false;
    }

    function updatePosition() {
        var speed = GameConfig.getDifficulty().playerSpeed;
        var dx = 0, dy = 0;

        if (movement.left) dx -= speed;
        if (movement.right) dx += speed;
        if (movement.up) dy -= speed;
        if (movement.down) dy += speed;

        var len = Math.hypot(dx, dy);
        if (len > speed) {
            dx = dx / len * speed;
            dy = dy / len * speed;
        }

        var newX = Math.max(0, Math.min(GameState.windowWidth() - 20, GameState.player().x + dx));
        var newY = Math.max(0, Math.min(GameState.windowHeight() - 20, GameState.player().y + dy));

        GameState.setPlayerPosition(newX, newY);

        var player = GameState.player();
        if (player.element) {
            player.element.style.left = newX + 'px';
            player.element.style.top = newY + 'px';
        }
    }

    return {
        init: init,
        movement: movement,
        updatePosition: updatePosition
    };
})();
