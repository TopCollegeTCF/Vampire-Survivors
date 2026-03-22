// Константы и таблицы сложности / поведения врагов
var GameConfig = (function () {
    var currentDifficulty = 'normal';

    var DIFFICULTIES = {
        easy:   { enemySpeed: 1.4, enemyHealth: 60,  fireRate: 300, playerSpeed: 6, damagePerHit: 5  },
        normal: { enemySpeed: 1.9, enemyHealth: 100, fireRate: 500, playerSpeed: 5, damagePerHit: 10 },
        hard:   { enemySpeed: 2.5, enemyHealth: 150, fireRate: 800, playerSpeed: 4, damagePerHit: 20 },
    };

    var DIFFICULTY_LABELS = { easy: 'Легко', normal: 'Нормально', hard: 'Сложно' };

    var ROLES = [
        'chaser', 'chaser', 'chaser', 'chaser',
        'interceptor', 'interceptor', 'interceptor',
        'flanker', 'flanker',
    ];

    var GAME_PARAMS = {
        MAX_AMMO: 999,
        WAVE_ANNOUNCE_DURATION: 2500,
    };

    return {
        GAME_PARAMS: GAME_PARAMS,
        DIFFICULTIES: DIFFICULTIES,
        DIFFICULTY_LABELS: DIFFICULTY_LABELS,
        getDifficulty: function () {
            return DIFFICULTIES[currentDifficulty];
        },
        getDifficultyKey: function () {
            return currentDifficulty;
        },
        setDifficultyKey: function (level) {
            currentDifficulty = level;
        },
        setDifficulty: function (level) {
            currentDifficulty = level;
        },
        ROLES: ROLES,
        PREDICT_FRAMES: 18,
        FLANK_OFFSET: 160,
        MIN_DIST: 28,
        SEP_FORCE: 1.0,
        MAX_AMMO: 999,
        BULLET_SPEED: 8,
        BULLET_DAMAGE: 20,
        BULLET_SIZE: 5,
        PLAYER_SIZE: 20,
        SPAWN_INTERVAL_MS: 600,
        WAVE_PAUSE_MS: 3000,
        WAVE_ANNOUNCE_MS: 2500,
        CLOSE_CHASE_DIST: 50,
        TOUCH_DIST: 20,
        KNOCKBACK_DIST: 28,
    };
})();
