// ============================================================
// ui.js - Управление интерфейсом
// ============================================================

var GameUI = (function() {
    // DOM элементы
    var elements = {};

    function init() {
        console.log('GameUI.init() начат');
        
        // Проверяем, что document существует
        if (!document) {
            console.error('document не доступен!');
            return;
        }

        // Получаем элементы с проверкой
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

        // Проверяем каждый критический элемент
        var missingElements = [];
        if (!elements.menu) missingElements.push('menu');
        if (!elements.startButton) missingElements.push('start-button');
        if (!elements.difficultyButton) missingElements.push('difficulty-button');
        if (!elements.exitButton) missingElements.push('exit-button');
        if (!elements.gameContainer) missingElements.push('game-container');

        if (missingElements.length > 0) {
            console.error('Не найдены элементы DOM:', missingElements.join(', '));
            console.log('Текущее состояние document.readyState:', document.readyState);
            return;
        }

        console.log('Все элементы DOM найдены, настраиваем слушатели...');
        setupMenuListeners();
        setupDifficultyListeners();
        setupPauseListeners();
        console.log('GameUI.init() завершен успешно');
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

    function createPlayer() {
        if (!elements.gameContainer) {
            console.error('gameContainer не найден при создании игрока');
            return;
        }
        
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

    function createEnemyElement(x, y, health, maxHealth) {
        if (!elements.gameContainer) return null;
        
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
        if (!elements.gameContainer) return null;
        
        var bulletEl = document.createElement('div');
        bulletEl.className = 'bullet';
        bulletEl.style.left = x + 'px';
        bulletEl.style.top = y + 'px';
        elements.gameContainer.appendChild(bulletEl);
        return bulletEl;
    }

    function updateAmmo() {
        if (elements.ammoIndicator) {
            elements.ammoIndicator.textContent = 'Патроны: ' + GameState.ammoCount() + '/999';
        }
    }

    function updateWave() {
        if (elements.waveIndicator) {
            elements.waveIndicator.textContent = 'Волна: ' + GameState.waveNumber();
        }
    }

    function updateKills() {
        if (elements.killCounter) {
            elements.killCounter.textContent = 'Убито: ' + GameState.totalKills();
        }
    }

    function updateHealth() {
        if (!elements.playerHpFill || !elements.playerHpValue) return;
        
        var pct = Math.max(0, GameState.player().health);
        elements.playerHpFill.style.width = pct + '%';
        elements.playerHpValue.textContent = Math.ceil(pct);
        
        if (pct > 60) elements.playerHpFill.style.backgroundColor = '#2ecc40';
        else if (pct > 30) elements.playerHpFill.style.backgroundColor = '#ffdc00';
        else elements.playerHpFill.style.backgroundColor = '#ff4136';
    }

    function showWaveAnnounce(text) {
        if (!elements.waveAnnounce) return;
        
        elements.waveAnnounce.textContent = text;
        elements.waveAnnounce.style.display = 'block';
        
        setTimeout(function() {
            if (elements.waveAnnounce) {
                elements.waveAnnounce.style.display = 'none';
            }
        }, GameConfig.GAME_PARAMS.WAVE_ANNOUNCE_DURATION);
    }

    function showGameOver() {
        var gameOverText = document.getElementById('game-over-text');
        if (gameOverText) {
            gameOverText.textContent = 'Игра закончена!\nВолна: ' + GameState.waveNumber() + 
                '\nУбито врагов: ' + GameState.totalKills();
        }
        if (elements.gameOverMessage) {
            elements.gameOverMessage.style.display = 'flex';
        }
    }

    function showGameUI() {
        if (elements.gameContainer) elements.gameContainer.style.display = 'block';
        if (elements.ammoIndicator) elements.ammoIndicator.style.display = 'block';
        if (elements.waveIndicator) elements.waveIndicator.style.display = 'block';
        if (elements.killCounter) elements.killCounter.style.display = 'block';
        if (elements.playerHpWrap) elements.playerHpWrap.style.display = 'flex';
    }

    function hideAllMenus() {
        if (elements.menu) elements.menu.style.display = 'none';
        if (elements.difficultyScreen) elements.difficultyScreen.style.display = 'none';
        if (elements.pauseMenu) elements.pauseMenu.style.display = 'none';
    }

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
