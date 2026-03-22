// ============================================================
// ui.js - Управление интерфейсом (DOM)
// ============================================================

var GameUI = (function () {
    var elements = {};

    function init() {
        // Важно: мутируем тот же объект {}, на который ссылается GameUI.elements.
        // Присвоение elements = { ... } ломало ссылку и оставляло GameUI.elements пустым.
        elements.menu = document.getElementById('menu');
        elements.difficultyScreen = document.getElementById('difficulty-screen');
        elements.pauseMenu = document.getElementById('pause-menu');
        elements.gameContainer = document.getElementById('game-container');

        elements.startButton = document.getElementById('start-button');
        elements.difficultyButton = document.getElementById('difficulty-button');
        elements.exitButton = document.getElementById('exit-button');

        elements.diffEasy = document.getElementById('diff-easy');
        elements.diffNormal = document.getElementById('diff-normal');
        elements.diffHard = document.getElementById('diff-hard');
        elements.diffBack = document.getElementById('diff-back');

        elements.resumeButton = document.getElementById('resume-button');
        elements.pauseExitButton = document.getElementById('pause-exit-button');

        elements.ammoIndicator = document.getElementById('ammo-indicator');
        elements.waveIndicator = document.getElementById('wave-indicator');
        elements.killCounter = document.getElementById('kill-counter');
        elements.waveAnnounce = document.getElementById('wave-announce');
        elements.gameOverMessage = document.getElementById('game-over-message');
        elements.restartButton = document.getElementById('restart-button');

        elements.playerHpWrap = document.getElementById('player-healthbar-wrap');
        elements.playerHpFill = document.getElementById('player-healthbar-fill');
        elements.playerHpValue = document.getElementById('player-hp-value');

        elements.expBarWrap = document.getElementById('exp-bar-wrap');
        elements.expLevelLabel = document.getElementById('exp-level-label');
        elements.expBarFill = document.getElementById('exp-bar-fill');
        elements.expBarText = document.getElementById('exp-bar-text');

        setupMenuListeners();
        setupDifficultyListeners();
        setupPauseListeners();
    }

    function setupMenuListeners() {
        elements.startButton.onclick = function () {
            elements.menu.style.display = 'none';
            GameCore.startGame();
        };

        elements.difficultyButton.onclick = function () {
            elements.menu.style.display = 'none';
            elements.difficultyScreen.style.display = 'flex';
        };

        elements.exitButton.onclick = function () {
            location.reload();
        };
    }

    function setupDifficultyListeners() {
        elements.diffEasy.onclick = function () {
            setDifficultyUI('easy');
        };
        elements.diffNormal.onclick = function () {
            setDifficultyUI('normal');
        };
        elements.diffHard.onclick = function () {
            setDifficultyUI('hard');
        };
        elements.diffBack.onclick = function () {
            elements.difficultyScreen.style.display = 'none';
            elements.menu.style.display = 'flex';
        };
    }

    function setDifficultyUI(level) {
        GameConfig.setDifficulty(level);
        var labels = { easy: 'Легко', normal: 'Нормально', hard: 'Сложно' };
        elements.difficultyButton.textContent = 'Сложность: ' + labels[level];
        elements.difficultyScreen.style.display = 'none';
        elements.menu.style.display = 'flex';
    }

    function setupPauseListeners() {
        elements.resumeButton.onclick = GameCore.resumeGame;
        elements.pauseExitButton.onclick = function () {
            location.reload();
        };
        elements.restartButton.onclick = function () {
            location.reload();
        };
    }

    function createPlayer() {
        var playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.style.left = GameState.player().x + 'px';
        playerDiv.style.top = GameState.player().y + 'px';

        var healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthBar.style.width = '100%';
        playerDiv.appendChild(healthBar);

        var playerGun = document.createElement('div');
        playerGun.className = 'gun';
        playerDiv.appendChild(playerGun);

        elements.gameContainer.appendChild(playerDiv);
        GameState.setPlayerElement(playerDiv, playerGun);
    }

    function createEnemyElement(x, y, opts) {
        opts = opts || {};
        var enemyDiv = document.createElement('div');
        enemyDiv.className = 'enemy' + (opts.cssClass ? ' ' + opts.cssClass : '');
        enemyDiv.style.left = x + 'px';
        enemyDiv.style.top = y + 'px';
        var sz = opts.size != null ? opts.size : GameConfig.PLAYER_SIZE;
        enemyDiv.style.width = sz + 'px';
        enemyDiv.style.height = sz + 'px';
        elements.gameContainer.appendChild(enemyDiv);

        var bar = document.createElement('div');
        bar.className = 'health-bar';
        bar.style.width = '100%';
        enemyDiv.appendChild(bar);

        return { element: enemyDiv, bar: bar };
    }

    function createBulletElement(x, y) {
        var bulletEl = document.createElement('div');
        bulletEl.className = 'bullet';
        bulletEl.style.left = x + 'px';
        bulletEl.style.top = y + 'px';
        elements.gameContainer.appendChild(bulletEl);
        return bulletEl;
    }

    function createExpGemElement(x, y) {
        var gem = document.createElement('div');
        gem.className = 'exp-gem';
        gem.style.left = x + 'px';
        gem.style.top = y + 'px';
        elements.gameContainer.appendChild(gem);
        return gem;
    }

    function updateAmmo() {
        elements.ammoIndicator.textContent =
            'Патроны: ' + GameState.ammoCount() + '/' + GameConfig.GAME_PARAMS.MAX_AMMO;
    }

    function updateWave() {
        elements.waveIndicator.textContent = 'Волна: ' + GameState.waveNumber();
    }

    function updateKills() {
        elements.killCounter.textContent = 'Убито: ' + GameState.totalKills();
    }

    function updateHealth() {
        var p = GameState.player();
        var maxH = p.maxHealth || 100;
        var h = Math.max(0, Math.min(maxH, p.health));
        var pct = maxH > 0 ? (h / maxH) * 100 : 0;
        elements.playerHpFill.style.width = pct + '%';
        elements.playerHpValue.textContent = Math.ceil(h) + ' / ' + maxH;

        elements.playerHpFill.classList.remove('hp-mid', 'hp-low');
        if (pct <= 30) elements.playerHpFill.classList.add('hp-low');
        else if (pct <= 60) elements.playerHpFill.classList.add('hp-mid');
    }

    function updateExpBar() {
        var cap = GameConfig.GAME_PARAMS.EXP_PER_LEVEL;
        var cur = GameState.playerExp();
        var lvl = GameState.playerLevel();
        var fillPct = cap > 0 ? (cur / cap) * 100 : 0;
        elements.expBarFill.style.width = fillPct + '%';
        elements.expLevelLabel.textContent = 'Ур. ' + lvl;
        elements.expBarText.textContent = Math.floor(cur) + ' / ' + cap;
    }

    function showWaveAnnounce(text) {
        elements.waveAnnounce.textContent = text;
        elements.waveAnnounce.style.display = 'block';

        setTimeout(function () {
            elements.waveAnnounce.style.display = 'none';
        }, GameConfig.GAME_PARAMS.WAVE_ANNOUNCE_DURATION);
    }

    function showGameOver() {
        document.getElementById('game-over-text').textContent =
            'Игра закончена!\nВолна: ' + GameState.waveNumber() +
            '\nУбито врагов: ' + GameState.totalKills();
        elements.gameOverMessage.style.display = 'flex';
    }

    function showGameUI() {
        elements.gameContainer.style.display = 'block';
        elements.ammoIndicator.style.display = 'block';
        elements.waveIndicator.style.display = 'block';
        elements.killCounter.style.display = 'block';
        elements.playerHpWrap.style.display = 'block';
        elements.expBarWrap.style.display = 'block';
    }

    function hideAllMenus() {
        elements.menu.style.display = 'none';
        elements.difficultyScreen.style.display = 'none';
        elements.pauseMenu.style.display = 'none';
    }

    return {
        init: init,
        elements: elements,
        createPlayer: createPlayer,
        createEnemyElement: createEnemyElement,
        createBulletElement: createBulletElement,
        createExpGemElement: createExpGemElement,
        updateAmmo: updateAmmo,
        updateWave: updateWave,
        updateKills: updateKills,
        updateHealth: updateHealth,
        updateExpBar: updateExpBar,
        showWaveAnnounce: showWaveAnnounce,
        showGameOver: showGameOver,
        showGameUI: showGameUI,
        hideAllMenus: hideAllMenus,
    };
})();
