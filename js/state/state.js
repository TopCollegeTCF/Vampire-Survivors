// ============================================================
// state.js - Состояние игры
// ============================================================

var GameState = (function() {
    // Приватные переменные
    let isPlaying = false;
    let isPaused = false;
    
    // Игрок
    let player = {
        x: 0,
        y: 0,
        health: 100,
        element: null,
        gun: null
    };
    
    // Игровые объекты
    let bullets = [];
    let enemies = [];
    
    // Ресурсы
    let ammoCount = GameConfig.GAME_PARAMS.MAX_AMMO;
    let lastShotTime = 0;
    
    // Прогресс
    let waveNumber = 0;
    let enemiesInWave = 0;
    let enemiesDefeated = 0;
    let totalKills = 0;
    
    // Размеры окна
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    
    // Позиция игрока на прошлом кадре
    let prevPlayerX = 0;
    let prevPlayerY = 0;

    return {
        // Геттеры
        isPlaying: function() { return isPlaying; },
        isPaused: function() { return isPaused; },
        player: function() { return player; },
        bullets: function() { return bullets; },
        enemies: function() { return enemies; },
        ammoCount: function() { return ammoCount; },
        lastShotTime: function() { return lastShotTime; },
        waveNumber: function() { return waveNumber; },
        enemiesInWave: function() { return enemiesInWave; },
        enemiesDefeated: function() { return enemiesDefeated; },
        totalKills: function() { return totalKills; },
        windowWidth: function() { return windowWidth; },
        windowHeight: function() { return windowHeight; },
        
        // Сеттеры и методы
        setPlaying: function(value) { isPlaying = value; },
        setPaused: function(value) { isPaused = value; },
        
        reset: function() {
            isPlaying = true;
            isPaused = false;
            player.health = 100;
            ammoCount = GameConfig.GAME_PARAMS.MAX_AMMO;
            bullets = [];
            enemies = [];
            waveNumber = 0;
            enemiesDefeated = 0;
            totalKills = 0;
            lastShotTime = 0;
        },
        
        updateWindowSize: function() {
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;
        },
        
        setPlayerPosition: function(x, y) {
            player.x = x;
            player.y = y;
        },
        
        setPlayerElement: function(element, gun) {
            player.element = element;
            player.gun = gun;
        },
        
        addBullet: function(bullet) {
            bullets.push(bullet);
        },
        
        removeBullet: function(index) {
            bullets.splice(index, 1);
        },
        
        addEnemy: function(enemy) {
            enemies.push(enemy);
        },
        
        removeEnemy: function(index) {
            enemies.splice(index, 1);
        },
        
        setAmmoCount: function(value) { ammoCount = value; },
        setLastShotTime: function(value) { lastShotTime = value; },
        
        incrementWave: function() { waveNumber++; },
        setEnemiesInWave: function(value) { enemiesInWave = value; },
        setEnemiesDefeated: function(value) { enemiesDefeated = value; },
        incrementTotalKills: function() { totalKills++; },
        
        updatePlayerVelocity: function() {
            const velX = player.x - prevPlayerX;
            const velY = player.y - prevPlayerY;
            prevPlayerX = player.x;
            prevPlayerY = player.y;
            return { velX: velX, velY: velY };
        },
        
        takeDamage: function(damage) {
            player.health -= damage;
            return player.health <= 0;
        }
    };
})();
