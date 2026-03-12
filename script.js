const menu             = document.getElementById('menu');
const difficultyScreen = document.getElementById('difficulty-screen');
const pauseMenu        = document.getElementById('pause-menu');
const gameContainer    = document.getElementById('game-container');

const startButton      = document.getElementById('start-button');
const difficultyButton = document.getElementById('difficulty-button');
const exitButton       = document.getElementById('exit-button');

const diffEasy         = document.getElementById('diff-easy');
const diffNormal       = document.getElementById('diff-normal');
const diffHard         = document.getElementById('diff-hard');
const diffBack         = document.getElementById('diff-back');

const resumeButton     = document.getElementById('resume-button');
const pauseExitButton  = document.getElementById('pause-exit-button');

const ammoIndicator    = document.getElementById('ammo-indicator');
const waveIndicator    = document.getElementById('wave-indicator');
const killCounterEl    = document.getElementById('kill-counter');
const waveAnnounce     = document.getElementById('wave-announce');
const gameOverMessage  = document.getElementById('game-over-message');
const restartButton    = document.getElementById('restart-button');

// ============================================================
// Настройки сложности
// enemySpeed   — какую долю расстояния до игрока проходит враг за кадр
// enemyHealth  — начальное HP врага
// fireRate     — минимальная пауза между выстрелами (мс)
// playerSpeed  — пикселей в кадр для игрока
// damagePerHit — урон при касании врага
// ============================================================
// enemySpeed — фиксированная скорость в пикселях за кадр.
// Раньше использовался lerp (доля от расстояния), из-за чего
// враги издалека летели с огромной скоростью.
// Теперь скорость одинакова на любом расстоянии.
const DIFFICULTIES = {
    easy:   { enemySpeed: 1.4, enemyHealth: 60,  fireRate: 300, playerSpeed: 6, damagePerHit: 5  },
    normal: { enemySpeed: 1.9, enemyHealth: 100, fireRate: 500, playerSpeed: 5, damagePerHit: 10 },
    hard:   { enemySpeed: 2.5, enemyHealth: 150, fireRate: 800, playerSpeed: 4, damagePerHit: 20 },
};

let currentDifficulty = 'normal';
function getDiff() { return DIFFICULTIES[currentDifficulty]; }

// ============================================================
// Состояние игры
// ============================================================
let windowWidth  = window.innerWidth;
let windowHeight = window.innerHeight;

let isPlaying = false;
let isPaused  = false;

let playerX      = 0;
let playerY      = 0;
let playerDiv    = null;
let playerGun    = null;
let playerHealth = 100;

let bullets = [];
let enemies = [];

let ammoCount    = 999;
const maxAmmo    = 999;
let lastShotTime = 0;

let waveNumber        = 0;
let enemiesInWave     = 0;
let enemiesDefeated   = 0;
let waveAnnounceTimer = null;
let totalKills        = 0;

// ============================================================
// Обновление HUD
// ============================================================
function updateAmmoUI()  { ammoIndicator.textContent  = `Патроны: ${ammoCount}/${maxAmmo}`; }
function updateWaveUI()  { waveIndicator.textContent  = `Волна: ${waveNumber}`; }
function updateKillUI()  { killCounterEl.textContent  = `Убито: ${totalKills}`; }

function showWaveAnnounce(text, duration) {
    waveAnnounce.textContent    = text;
    waveAnnounce.style.display  = 'block';
    clearTimeout(waveAnnounceTimer);
    waveAnnounceTimer = setTimeout(() => { waveAnnounce.style.display = 'none'; }, duration);
}

// ============================================================
// Логика меню
// ============================================================
function setDifficulty(level) {
    currentDifficulty = level;
    const labels = { easy: 'Легко', normal: 'Нормально', hard: 'Сложно' };
    difficultyButton.textContent    = `Сложность: ${labels[level]}`;
    difficultyScreen.style.display  = 'none';
    menu.style.display              = 'flex';
}

