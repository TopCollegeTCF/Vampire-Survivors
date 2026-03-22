// ============================================================
// core.js - Главный цикл игры
// ============================================================

var GameCore = (function () {
    function gameLoop() {
        if (!GameState.isPlaying() || GameState.isPaused()) return;

        requestAnimationFrame(gameLoop);

        GameHero.updatePosition();
        GameAI.moveBullets();
        GameAI.shootAtNearestEnemy();

        var playerDied = GameAI.updateEnemies();
        GameAI.updateExpGems();
        if (playerDied) {
            endGame();
        }
    }

    function init() {
        GameUI.init();
        GameHero.init();
        setupPauseHandler();
        setupResizeHandler();
        GameLogger.info('Игра инициализирована');
    }

    function startGame() {
        GameState.reset();
        GameState.setPlayerPosition(
            GameState.windowWidth() / 2,
            GameState.windowHeight() / 2
        );

        GameUI.showGameUI();
        GameUI.hideAllMenus();

        GameUI.createPlayer();
        GameUI.updateAmmo();
        GameUI.updateKills();
        GameUI.updateHealth();
        GameUI.updateExpBar();

        GameWaves.startNextWave();
        GameLogger.logGameStart();

        gameLoop();
    }

    function setupPauseHandler() {
        document.addEventListener('keydown', function (e) {
            if (e.code !== 'Escape' || !GameState.isPlaying()) return;

            if (GameState.isPaused()) {
                resumeGame();
            } else {
                pauseGame();
            }
        });
    }

    function pauseGame() {
        if (!GameState.isPlaying()) return;
        GameState.setPaused(true);
        GameUI.elements.pauseMenu.style.display = 'flex';
        GameLogger.logPause();
    }

    function resumeGame() {
        if (!GameState.isPlaying()) return;
        GameState.setPaused(false);
        GameUI.elements.pauseMenu.style.display = 'none';
        GameLogger.logResume();
        gameLoop();
    }

    function endGame() {
        GameState.setPlaying(false);
        GameUI.showGameOver();
        GameLogger.logGameOver();
    }

    function setupResizeHandler() {
        window.addEventListener('resize', function () {
            GameState.updateWindowSize();
        });
    }

    return {
        init: init,
        startGame: startGame,
        pauseGame: pauseGame,
        resumeGame: resumeGame,
    };
})();

window.addEventListener('load', function () {
    GameCore.init();
});
