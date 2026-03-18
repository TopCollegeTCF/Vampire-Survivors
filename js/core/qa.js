

// ============================================================
// qa.js - Логирование
// ============================================================

var GameLogger = (function() {
    
    function info(message) {
        console.log('%c[INFO] ' + message, 'color: #00aa00');
    }
    
    function warn(message) {
        console.log('%c[WARN] ' + message, 'color: #ffaa00');
    }
    
    function error(message) {
        console.log('%c[ERROR] ' + message, 'color: #ff0000');
    }
    
    function debug(message) {
        console.log('%c[DEBUG] ' + message, 'color: #888888');
    }
    
    function game(message) {
        console.log('%c[GAME] ' + message, 'color: #0066ff; font-weight: bold');
    }
    
    function logGameStart() {
        game('Игра начата. Сложность: ' + GameConfig.currentDifficulty);
        info('Размер экрана: ' + GameState.windowWidth() + 'x' + GameState.windowHeight());
    }
    
    function logWaveStart(waveNumber, enemyCount) {
        game('Волна ' + waveNumber + ' началась. Врагов: ' + enemyCount);
    }
    
    function logEnemyDefeated(remainingEnemies) {
        debug('Враг уничтожен. Осталось врагов: ' + remainingEnemies);
    }
    
    function logGameOver() {
        game('Игра окончена. Достигнута волна: ' + GameState.waveNumber() + 
             ', убито: ' + GameState.totalKills());
    }
    
    function logPause() {
        info('Игра на паузе');
    }
    
    function logResume() {
        info('Игра продолжена');
    }

    return {
        info: info,
        warn: warn,
        error: error,
        debug: debug,
        game: game,
        logGameStart: logGameStart,
        logWaveStart: logWaveStart,
        logEnemyDefeated: logEnemyDefeated,
        logGameOver: logGameOver,
        logPause: logPause,
        logResume: logResume
    };
})();