difficultyButton.onclick = () => { menu.style.display = 'none'; difficultyScreen.style.display = 'flex'; };
diffEasy.onclick         = () => setDifficulty('easy');
diffNormal.onclick       = () => setDifficulty('normal');
diffHard.onclick         = () => setDifficulty('hard');
diffBack.onclick         = () => { difficultyScreen.style.display = 'none'; menu.style.display = 'flex'; };

startButton.onclick      = startGame;
exitButton.onclick       = () => location.reload();
resumeButton.onclick     = resumeGame;
pauseExitButton.onclick  = () => location.reload();
restartButton.onclick    = () => location.reload();

// ============================================================
// Запуск игры
// ============================================================
function startGame() {
    menu.style.display          = 'none';
    gameContainer.style.display = 'block';
    ammoIndicator.style.display = 'block';
    waveIndicator.style.display = 'block';
    killCounterEl.style.display = 'block';

    isPlaying    = true;
    isPaused     = false;
    playerX      = windowWidth  / 2;
    playerY      = windowHeight / 2;
    playerHealth = 100;
    ammoCount    = maxAmmo;
    bullets      = [];
    enemies      = [];
    waveNumber   = 0;
    enemiesDefeated = 0;
    totalKills   = 0;

    updateAmmoUI();
    updateKillUI();
    createPlayer();
    startNextWave();
    gameLoop();
}

// ============================================================
// Создание игрока
// ============================================================
function createPlayer() {
    playerDiv = document.createElement('div');
    playerDiv.className  = 'player';
    playerDiv.style.left = playerX + 'px';
    playerDiv.style.top  = playerY + 'px';

    const healthBar = document.createElement('div');
    healthBar.className   = 'health-bar';
    healthBar.style.width = '100%';
    playerDiv.appendChild(healthBar);

    playerGun = document.createElement('div');
    playerGun.className = 'gun';
    playerDiv.appendChild(playerGun);

    gameContainer.appendChild(playerDiv);
}

// ============================================================
// Движение игрока
// Отслеживаем нажатые клавиши в объекте movement.
// Если зажаты две клавиши (диагональ), нормализуем вектор —
// иначе диагональное движение было бы в √2 раз быстрее.
// ============================================================
const movement = { up: false, down: false, left: false, right: false };

document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') movement.left  = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') movement.right = true;
    if (e.code === 'ArrowUp'    || e.code === 'KeyW') movement.up    = true;
    if (e.code === 'ArrowDown'  || e.code === 'KeyS') movement.down  = true;
});
document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') movement.left  = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') movement.right = false;
    if (e.code === 'ArrowUp'    || e.code === 'KeyW') movement.up    = false;
    if (e.code === 'ArrowDown'  || e.code === 'KeyS') movement.down  = false;
});

function updatePosition() {
    const speed = getDiff().playerSpeed;
    let dx = 0, dy = 0;

    if (movement.left)  dx -= speed;
    if (movement.right) dx += speed;
    if (movement.up)    dy -= speed;
    if (movement.down)  dy += speed;

    const len = Math.hypot(dx, dy);
    if (len > speed) { dx = dx / len * speed; dy = dy / len * speed; }

    playerX = Math.max(0, Math.min(windowWidth  - 20, playerX + dx));
    playerY = Math.max(0, Math.min(windowHeight - 20, playerY + dy));

    playerDiv.style.left = playerX + 'px';
    playerDiv.style.top  = playerY + 'px';
}

