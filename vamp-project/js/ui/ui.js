
// ============================================================
// ui.js - Управление интерфейсом
// ============================================================

const GameUI = (() => {
    const ids = {
        menu: 'menu',
        difficultyScreen: 'difficulty-screen',
        pauseMenu: 'pause-menu',
        gameContainer: 'game-container',

        startButton: 'start-button',
        difficultyButton: 'difficulty-button',
        exitButton: 'exit-button',

        diffEasy: 'diff-easy',
        diffNormal: 'diff-normal',
        diffHard: 'diff-hard',
        diffBack: 'diff-back',

        resumeButton: 'resume-button',
        pauseExitButton: 'pause-exit-button',

        ammoIndicator: 'ammo-indicator',
        waveIndicator: 'wave-indicator',
        killCounter: 'kill-counter',
        waveAnnounce: 'wave-announce',

        gameOverMessage: 'game-over-message',
        gameOverText: 'game-over-text',
        restartButton: 'restart-button',

        playerHpWrap: 'player-healthbar-wrap',
        playerHpFill: 'player-healthbar-fill',
        playerHpValue: 'player-hp-value',

        soundToggle: 'sound-toggle'
    };

    const requiredElements = [
        'menu',
        'startButton',
        'difficultyButton',
        'exitButton',
        'gameContainer'
    ];

    const elements = {};
    let waveAnnounceTimer = null;

    const displayMap = {
        menu: 'flex',
        difficultyScreen: 'flex',
        pauseMenu: 'flex',
        gameContainer: 'block',
        ammoIndicator: 'block',
        waveIndicator: 'block',
        killCounter: 'block',
        waveAnnounce: 'block',
        gameOverMessage: 'flex',
        playerHpWrap: 'flex',
        soundToggle: 'block'
    };

    function init() {
        console.log('[UI] init');

        if (typeof document === 'undefined') {
            console.error('[UI] document не доступен');
            return false;
        }

        cacheElements();

        if (!validateElements()) {
            return false;
        }

        bindEvents();
        console.log('[UI] init завершён');
        return true;
    }

    function cacheElements() {
        Object.keys(ids).forEach(key => {
            elements[key] = document.getElementById(ids[key]);
        });
    }

    function validateElements() {
        const missing = requiredElements.filter(key => !elements[key]);

        if (missing.length > 0) {
            console.error(
                '[UI] Не найдены элементы:',
                missing.map(key => ids[key]).join(', ')
            );
            console.log('[UI] document.readyState:', document.readyState);
            return false;
        }

        return true;
    }

    function bindEvents() {
        bindMenuEvents();
        bindDifficultyEvents();
        bindPauseEvents();
    }

    function bindMenuEvents() {
        on('startButton', 'click', () => {
            hide('menu');
            GameCore.startGame();
        });

        on('difficultyButton', 'click', () => {
            hide('menu');
            show('difficultyScreen');
        });

        on('exitButton', 'click', reloadPage);
    }

    function bindDifficultyEvents() {
        on('diffEasy', 'click', () => setDifficultyUI('easy'));
        on('diffNormal', 'click', () => setDifficultyUI('normal'));
        on('diffHard', 'click', () => setDifficultyUI('hard'));

        on('diffBack', 'click', () => {
            hide('difficultyScreen');
            show('menu');
        });
    }

    function bindPauseEvents() {
        on('resumeButton', 'click', GameCore.resumeGame);
        on('pauseExitButton', 'click', reloadPage);
        on('restartButton', 'click', reloadPage);
    }

    function setDifficultyUI(level) {
        const labels = {
            easy: 'Легко',
            normal: 'Нормально',
            hard: 'Сложно'
        };

        GameConfig.setDifficulty(level);
        setText('difficultyButton', `Сложность: ${labels[level]}`);
        hide('difficultyScreen');
        show('menu');
    }

    function initCanvas() {
        console.log('[UI] initCanvas');

        if (typeof GameCanvas !== 'undefined' && typeof GameCanvas.init === 'function') {
            GameCanvas.init();

            if (typeof GameCanvas.startRenderLoop === 'function') {
                GameCanvas.startRenderLoop();
            }

            console.log('[UI] Canvas инициализирован');
        } else {
            console.error('[UI] GameCanvas не найден');
        }
    }

    function createPlayer() {
        if (!elements.gameContainer) {
            console.error('[UI] gameContainer не найден при создании игрока');
            return;
        }

        const player = GameState.player();

        const playerEl = createDiv('player', {
            left: `${player.x}px`,
            top: `${player.y}px`
        });

        const healthBarEl = createDiv('health-bar', {
            width: '100%'
        });

        const gunEl = createDiv('gun');

        playerEl.appendChild(healthBarEl);
        playerEl.appendChild(gunEl);

        elements.gameContainer.appendChild(playerEl);
        GameState.setPlayerElement(playerEl, gunEl);
    }

    function createEnemyElement(x, y) {
        if (!elements.gameContainer) return null;

        const enemyEl = createDiv('enemy', {
            left: `${x}px`,
            top: `${y}px`
        });

        const healthBarEl = createDiv('health-bar', {
            width: '100%'
        });

        enemyEl.appendChild(healthBarEl);
        elements.gameContainer.appendChild(enemyEl);

        return {
            element: enemyEl,
            bar: healthBarEl
        };
    }

    function createBulletElement(x, y) {
        if (!elements.gameContainer) return null;

        const bulletEl = createDiv('bullet', {
            left: `${x}px`,
            top: `${y}px`
        });

        elements.gameContainer.appendChild(bulletEl);
        return bulletEl;
    }

    function updateAmmo() {
        setText('ammoIndicator', `Патроны: ${GameState.ammoCount()}/infinity`);
    }

    function updateWave() {
        setText('waveIndicator', `Волна: ${GameState.waveNumber()}`);
    }

    function updateKills() {
        setText('killCounter', `Убито: ${GameState.totalKills()}`);
    }

    function updateHealth() {
        if (!elements.playerHpFill || !elements.playerHpValue) return;

        const hp = Math.max(0, Math.min(100, GameState.player().health));

        elements.playerHpFill.style.width = `${hp}%`;
        elements.playerHpValue.textContent = Math.ceil(hp);

        if (hp > 60) {
            elements.playerHpFill.style.backgroundColor = '#2ecc40';
        } else if (hp > 30) {
            elements.playerHpFill.style.backgroundColor = '#ffdc00';
        } else {
            elements.playerHpFill.style.backgroundColor = '#ff4136';
        }
    }

    function showWaveAnnounce(text) {
        if (!elements.waveAnnounce) return;

        setText('waveAnnounce', text);
        show('waveAnnounce');

        clearTimeout(waveAnnounceTimer);
        waveAnnounceTimer = setTimeout(() => {
            hide('waveAnnounce');
        }, GameConfig.GAME_PARAMS.WAVE_ANNOUNCE_DURATION);
    }

    function showGameOver() {
        setText(
            'gameOverText',
            `Игра закончена!\nВолна: ${GameState.waveNumber()}\nУбито врагов: ${GameState.totalKills()}`
        );

        show('gameOverMessage');
    }

    function showGameUI() {
        console.log('[UI] showGameUI');

        hideAllMenus();

        show('gameContainer');
        show('ammoIndicator');
        show('waveIndicator');
        show('killCounter');
        show('playerHpWrap');
        show('soundToggle');

        initCanvas();
    }

    function hideAllMenus() {
        hide('menu');
        hide('difficultyScreen');
        hide('pauseMenu');
        hide('gameOverMessage');
    }

    function show(name, display = displayMap[name] || 'block') {
        if (elements[name]) {
            elements[name].style.display = display;
        }
    }

    function hide(name) {
        if (elements[name]) {
            elements[name].style.display = 'none';
        }
    }

    function setText(name, value) {
        if (elements[name]) {
            elements[name].textContent = value;
        }
    }

    function on(name, event, handler) {
        if (elements[name]) {
            elements[name].addEventListener(event, handler);
        }
    }

    function reloadPage() {
        location.reload();
    }

    function createDiv(className, styles = {}) {
        const div = document.createElement('div');
        div.className = className;
        Object.assign(div.style, styles);
        return div;
    }

    return {
        init,
        elements,

        createPlayer,
        createEnemyElement,
        createBulletElement,

        updateAmmo,
        updateWave,
        updateKills,
        updateHealth,

        showWaveAnnounce,
        showGameOver,
        showGameUI,
        hideAllMenus,

        setDifficultyUI,
        initCanvas
    };
})();
