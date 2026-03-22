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
        }
    }

    function getTarget(e, playerX, playerY, velX, velY) {
        if (e.role === 'chaser') {
            return { tx: playerX, ty: playerY };
        }
        if (e.role === 'interceptor') {
            return {
                tx: playerX + velX * GameConfig.PREDICT_FRAMES,
                ty: playerY + velY * GameConfig.PREDICT_FRAMES,
            };
        }
        if (e.role === 'flanker') {
            var dx = playerX - e.posX;
            var dy = playerY - e.posY;
            var dist = Math.hypot(dx, dy) || 1;
            var nx = dx / dist;
            var ny = dy / dist;
            return {
                tx: playerX + (-ny * e.flankSide) * GameConfig.FLANK_OFFSET,
                ty: playerY + (nx * e.flankSide) * GameConfig.FLANK_OFFSET,
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
        var x, y;
        var edge = Math.floor(Math.random() * 4);
        if (edge === 0) { x = Math.random() * ww; y = 0; }
        if (edge === 1) { x = ww; y = Math.random() * wh; }
        if (edge === 2) { x = Math.random() * ww; y = wh; }
        if (edge === 3) { x = 0; y = Math.random() * wh; }

        var created = GameUI.createEnemyElement(x, y);
        var enemyDiv = created.element;
        var bar = created.bar;

        var ROLES = GameConfig.ROLES;
        var role = ROLES[Math.floor(Math.random() * ROLES.length)];
        var flankSide = Math.random() < 0.5 ? 1 : -1;
        var sz = GameConfig.PLAYER_SIZE;

        GameState.addEnemy({
            element: enemyDiv,
            posX: x,
            posY: y,
            width: sz,
            height: sz,
            health: diff.enemyHealth,
            maxHealth: diff.enemyHealth,
            bar: bar,
            role: role,
            flankSide: flankSide,
        });
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

        var CLOSE = GameConfig.CLOSE_CHASE_DIST;
        var TOUCH = GameConfig.TOUCH_DIST;
        var KNOCK = GameConfig.KNOCKBACK_DIST;
        var dmgBullet = GameConfig.BULLET_DAMAGE;

        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            var distToPlayer = Math.hypot(e.posX - playerX, e.posY - playerY);

            var target = distToPlayer < CLOSE
                ? { tx: playerX, ty: playerY }
                : getTarget(e, playerX, playerY, velX, velY);

            var tx = target.tx;
            var ty = target.ty;
            var ex = tx - e.posX;
            var ey = ty - e.posY;
            var elen = Math.hypot(ex, ey);
            if (elen > 1) {
                e.posX += (ex / elen) * diff.enemySpeed;
                e.posY += (ey / elen) * diff.enemySpeed;
            }
            e.element.style.left = e.posX + 'px';
            e.element.style.top = e.posY + 'px';

            if (distToPlayer < TOUCH) {
                var died = GameState.takeDamage(diff.damagePerHit);
                GameUI.updateHealth();
                if (died) return true;
                var ang = Math.atan2(e.posY - playerY, e.posX - playerX);
                e.posX += Math.cos(ang) * KNOCK;
                e.posY += Math.sin(ang) * KNOCK;
            }

            for (var j = bullets.length - 1; j >= 0; j--) {
                var b = bullets[j];
                if (checkCollision(b, e)) {
                    e.health -= dmgBullet;
                    e.bar.style.width = Math.max(0, (e.health / e.maxHealth) * 100) + '%';
                    b.element.remove();
                    GameState.removeBullet(j);
                    if (e.health <= 0) {
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
        startNextWave: startNextWave,
    };
})();

// Алиасы для согласованности с модулем ядра (GameAI / волны)
var GameAI = GameCombat;

var GameWaves = (function () {
    return {
        startNextWave: function () {
            GameCombat.startNextWave();
        },
    };
})();