// ============================================================
// Стрельба по ближайшему врагу
// Math.atan2 возвращает угол в радианах от игрока до цели.
// dx/dy пули — компоненты единичного вектора × скорость пули.
// ============================================================
function shootAtNearestEnemy() {
    if (ammoCount <= 0) return;
    if (Date.now() - lastShotTime < getDiff().fireRate) return;
    if (enemies.length === 0) return;

    let nearest = null, minDist = Infinity;
    for (const enemy of enemies) {
        const d = Math.hypot(enemy.posX - playerX, enemy.posY - playerY);
        if (d < minDist) { minDist = d; nearest = enemy; }
    }
    if (!nearest) return;

    const angle = Math.atan2(nearest.posY - playerY, nearest.posX - playerX);
    playerGun.style.transform = `rotate(${angle * 180 / Math.PI}deg)`;

    const bulletEl = document.createElement('div');
    bulletEl.className = 'bullet';
    gameContainer.appendChild(bulletEl);

    const bulletData = {
        element: bulletEl,
        posX: playerX + 10, posY: playerY + 10,
        dx: 8 * Math.cos(angle), dy: 8 * Math.sin(angle),
        width: 5, height: 5,
    };
    bulletEl.style.left = bulletData.posX + 'px';
    bulletEl.style.top  = bulletData.posY + 'px';

    bullets.push(bulletData);
    ammoCount--;
    updateAmmoUI();
    lastShotTime = Date.now();
}

// ============================================================
// Движение пуль
// Перебираем с конца, чтобы splice не сбивал индексы.
// ============================================================
function moveBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.posX += b.dx;
        b.posY += b.dy;
        b.element.style.left = b.posX + 'px';
        b.element.style.top  = b.posY + 'px';

        if (b.posX < 0 || b.posX > windowWidth || b.posY < 0 || b.posY > windowHeight) {
            b.element.remove();
            bullets.splice(i, 1);
        }
    }
}

// ============================================================
// Проверка столкновения двух прямоугольников (AABB)
// Возвращает true, если прямоугольники перекрываются.
// ============================================================
function checkCollision(a, b) {
    return !(
        a.posX > b.posX + b.width  ||
        a.posX + a.width  < b.posX ||
        a.posY > b.posY + b.height ||
        a.posY + a.height < b.posY
    );
}

// ============================================================
// Волновая система
// Формула: врагов в волне = 2^номерВолны (1→2, 2→4, 3→8…).
// Враги появляются по одному с паузой 600 мс между спауном,
// чтобы не залить экран сразу. После гибели последнего врага
// волны — 3-секундная пауза, затем следующая волна.
// ============================================================
function startNextWave() {
    waveNumber++;
    enemiesInWave   = Math.pow(2, waveNumber);
    enemiesDefeated = 0;
    updateWaveUI();
    showWaveAnnounce(`Волна ${waveNumber}\nВрагов: ${enemiesInWave}`, 2500);
    spawnWaveEnemies();
}

function spawnWaveEnemies() {
    if (!isPlaying) return;
    for (let i = 0; i < enemiesInWave; i++) {
        setTimeout(() => {
            if (isPlaying && !isPaused) createEnemy();
        }, i * 600);
    }
}

function onEnemyDefeated() {
    enemiesDefeated++;
    totalKills++;
    updateKillUI();
    if (enemiesDefeated >= enemiesInWave) {
        setTimeout(() => { if (isPlaying) startNextWave(); }, 3000);
    }
}

// ============================================================
// Роли врагов
//
// Каждый враг при создании случайно получает одну из трёх ролей:
//
//   CHASER (преследователь, ~40%)
//     Бежит прямо к текущей позиции игрока.
//     Простой и понятный — догоняет в лоб.
//
//   INTERCEPTOR (перехватчик, ~35%)
//     Смотрит, куда движется игрок, и бежит не туда где он
//     сейчас, а туда, где он окажется через PREDICT_MS мс.
//     Отрезает пути отхода — игрок внезапно видит врага впереди.
//
//   FLANKER (обходчик, ~25%)
//     Идёт к точке сбоку от игрока (90° или 270° от вектора
//     «игрок → враг»). Заходит с фланга, не мешая другим.
//
// Все три роли дополняют друг друга и вынуждают игрока
// постоянно менять направление бега.
// ============================================================
const ROLES = ['chaser', 'chaser', 'chaser', 'chaser',
               'interceptor', 'interceptor', 'interceptor',
               'flanker', 'flanker'];

