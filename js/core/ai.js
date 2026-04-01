
// ============================================================
// ai.js - Логика врагов и пуль
// ============================================================

var GameAI = (function() {
    
    // Сюда будем добавлять функции
    
    function createEnemy() {
    var diff = GameConfig.getDifficulty();
    
    var x, y;
    var edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = Math.random() * GameState.windowWidth(); y = 0; }
    if (edge === 1) { x = GameState.windowWidth(); y = Math.random() * GameState.windowHeight(); }
    if (edge === 2) { x = Math.random() * GameState.windowWidth(); y = GameState.windowHeight(); }
    if (edge === 3) { x = 0; y = Math.random() * GameState.windowHeight(); }

    var uiElements = GameUI.createEnemyElement(x, y);
    
    var role = GameConfig.ROLES[Math.floor(Math.random() * GameConfig.ROLES.length)];
    var flankSide = Math.random() < 0.5 ? 1 : -1;

    GameState.addEnemy({
        element: uiElements.element,
        bar: uiElements.bar,
        posX: x,
        posY: y,
        width: GameConfig.GAME_PARAMS.ENEMY_SIZE,
        height: GameConfig.GAME_PARAMS.ENEMY_SIZE,
        health: diff.enemyHealth,
        maxHealth: diff.enemyHealth,
        role: role,
        flankSide: flankSide
    });
}

function shootAtNearestEnemy() {
    if (GameState.ammoCount() <= 0) return;
    if (Date.now() - GameState.lastShotTime() < GameConfig.getDifficulty().fireRate) return;
    if (GameState.enemies().length === 0) return;

    var nearest = null;
    var minDist = Infinity;
    var enemies = GameState.enemies();
    var player = GameState.player();
    
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        var d = Math.hypot(enemy.posX - player.x, enemy.posY - player.y);
        if (d < minDist) { 
            minDist = d; 
            nearest = enemy; 
        }
    }
    if (!nearest) return;

    
    var angle = Math.atan2(nearest.posY - player.y, nearest.posX - player.x);
    if (player.gun) {
        player.gun.style.transform = 'rotate(' + (angle * 180 / Math.PI) + 'deg)';
    }

    var bulletEl = GameUI.createBulletElement(player.x + 10, player.y + 10);

    GameState.addBullet({
        element: bulletEl,
        posX: player.x + 10,
        posY: player.y + 10,
        dx: GameConfig.GAME_PARAMS.BULLET_SPEED * Math.cos(angle),
        dy: GameConfig.GAME_PARAMS.BULLET_SPEED * Math.sin(angle),
        width: GameConfig.GAME_PARAMS.BULLET_SIZE,
        height: GameConfig.GAME_PARAMS.BULLET_SIZE,
    });

    GameState.setAmmoCount(GameState.ammoCount() - 1);
    GameState.setLastShotTime(Date.now());
    GameUI.updateAmmo();
}

function moveBullets() {
    var bullets = GameState.bullets();
    for (var i = bullets.length - 1; i >= 0; i--) {
        var b = bullets[i];
        b.posX += b.dx;
        b.posY += b.dy;
        b.element.style.left = b.posX + 'px';
        b.element.style.top = b.posY + 'px';

        if (b.posX < 0 || b.posX > GameState.windowWidth() || 
            b.posY < 0 || b.posY > GameState.windowHeight()) {
            b.element.remove();
            GameState.removeBullet(i);
        }
    }
}

function separateEnemies() {
    var enemies = GameState.enemies();
    for (var i = 0; i < enemies.length; i++) {
        var a = enemies[i];
        var sx = 0, sy = 0;
        
        for (var j = 0; j < enemies.length; j++) {
            if (i === j) continue;
            var b = enemies[j];
            var dx = a.posX - b.posX;
            var dy = a.posY - b.posY;
            var d = Math.hypot(dx, dy);
            
            if (d < GameConfig.GAME_PARAMS.MIN_DIST && d > 0) {
                var force = (GameConfig.GAME_PARAMS.MIN_DIST - d) / GameConfig.GAME_PARAMS.MIN_DIST;
                sx += (dx / d) * force;
                sy += (dy / d) * force;
            }
        }
        a.posX += sx * GameConfig.GAME_PARAMS.SEP_FORCE;
        a.posY += sy * GameConfig.GAME_PARAMS.SEP_FORCE;
    }
}

