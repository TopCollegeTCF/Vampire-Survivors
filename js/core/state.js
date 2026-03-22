// ============================================================
// state.js - Состояние игры
// ============================================================

var GameState = (function () {
    let isPlaying = false;
    let isPaused = false;

    let player = {
        x: 0, y: 0, health: 100, element: null, gun: null,
    };

    let bullets = [];
    let enemies = [];

    let ammoCount = GameConfig.GAME_PARAMS.MAX_AMMO;
    let lastShotTime = 0;

    let waveNumber = 0;
    let enemiesInWave = 0;
    let enemiesDefeated = 0;
    let totalKills = 0;

    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    let prevPlayerX = 0;
    let prevPlayerY = 0;

    return {
        isPlaying: function () { return isPlaying; },
        isPaused: function () { return isPaused; },
        player: function () { return player; },
        bullets: function () { return bullets; },
        enemies: function () { return enemies; },
        ammoCount: function () { return ammoCount; },
        lastShotTime: function () { return lastShotTime; },
        waveNumber: function () { return waveNumber; },
        enemiesInWave: function () { return enemiesInWave; },
        enemiesDefeated: function () { return enemiesDefeated; },
        totalKills: function () { return totalKills; },
        windowWidth: function () { return windowWidth; },
        windowHeight: function () { return windowHeight; },

        setPlaying: function (value) { isPlaying = value; },
        setPaused: function (value) { isPaused = value; },

        reset: function () {
            isPlaying = true;
            isPaused = false;
            player.health = 100;
            player.element = null;
            player.gun = null;
            ammoCount = GameConfig.GAME_PARAMS.MAX_AMMO;
            bullets = [];
            enemies = [];
            waveNumber = 0;
            enemiesInWave = 0;
            enemiesDefeated = 0;
            totalKills = 0;
            lastShotTime = 0;
            prevPlayerX = 0;
            prevPlayerY = 0;
        },

        updateWindowSize: function () {
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;
        },

        setPlayerPosition: function (x, y) {
            player.x = x;
            player.y = y;
        },

        setPlayerElement: function (element, gun) {
            player.element = element;
            player.gun = gun;
        },

        takeDamage: function (damage) {
            player.health -= damage;
            return player.health <= 0;
        },

        addBullet: function (bullet) {
            bullets.push(bullet);
        },

        removeBullet: function (index) {
            bullets.splice(index, 1);
        },

        addEnemy: function (enemy) {
            enemies.push(enemy);
        },

        removeEnemy: function (index) {
            enemies.splice(index, 1);
        },

        setAmmoCount: function (value) { ammoCount = value; },
        setLastShotTime: function (value) { lastShotTime = value; },

        incrementWave: function () { waveNumber++; },
        setEnemiesInWave: function (value) { enemiesInWave = value; },
        setEnemiesDefeated: function (value) { enemiesDefeated = value; },
        incrementTotalKills: function () { totalKills++; },

        updatePlayerVelocity: function () {
            const velX = player.x - prevPlayerX;
            const velY = player.y - prevPlayerY;
            prevPlayerX = player.x;
            prevPlayerY = player.y;
            return { velX: velX, velY: velY };
        },
    };
})();