// Насколько далеко в будущее смотрит перехватчик (кадры).
// Было 900мс (~54 кадра) — враг буквально ехал вместе с игроком.
// Теперь 18 кадров (~0.3с) — лишь слегка опережает, но не копирует.
const PREDICT_FRAMES = 18;

// Расстояние, на которое фланкер уходит в сторону от игрока
const FLANK_OFFSET = 160;

// Минимальное расстояние между врагами для отталкивания
const MIN_DIST  = 28;
const SEP_FORCE = 1.0;

// Позиция игрока на прошлом кадре — нужна перехватчику
let prevPlayerX = 0;
let prevPlayerY = 0;

function createEnemy() {
    const diff     = getDiff();
    const enemyDiv = document.createElement('div');
    enemyDiv.className = 'enemy';

    let x, y;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = Math.random() * windowWidth;  y = 0; }
    if (edge === 1) { x = windowWidth;                  y = Math.random() * windowHeight; }
    if (edge === 2) { x = Math.random() * windowWidth;  y = windowHeight; }
    if (edge === 3) { x = 0;                             y = Math.random() * windowHeight; }

    enemyDiv.style.left = x + 'px';
    enemyDiv.style.top  = y + 'px';
    gameContainer.appendChild(enemyDiv);

    const bar = document.createElement('div');
    bar.className = 'health-bar';
    bar.style.width = '100%';
    enemyDiv.appendChild(bar);

    // Случайная роль из таблицы ROLES
    const role = ROLES[Math.floor(Math.random() * ROLES.length)];

    // Фланкер сразу решает, с какого бока заходить: +1 = слева, -1 = справа
    const flankSide = Math.random() < 0.5 ? 1 : -1;

    enemies.push({
        element: enemyDiv, posX: x, posY: y, width: 20, height: 20,
        health: diff.enemyHealth, maxHealth: diff.enemyHealth, bar,
        role, flankSide,
    });
}

// ============================================================
// Отталкивание от соседей — не даёт врагам слипаться в кучу.
// Работает для всех ролей одинаково.
// ============================================================
function separateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const a = enemies[i];
        let sx = 0, sy = 0;
        for (let j = 0; j < enemies.length; j++) {
            if (i === j) continue;
            const b  = enemies[j];
            const dx = a.posX - b.posX;
            const dy = a.posY - b.posY;
            const d  = Math.hypot(dx, dy);
            if (d < MIN_DIST && d > 0) {
                const force = (MIN_DIST - d) / MIN_DIST;
                sx += (dx / d) * force;
                sy += (dy / d) * force;
            }
        }
        a.posX += sx * SEP_FORCE;
        a.posY += sy * SEP_FORCE;
    }
}

// ============================================================
// Вычисляем целевую точку для каждой роли
// ============================================================
function getTarget(e, velX, velY) {
    if (e.role === 'chaser') {
        // Просто текущая позиция игрока
        return { tx: playerX, ty: playerY };
    }

    if (e.role === 'interceptor') {
        // Бежит туда, где игрок окажется через PREDICT_FRAMES кадров.
        // velX/velY — смещение игрока за последний кадр.
        // При маленьком значении враг лишь чуть опережает игрока,
        // не «едет» вместе с ним синхронно.
        return {
            tx: playerX + velX * PREDICT_FRAMES,
            ty: playerY + velY * PREDICT_FRAMES,
        };
    }

    if (e.role === 'flanker') {
        // Берём вектор от врага к игроку, поворачиваем на 90°
        // в сторону flankSide и добавляем к позиции игрока.
        // Так враг заходит сбоку, независимо от угла подхода.
        const dx   = playerX - e.posX;
        const dy   = playerY - e.posY;
        const dist = Math.hypot(dx, dy) || 1;
        const nx   = dx / dist;   // нормализованный вектор к игроку
        const ny   = dy / dist;
        // Перпендикуляр: (nx, ny) → (-ny, nx) или (ny, -nx)
        return {
            tx: playerX + (-ny * e.flankSide) * FLANK_OFFSET,
            ty: playerY + ( nx * e.flankSide) * FLANK_OFFSET,
        };
    }

    return { tx: playerX, ty: playerY };
}

