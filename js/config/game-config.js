var GameConfig = (function () {
    var currentDifficulty = 'normal';

    var DIFFICULTIES = {
        easy:   { enemySpeed: 1.4, enemyHealth: 60,  fireRate: 300, playerSpeed: 6, damagePerHit: 5  },
        normal: { enemySpeed: 1.9, enemyHealth: 100, fireRate: 500, playerSpeed: 5, damagePerHit: 10 },
        hard:   { enemySpeed: 2.5, enemyHealth: 150, fireRate: 800, playerSpeed: 4, damagePerHit: 20 },
    };

    var DIFFICULTY_LABELS = { easy: 'Легко', normal: 'Нормально', hard: 'Сложно' };

    // Веса архетипов ИИ (сумма не обязана быть 10 — используется случайный выбор)
    var ENEMY_ARCHETYPES = [
        { id: 'chaser',       weight: 2.2 },
        { id: 'interceptor',  weight: 2.0 },
        { id: 'flanker',      weight: 2.0 },
        { id: 'orbiter',      weight: 1.4 },
        { id: 'zigzag',       weight: 1.5 },
        { id: 'berserk',      weight: 1.2 },
        { id: 'brute',        weight: 1.0 },
        { id: 'rusher',       weight: 1.4 },
        { id: 'ambush',       weight: 1.1 },
    ];

    var ELITE_SPAWN_CHANCE = 0.12;
    var ENEMY_WAVE_SPEED_SCALE = 0.022;
    var ENEMY_WAVE_SPEED_CAP = 0.32;

    var GAME_PARAMS = {
        MAX_AMMO: 999,
        WAVE_ANNOUNCE_DURATION: 2500,
        EXP_PER_LEVEL: 100,
        EXP_GEM_MIN: 6,
        EXP_GEM_MAX: 14,
        EXP_GEM_SIZE: 14,
        EXP_GEM_MAGNET_RANGE: 140,
        EXP_GEM_MAGNET_SPEED: 5,
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
        ENEMY_ARCHETYPES: ENEMY_ARCHETYPES,
        ELITE_SPAWN_CHANCE: ELITE_SPAWN_CHANCE,
        ENEMY_WAVE_SPEED_SCALE: ENEMY_WAVE_SPEED_SCALE,
        ENEMY_WAVE_SPEED_CAP: ENEMY_WAVE_SPEED_CAP,
        ROLES: ['chaser', 'interceptor', 'flanker'],
        PREDICT_FRAMES: 18,
        FLANK_OFFSET: 160,
        ORBIT_IDEAL_RADIUS: 155,
        AMBUSH_ACTIVATE_DIST: 360,
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
        /** Зона у края: цель движения смещается к центру экрана, чтобы не «шлифовать» рамку */
        EDGE_AVOID_MARGIN: 80,
        EDGE_AVOID_STRENGTH: 0.72,
        /** Орбита: чуть меньше тангенциальный рывок у края */
        ORBIT_TANGENT: 72,
    };
})();
