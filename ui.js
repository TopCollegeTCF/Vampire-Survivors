// ============================================================
// ui.js - Управление интерфейсом
// ============================================================

var GameUI = (function() {
    var elements = {};
    
    // Сюда будем добавлять функции
    
    return {
        init: init,
        elements: elements,
        createPlayer: createPlayer,
        createEnemyElement: createEnemyElement,
        createBulletElement: createBulletElement,
        updateAmmo: updateAmmo,
        updateWave: updateWave,
        updateKills: updateKills,
        updateHealth: updateHealth,
        showWaveAnnounce: showWaveAnnounce,
        showGameOver: showGameOver,
        showGameUI: showGameUI,
        hideAllMenus: hideAllMenus
    };
})();

function init() {
    elements = {
        menu: document.getElementById('menu'),
        difficultyScreen: document.getElementById('difficulty-screen'),
        pauseMenu: document.getElementById('pause-menu'),
        gameContainer: document.getElementById('game-container'),
        
        startButton: document.getElementById('start-button'),
        difficultyButton: document.getElementById('difficulty-button'),
        exitButton: document.getElementById('exit-button'),
        
        diffEasy: document.getElementById('diff-easy'),
        diffNormal: document.getElementById('diff-normal'),
        diffHard: document.getElementById('diff-hard'),
        diffBack: document.getElementById('diff-back'),
        
        resumeButton: document.getElementById('resume-button'),
        pauseExitButton: document.getElementById('pause-exit-button'),
        
        ammoIndicator: document.getElementById('ammo-indicator'),
        waveIndicator: document.getElementById('wave-indicator'),
        killCounter: document.getElementById('kill-counter'),
        waveAnnounce: document.getElementById('wave-announce'),
        gameOverMessage: document.getElementById('game-over-message'),
        restartButton: document.getElementById('restart-button'),
        
        playerHpWrap: document.getElementById('player-healthbar-wrap'),
        playerHpFill: document.getElementById('player-healthbar-fill'),
        playerHpValue: document.getElementById('player-hp-value')
    };

    setupMenuListeners();
    setupDifficultyListeners();
    setupPauseListeners();
}

function setupMenuListeners() {
    elements.startButton.onclick = function() {
        elements.menu.style.display = 'none';
        GameCore.startGame();
    };
    
    elements.difficultyButton.onclick = function() {
        elements.menu.style.display = 'none';
        elements.difficultyScreen.style.display = 'flex';
    };
    
    elements.exitButton.onclick = function() { 
        location.reload(); 
    };
}


function setupDifficultyListeners() {
    elements.diffEasy.onclick = function() { 
        setDifficultyUI('easy'); 
    };
    elements.diffNormal.onclick = function() { 
        setDifficultyUI('normal'); 
    };
    elements.diffHard.onclick = function() { 
        setDifficultyUI('hard'); 
    };
    elements.diffBack.onclick = function() {
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
    elements.pauseExitButton.onclick = function() { 
        location.reload(); 
    };
    elements.restartButton.onclick = function() { 
        location.reload(); 
    };
}

function initCanvas() {
    console.log('[UI] initCanvas вызван');
    if (typeof GameCanvas !== 'undefined' && GameCanvas.init) {
        GameCanvas.init();
        GameCanvas.startRenderLoop();
        console.log('[UI] Canvas инициализирован');
    } else {
        console.error('[UI] GameCanvas не найден');
    }
}

function createEnemyElement(x, y) {
    var enemyDiv = document.createElement('div');
    enemyDiv.className = 'enemy';
    enemyDiv.style.left = x + 'px';
    enemyDiv.style.top = y + 'px';
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


function updateAmmo() {
    elements.ammoIndicator.textContent = 'Патроны: ' + GameState.ammoCount() + '/999';
}

function updateWave() {
    elements.waveIndicator.textContent = 'Волна: ' + GameState.waveNumber();
}

function updateKills() {
    elements.killCounter.textContent = 'Убито: ' + GameState.totalKills();
}

function updateHealth() {
    var pct = Math.max(0, GameState.player().health);
    elements.playerHpFill.style.width = pct + '%';
    elements.playerHpValue.textContent = Math.ceil(pct);
    
    if (pct > 60) elements.playerHpFill.style.backgroundColor = '#2ecc40';
    else if (pct > 30) elements.playerHpFill.style.backgroundColor = '#ffdc00';
    else elements.playerHpFill.style.backgroundColor = '#ff4136';
}


function showWaveAnnounce(text) {
    elements.waveAnnounce.textContent = text;
    elements.waveAnnounce.style.display = 'block';
    
    setTimeout(function() {
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
    elements.playerHpWrap.style.display = 'flex';
}

function hideAllMenus() {
    elements.menu.style.display = 'none';
    elements.difficultyScreen.style.display = 'none';
    elements.pauseMenu.style.display = 'none';
}