// ============================================================
// Обновление врагов каждый кадр
// ============================================================
function updateEnemies() {
    const diff = getDiff();

    // Скорость игрока за этот кадр (пикселей/кадр)
    const velX = playerX - prevPlayerX;
    const velY = playerY - prevPlayerY;
    prevPlayerX = playerX;
    prevPlayerY = playerY;

    separateEnemies();

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const distToPlayer = Math.hypot(e.posX - playerX, e.posY - playerY);

        // Когда враг почти вплотную — все роли атакуют напрямую
        const { tx, ty } = distToPlayer < 50
            ? { tx: playerX, ty: playerY }
            : getTarget(e, velX, velY);

        // Движение с фиксированной скоростью:
        // вычисляем вектор к цели, нормализуем его до единичного,
        // умножаем на скорость — враг делает ровно speed пикселей за кадр,
        // независимо от того, далеко цель или близко.
        const ex   = tx - e.posX;
        const ey   = ty - e.posY;
        const elen = Math.hypot(ex, ey);
        if (elen > 1) {
            e.posX += (ex / elen) * diff.enemySpeed;
            e.posY += (ey / elen) * diff.enemySpeed;
        }
        e.element.style.left = e.posX + 'px';
        e.element.style.top  = e.posY + 'px';

        // Урон при касании + отброс чтобы не бил каждый кадр
        if (distToPlayer < 20) {
            playerHealth -= diff.damagePerHit;
            playerDiv.querySelector('.health-bar').style.width =
                Math.max(0, playerHealth) + '%';
            if (playerHealth <= 0) { endGame(); return; }
            const ang = Math.atan2(e.posY - playerY, e.posX - playerX);
            e.posX += Math.cos(ang) * 28;
            e.posY += Math.sin(ang) * 28;
        }

        // Попадание пули
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (checkCollision(b, e)) {
                e.health -= 20;
                e.bar.style.width = Math.max(0, (e.health / e.maxHealth) * 100) + '%';
                b.element.remove();
                bullets.splice(j, 1);
                if (e.health <= 0) {
                    e.element.remove();
                    enemies.splice(i, 1);
                    onEnemyDefeated();
                }
                break;
            }
        }
    }
}

// ============================================================
// Главный игровой цикл (~60 кадров в секунду через rAF)
// ============================================================
function gameLoop() {
    if (!isPlaying || isPaused) return;
    requestAnimationFrame(gameLoop);

    updatePosition();
    moveBullets();
    shootAtNearestEnemy();
    updateEnemies();
}

// ============================================================
// Пауза (Esc)
// isPaused блокирует gameLoop. resumeGame() сбрасывает флаг
// и снова запускает цепочку rAF, которая прервалась на паузе.
// ============================================================
function pauseGame() {
    if (!isPlaying) return;
    isPaused = true;
    pauseMenu.style.display = 'flex';
}

function resumeGame() {
    if (!isPlaying) return;
    isPaused = false;
    pauseMenu.style.display = 'none';
    gameLoop();
}

document.addEventListener('keydown', e => {
    if (e.code !== 'Escape' || !isPlaying) return;
    isPaused ? resumeGame() : pauseGame();
});

// ============================================================
// Конец игры
// ============================================================
function endGame() {
    isPlaying = false;
    document.getElementById('game-over-text').textContent =
        `Игра закончена!\nВолна: ${waveNumber}\nУбито врагов: ${totalKills}`;
    gameOverMessage.style.display = 'flex';
}

// ============================================================
// Обновление размеров экрана при ресайзе
// ============================================================
window.addEventListener('resize', () => {
    windowWidth  = window.innerWidth;
    windowHeight = window.innerHeight;
});