function getTarget(e, velX, velY) {
    var player = GameState.player();
    if (e.role === 'chaser') {
        return { tx: player.x, ty: player.y };
    }
    if (e.role === 'interceptor') {
        return {
            tx: player.x + velX * GameConfig.GAME_PARAMS.PREDICT_FRAMES,
            ty: player.y + velY * GameConfig.GAME_PARAMS.PREDICT_FRAMES,
        };
    }
    if (e.role === 'flanker') {
        var dx = player.x - e.posX;
        var dy = player.y - e.posY;
        var dist = Math.hypot(dx, dy) || 1;
        var nx = dx / dist;
        var ny = dy / dist;
        return {
            tx: player.x + (-ny * e.flankSide) * GameConfig.GAME_PARAMS.FLANK_OFFSET,
            ty: player.y + (nx * e.flankSide) * GameConfig.GAME_PARAMS.FLANK_OFFSET,
        };
    }
    return { tx: player.x, ty: player.y };
}

function checkCollision(a, b) {
    return !(
        a.posX > b.posX + b.width ||
        a.posX + a.width < b.posX ||
        a.posY > b.posY + b.height ||
        a.posY + a.height < b.posY
    );
}

function updateEnemies() {
    var diff = GameConfig.getDifficulty();
    var velData = GameState.updatePlayerVelocity();
    var velX = velData.velX;
    var velY = velData.velY;
    var player = GameState.player();
    
    separateEnemies();

    var enemies = GameState.enemies();
    var bullets = GameState.bullets();

    for (var i = enemies.length - 1; i >= 0; i--) {
        var e = enemies[i];
        var distToPlayer = Math.hypot(e.posX - player.x, e.posY - player.y);

        var target;
        if (distToPlayer < 50) {
            target = { tx: player.x, ty: player.y };
        } else {
            target = getTarget(e, velX, velY);
        }

        var ex = target.tx - e.posX;
        var ey = target.ty - e.posY;
        var elen = Math.hypot(ex, ey);
        
        if (elen > 1) {
            e.posX += (ex / elen) * diff.enemySpeed;
            e.posY += (ey / elen) * diff.enemySpeed;
        }
        
        e.element.style.left = e.posX + 'px';
        e.element.style.top = e.posY + 'px';

        // Урон при касании
        if (distToPlayer < 20) {
            var playerDied = GameState.takeDamage(diff.damagePerHit);
            GameUI.updateHealth();
            
            if (playerDied) {
                return true;
            }
            var ang = Math.atan2(e.posY - player.y, e.posX - player.x);
            e.posX += Math.cos(ang) * 28;
            e.posY += Math.sin(ang) * 28;
        }

        // Проверка попаданий
        for (var j = bullets.length - 1; j >= 0; j--) {
            var b = bullets[j];
            if (checkCollision(b, e)) {
                e.health -= GameConfig.GAME_PARAMS.BULLET_DAMAGE;
                e.bar.style.width = Math.max(0, (e.health / e.maxHealth) * 100) + '%';
                b.element.remove();
                GameState.removeBullet(j);
                
                if (e.health <= 0) {
                    e.element.remove();
                    GameState.removeEnemy(i);
                    GameWaves.onEnemyDefeated();
                    GameUI.updateKills();
                }
                break;
            }
        }
    }
    return false;
}
// Функция для рисования скелета
window.drawSkeleton = function(ctx, x, y) {
    // Белый круг с чёрными глазницами
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Глазницы
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x - 4, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + 4, y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Рот (линия)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 3);
    ctx.lineTo(x + 5, y + 3);
    ctx.stroke();
}
    return {
        createEnemy: createEnemy,
        shootAtNearestEnemy: shootAtNearestEnemy,
        moveBullets: moveBullets,
        updateEnemies: updateEnemies,
        drawSkeleton: window.drawSkeleton
    };
})();

