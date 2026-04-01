// ============================================================
// waves.js - Управление волнами
// ============================================================

var GameWaves = (function() {
  
    
    
    function startNextWave() {
        GameState.incrementWave();
        GameState.setEnemiesInWave(Math.pow(2, GameState.waveNumber()));
        GameState.setEnemiesDefeated(0);

        GameUI.updateWave();
        GameUI.showWaveAnnounce('Волна ' + GameState.waveNumber() + '\nВрагов: ' + GameState.enemiesInWave());
        spawnWaveEnemies();
    }
  
    function onEnemyDefeated() {
        GameState.setEnemiesDefeated(GameState.enemiesDefeated() + 1);
        GameState.incrementTotalKills();
    
        if (GameState.enemiesDefeated() >= GameState.enemiesInWave()) {
            setTimeout(function() {
                if (GameState.isPlaying()) {
                    startNextWave();
                }
            }, GameConfig.GAME_PARAMS.WAVE_DELAY);
        }
    }
  
    function spawnWaveEnemies() {
        if (!GameState.isPlaying()) return;
    
        for (var i = 0; i < GameState.enemiesInWave(); i++) {
            setTimeout(function(index) {
                return function() {
                    if (GameState.isPlaying() && !GameState.isPaused()) {
                        GameAI.createEnemy();
                    }
                 };
            }(i), i * GameConfig.GAME_PARAMS.SPAWN_DELAY);
        }
    }
    
    
    return {
        startNextWave: startNextWave,
        onEnemyDefeated: onEnemyDefeated
    };
})();





  



