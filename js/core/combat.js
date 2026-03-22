// Пули, враги, волны, столкновения
var GameCombat = (function () {
    function checkCollision(a, b) {
        return !(
            a.posX > b.posX + b.width ||
            a.posX + a.width < b.posX ||
            a.posY > b.posY + b.height ||
            a.posY + a.height < b.posY
        );
    }

    /** Не даём врагу уйти за край видимой области (viewport). */
    function clampEnemyToBounds(e) {
        var ww = GameState.windowWidth();
        var wh = GameState.windowHeight();
        var w = e.width;
        var h = e.height;
        e.posX = Math.max(0, Math.min(ww - w, e.posX));
        e.posY = Math.max(0, Math.min(wh - h, e.posY));
    }

    function separateEnemies() {
        var enemies = GameState.enemies();
        var MIN_DIST = GameConfig.MIN_DIST;
        var SEP_FORCE = GameConfig.SEP_FORCE;

        for (var i = 0; i < enemies.length; i++) {
            var a = enemies[i];
            var sx = 0, sy = 0;
            for (var j = 0; j < enemies.length; j++) {
                if (i === j) continue;
                var b = enemies[j];
                var dx = a.posX - b.posX;
                var dy = a.posY - b.posY;
                var d = Math.hypot(dx, dy);
                if (d < MIN_DIST && d > 0) {
                    var force = (MIN_DIST - d) / MIN_DIST;
                    sx += (dx / d) * force;
                    sy += (dy / d) * force;
                }
            }
            a.posX += sx * SEP_FORCE;
            a.posY += sy * SEP_FORCE;
            clampEnemyToBounds(a);
        }
    }

    function pickArchetype() {
        var list = GameConfig.ENEMY_ARCHETYPES;
        var sum = 0;
        for (var i = 0; i < list.length; i++) sum += list[i].weight;
        var r = Math.random() * sum;
        var acc = 0;
        for (var j = 0; j < list.length; j++) {
            acc += list[j].weight;
            if (r <= acc) return list[j].id;
        }
        return list[0].id;
    }

    function archetypeMods(id) {
        switch (id) {
            case 'brute': return { hp: 1.38, speed: 0.78 };
            case 'rusher': return { hp: 0.85, speed: 1.24 };
            case 'berserk': return { hp: 0.92, speed: 1.08 };
            case 'orbiter': return { hp: 1.05, speed: 0.95 };
            case 'ambush': return { hp: 1.12, speed: 0.92 };
            case 'zigzag': return { hp: 0.95, speed: 1.05 };
            default: return { hp: 1, speed: 1 };
        }
    }

    function waveSpeedBonus() {
        var w = GameState.waveNumber();
        var s = GameConfig.ENEMY_WAVE_SPEED_SCALE;
        var cap = GameConfig.ENEMY_WAVE_SPEED_CAP;
        return Math.min(cap, w * s);
    }

    /**
     * Сдвигает цель (tx, ty) к центру экрана, пока враг в полосе у края —
     * иначе после clamp они едут вдоль границы.
     */
    function applyEdgeAvoidance(e, tx, ty) {
        var ww = GameState.windowWidth();
        var wh = GameState.windowHeight();
        var margin = GameConfig.EDGE_AVOID_MARGIN;
        var pull = GameConfig.EDGE_AVOID_STRENGTH;
        var cx = e.posX + e.width / 2;
        var cy = e.posY + e.height / 2;
        var tx2 = tx;
        var ty2 = ty;

        if (cx < margin) {
            tx2 += (margin - cx) * pull;
        }
        if (cx > ww - margin) {
            tx2 -= (cx - (ww - margin)) * pull;
        }
        if (cy < margin) {
            ty2 += (margin - cy) * pull;
        }
        if (cy > wh - margin) {
            ty2 -= (cy - (wh - margin)) * pull;
        }
        return { tx: tx2, ty: ty2 };
    }

    /**
     * Цель движения: архетипы (орбита, зигзаг, засада, классика).
     */
    function computeSteeringTarget(e, playerX, playerY, velX, velY, distToPlayer) {
        var CLOSE = GameConfig.CLOSE_CHASE_DIST;

        if (e.archetype === 'ambush' && !e.ambushActive) {
            if (distToPlayer < GameConfig.AMBUSH_ACTIVATE_DIST) {
                e.ambushActive = true;
            } else {
                var ww = GameState.windowWidth();
                var wh = GameState.windowHeight();
                var t = GameState.waveNumber() * 1.7 + e.phase;
                var midX = ww / 2 - e.width / 2;
                var midY = wh / 2 - e.height / 2;
                var pullIdle = 0.07;
                return {
                    tx: e.posX + Math.sin(t * 0.041) * 2.2 + (midX - e.posX) * pullIdle,
                    ty: e.posY + Math.cos(t * 0.038) * 2.2 + (midY - e.posY) * pullIdle,
                };
            }
        }

        if (distToPlayer < CLOSE) {
            return { tx: playerX, ty: playerY };
        }

        if (e.archetype === 'orbiter') {
            var R = GameConfig.ORBIT_IDEAL_RADIUS;
            var dx = e.posX - playerX;
            var dy = e.posY - playerY;
            var d = Math.hypot(dx, dy) || 1;
            var nx = dx / d;
            var ny = dy / d;
            var px = -ny;
            var py = nx;
            if (d > R + 55) {
                return { tx: playerX, ty: playerY };
            }
            if (d < 92) {
                return { tx: e.posX + nx * 52, ty: e.posY + ny * 52 };
            }
            var ot = GameConfig.ORBIT_TANGENT;
            return {
                tx: e.posX + px * e.orbitSign * ot,
                ty: e.posY + py * e.orbitSign * ot,
            };
        }

        if (e.archetype === 'interceptor') {
            return {
                tx: playerX + velX * GameConfig.PREDICT_FRAMES,
                ty: playerY + velY * GameConfig.PREDICT_FRAMES,
            };
        }

        if (e.archetype === 'flanker') {
            var fdx = playerX - e.posX;
            var fdy = playerY - e.posY;
            var fd = Math.hypot(fdx, fdy) || 1;
            var fnx = fdx / fd;
            var fny = fdy / fd;
            return {
                tx: playerX + (-fny * e.flankSide) * GameConfig.FLANK_OFFSET,
                ty: playerY + (fnx * e.flankSide) * GameConfig.FLANK_OFFSET,
            };
        }

        if (e.archetype === 'zigzag') {
            var zdx = playerX - e.posX;
            var zdy = playerY - e.posY;
            var zd = Math.hypot(zdx, zdy) || 1;
            var znx = zdx / zd;
            var zny = zdy / zd;
            var zpx = -zny;
            var zpy = znx;
            var wig = Math.sin(performance.now() * 0.0038 + e.phase) * 58;
            return {
                tx: playerX + zpx * wig,
                ty: playerY + zpy * wig,
            };
        }

        return { tx: playerX, ty: playerY };
    }

    function moveBullets() {
        var bullets = GameState.bullets();
        var ww = GameState.windowWidth();
        var wh = GameState.windowHeight();

        for (var i = bullets.length - 1; i >= 0; i--) {
            var b = bullets[i];
            b.posX += b.dx;
            b.posY += b.dy;
            b.element.style.left = b.posX + 'px';
            b.element.style.top = b.posY + 'px';

            if (b.posX < 0 || b.posX > ww || b.posY < 0 || b.posY > wh) {
                b.element.remove();
                GameState.removeBullet(i);
            }
        }
    }

    function shootAtNearestEnemy() {
        if (GameState.ammoCount() <= 0) return;
        if (Date.now() - GameState.lastShotTime() < GameConfig.getDifficulty().fireRate) return;

        var enemies = GameState.enemies();
        if (enemies.length === 0) return;

        var player = GameState.player();
        var playerX = player.x;
        var playerY = player.y;

        var nearest = null;
        var minDist = Infinity;
        for (var i = 0; i < enemies.length; i++) {
            var enemy = enemies[i];
            var d = Math.hypot(enemy.posX - playerX, enemy.posY - playerY);
            if (d < minDist) {
                minDist = d;
                nearest = enemy;
            }
        }
        if (!nearest) return;

        var angle = Math.atan2(nearest.posY - playerY, nearest.posX - playerX);
        player.gun.style.transform = 'rotate(' + (angle * 180 / Math.PI) + 'deg)';

        var bs = GameConfig.BULLET_SPEED;
        var px = playerX + 10;
        var py = playerY + 10;
        var bulletEl = GameUI.createBulletElement(px, py);

        var bulletData = {
            element: bulletEl,
            posX: px,
            posY: py,
            dx: bs * Math.cos(angle),
            dy: bs * Math.sin(angle),
            width: GameConfig.BULLET_SIZE,
            height: GameConfig.BULLET_SIZE,
        };

        GameState.addBullet(bulletData);
        GameState.setAmmoCount(GameState.ammoCount() - 1);
        GameUI.updateAmmo();
        GameState.setLastShotTime(Date.now());
    }

    function createEnemy() {
        var diff = GameConfig.getDifficulty();

        var ww = GameState.windowWidth();
        var wh = GameState.windowHeight();

        var archetype = pickArchetype();
        var mods = archetypeMods(archetype);
        var elite = Math.random() < GameConfig.ELITE_SPAWN_CHANCE;

        var hpMult = mods.hp * (elite ? 2.35 : 1);
        var speedMult = mods.speed * (elite ? 0.9 : 1);
        var sz = elite ? 24 : GameConfig.PLAYER_SIZE;

        var x, y;
        var edge = Math.floor(Math.random() * 4);
        var maxX = Math.max(0, ww - sz);
        var maxY = Math.max(0, wh - sz);
        if (edge === 0) { x = Math.random() * maxX; y = 0; }
        if (edge === 1) { x = maxX; y = Math.random() * maxY; }
        if (edge === 2) { x = Math.random() * maxX; y = maxY; }
        if (edge === 3) { x = 0; y = Math.random() * maxY; }

        var cssClass = elite ? 'enemy--elite' : '';
        if (archetype === 'brute' && !elite) cssClass = (cssClass ? cssClass + ' ' : '') + 'enemy--brute';
        if (archetype === 'rusher' && !elite) cssClass = (cssClass ? cssClass + ' ' : '') + 'enemy--rusher';
        if (archetype === 'orbiter' && !elite) cssClass = (cssClass ? cssClass + ' ' : '') + 'enemy--orbiter';

        var created = GameUI.createEnemyElement(x, y, { cssClass: cssClass, size: sz });
        var enemyDiv = created.element;
        var bar = created.bar;

        var baseHp = diff.enemyHealth * hpMult;
        var flankSide = Math.random() < 0.5 ? 1 : -1;

        GameState.addEnemy({
            element: enemyDiv,
            posX: x,
            posY: y,
            width: sz,
            height: sz,
            health: baseHp,
            maxHealth: baseHp,
            bar: bar,
            archetype: archetype,
            flankSide: flankSide,
            orbitSign: Math.random() < 0.5 ? 1 : -1,
            phase: Math.random() * Math.PI * 2,
            ambushActive: false,
            elite: elite,
            speedMult: speedMult,
        });
    }

    function spawnExpGem(centerX, centerY) {
        var gp = GameConfig.GAME_PARAMS;
        var sz = gp.EXP_GEM_SIZE;
        var value =
            gp.EXP_GEM_MIN +
            Math.floor(Math.random() * (gp.EXP_GEM_MAX - gp.EXP_GEM_MIN + 1));
        var left = centerX - sz / 2;
        var top = centerY - sz / 2;
        var el = GameUI.createExpGemElement(left, top);
        GameState.addExpGem({
            element: el,
            posX: left,
            posY: top,
            width: sz,
            height: sz,
            value: value,
        });
    }

    function updateExpGems() {
        var gems = GameState.expGems();
        var player = GameState.player();
        var px = player.x;
        var py = player.y;
        var magnetR = GameConfig.GAME_PARAMS.EXP_GEM_MAGNET_RANGE;
        var speed = GameConfig.GAME_PARAMS.EXP_GEM_MAGNET_SPEED;

        var playerBox = { posX: px, posY: py, width: GameConfig.PLAYER_SIZE, height: GameConfig.PLAYER_SIZE };

        for (var i = gems.length - 1; i >= 0; i--) {
            var g = gems[i];
            var gcx = g.posX + g.width / 2;
            var gcy = g.posY + g.height / 2;
            var pcx = px + playerBox.width / 2;
            var pcy = py + playerBox.height / 2;
            var dx = pcx - gcx;
            var dy = pcy - gcy;
            var dist = Math.hypot(dx, dy);

            if (dist < magnetR && dist > 0.5) {
                g.posX += (dx / dist) * speed;
                g.posY += (dy / dist) * speed;
                g.element.style.left = g.posX + 'px';
                g.element.style.top = g.posY + 'px';
            }

            if (checkCollision(playerBox, g)) {
                var pickup = g.value;
                g.element.remove();
                GameState.removeExpGem(i);
                GameState.addExperience(pickup);
                GameUI.updateExpBar();
            }
        }
    }

    function onEnemyDefeated() {
        GameState.setEnemiesDefeated(GameState.enemiesDefeated() + 1);
        GameState.incrementTotalKills();
        GameUI.updateKills();
        if (GameState.enemiesDefeated() >= GameState.enemiesInWave()) {
            setTimeout(function () {
                if (GameState.isPlaying()) startNextWave();
            }, GameConfig.WAVE_PAUSE_MS);
        }
    }

    function spawnWaveEnemies() {
        if (!GameState.isPlaying()) return;
        var n = GameState.enemiesInWave();
        var interval = GameConfig.SPAWN_INTERVAL_MS;
        for (var i = 0; i < n; i++) {
            (function (idx) {
                setTimeout(function () {
                    if (GameState.isPlaying() && !GameState.isPaused()) createEnemy();
                }, idx * interval);
            })(i);
        }
    }

    function startNextWave() {
        GameState.incrementWave();
        GameState.setEnemiesInWave(Math.pow(2, GameState.waveNumber()));
        GameState.setEnemiesDefeated(0);
        GameUI.updateWave();
        GameUI.showWaveAnnounce(
            'Волна ' + GameState.waveNumber() + '\nВрагов: ' + GameState.enemiesInWave()
        );
        spawnWaveEnemies();
    }

    function updateEnemies() {
        var diff = GameConfig.getDifficulty();
        var enemies = GameState.enemies();
        var bullets = GameState.bullets();
        var player = GameState.player();
        var playerX = player.x;
        var playerY = player.y;

        var vel = GameState.updatePlayerVelocity();
        var velX = vel.velX;
        var velY = vel.velY;

        separateEnemies();

        var TOUCH = GameConfig.TOUCH_DIST;
        var KNOCK = GameConfig.KNOCKBACK_DIST;
        var dmgBullet = GameConfig.BULLET_DAMAGE;
        var waveBonus = waveSpeedBonus();

        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            var distToPlayer = Math.hypot(e.posX - playerX, e.posY - playerY);

            var target = computeSteeringTarget(e, playerX, playerY, velX, velY, distToPlayer);
            target = applyEdgeAvoidance(e, target.tx, target.ty);

            var tx = target.tx;
            var ty = target.ty;
            var ex = tx - e.posX;
            var ey = ty - e.posY;
            var elen = Math.hypot(ex, ey);

            var stepSpeed = diff.enemySpeed * (e.speedMult || 1) * (1 + waveBonus);

            if (e.archetype === 'berserk') {
                e._bf = (e._bf || 0) + 1;
                if (e._bf % 105 < 26) {
                    stepSpeed *= 1.52;
                }
            }

            if (e.archetype === 'zigzag' && elen > 1) {
                var zdx = ex / elen;
                var zdy = ey / elen;
                var zx = -zdy;
                var zy = zdx;
                var bob = Math.cos(performance.now() * 0.005 + e.phase * 2) * 2.8;
                ex += zx * bob;
                ey += zy * bob;
                elen = Math.hypot(ex, ey);
            }

            if (elen > 0.4) {
                e.posX += (ex / elen) * stepSpeed;
                e.posY += (ey / elen) * stepSpeed;
            }

            clampEnemyToBounds(e);

            if (distToPlayer < TOUCH) {
                var died = GameState.takeDamage(diff.damagePerHit);
                GameUI.updateHealth();
                if (died) return true;
                var ang = Math.atan2(e.posY - playerY, e.posX - playerX);
                e.posX += Math.cos(ang) * KNOCK;
                e.posY += Math.sin(ang) * KNOCK;
                clampEnemyToBounds(e);
            }

            e.element.style.left = e.posX + 'px';
            e.element.style.top = e.posY + 'px';

            for (var j = bullets.length - 1; j >= 0; j--) {
                var b = bullets[j];
                if (checkCollision(b, e)) {
                    e.health -= dmgBullet;
                    e.bar.style.width = Math.max(0, (e.health / e.maxHealth) * 100) + '%';
                    b.element.remove();
                    GameState.removeBullet(j);
                    if (e.health <= 0) {
                        spawnExpGem(e.posX + e.width / 2, e.posY + e.height / 2);
                        e.element.remove();
                        GameState.removeEnemy(i);
                        onEnemyDefeated();
                    }
                    break;
                }
            }
        }
        return false;
    }

    return {
        moveBullets: moveBullets,
        shootAtNearestEnemy: shootAtNearestEnemy,
        updateEnemies: updateEnemies,
        updateExpGems: updateExpGems,
        startNextWave: startNextWave,
    };
})();

var GameAI = GameCombat;

var GameWaves = (function () {
    return {
        startNextWave: function () {
            GameCombat.startNextWave();
        },
    };
})();
