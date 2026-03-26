// --- UI ---
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const startButton = document.getElementById('start-button');
const settingsButton = document.getElementById('settings-button');
const exitButton = document.getElementById('exit-button');
const gameOverMessage = document.getElementById('game-over-message');

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

let isPlaying = false;

// игрок
let playerX = windowWidth / 2;
let playerY = windowHeight / 2;

let playerDiv;
let playerGun;
let playerHealth = 100;

// combat
let bullets = [];
let enemies = [];

let ammoCount = 999;
const maxAmmo = 999;

let fireRate = 500;
let lastShotTime = 0;

// индикация патронов
const ammoIndicator = document.createElement('div');
ammoIndicator.id = "ammo-indicator";
document.body.appendChild(ammoIndicator);

function updateAmmoUI(){
    ammoIndicator.textContent = `Патроны: ${ammoCount}/${maxAmmo}`;
}
updateAmmoUI();

// менюшка
function startGame(){
    menu.style.display = "none";
    gameContainer.style.display = "block";
    isPlaying = true;

    initGame();
}

function openSettings(){
    alert("Настройки пока не реализованы");
}

function exitGame(){
    location.reload();
}

startButton.onclick = startGame;
settingsButton.onclick = openSettings;
exitButton.onclick = exitGame;

// игрок
function createPlayer(){

    playerDiv = document.createElement("div");
    playerDiv.className = "player";

    playerDiv.style.left = playerX+"px";
    playerDiv.style.top = playerY+"px";

    gameContainer.appendChild(playerDiv);

    const healthBar = document.createElement("div");
    healthBar.className = "health-bar";
    healthBar.style.width = "100%";
    playerDiv.appendChild(healthBar);

    playerGun = document.createElement("div");
    playerGun.className = "gun";

    playerDiv.appendChild(playerGun);
}

// collision
function checkCollision(a,b){

    return !(
        a.posX > b.posX + b.width ||
        a.posX + a.width < b.posX ||
        a.posY > b.posY + b.height ||
        a.posY + a.height < b.posY
    )
}

// механика передвижения игрока
const movement = {up:false,down:false,left:false,right:false}

document.addEventListener("keydown",e=>{
    if(e.code==="ArrowLeft") movement.left=true
    if(e.code==="ArrowRight") movement.right=true
    if(e.code==="ArrowUp") movement.up=true
    if(e.code==="ArrowDown") movement.down=true
})

document.addEventListener("keyup",e=>{
    if(e.code==="ArrowLeft") movement.left=false
    if(e.code==="ArrowRight") movement.right=false
    if(e.code==="ArrowUp") movement.up=false
    if(e.code==="ArrowDown") movement.down=false
})

function updatePosition(){

    const speed = 5

    let dx = 0
    let dy = 0

    if(movement.left) dx -= speed
    if(movement.right) dx += speed
    if(movement.up) dy -= speed
    if(movement.down) dy += speed

    // нормализация диагонали
    const len = Math.hypot(dx,dy)
    if(len>speed){
        dx = dx/len*speed
        dy = dy/len*speed
    }

    playerX += dx
    playerY += dy

    playerX = Math.max(0,Math.min(windowWidth-20,playerX))
    playerY = Math.max(0,Math.min(windowHeight-20,playerY))

    playerDiv.style.left = playerX+"px"
    playerDiv.style.top = playerY+"px"
}

// стрельба
function shootAtNearestEnemy(){

    if(ammoCount<=0) return
    if(Date.now()-lastShotTime < fireRate) return
    if(enemies.length===0) return

    let nearest = enemies[0]
    let minDist = Infinity

    for(const enemy of enemies){

        const d = Math.hypot(enemy.posX-playerX, enemy.posY-playerY)

        if(d<minDist){
            minDist=d
            nearest=enemy
        }
    }

    const angle = Math.atan2(nearest.posY-playerY, nearest.posX-playerX)

    playerGun.style.transform = `rotate(${angle*180/Math.PI}deg)`

    const bullet = document.createElement("div")
    bullet.className="bullet"

    gameContainer.appendChild(bullet)

    const bulletData = {

        element:bullet,

        posX:playerX+10,
        posY:playerY+10,

        dx:8*Math.cos(angle),
        dy:8*Math.sin(angle),

        width:5,
        height:5
    }

    bullet.style.left = bulletData.posX+"px"
    bullet.style.top = bulletData.posY+"px"

    bullets.push(bulletData)

    ammoCount--
    updateAmmoUI()

    lastShotTime = Date.now()
}

// механика пули
function moveBullets(){

    for(let i=bullets.length-1;i>=0;i--){

        const b = bullets[i]

        b.posX += b.dx
        b.posY += b.dy

        b.element.style.left = b.posX+"px"
        b.element.style.top = b.posY+"px"

        if(
            b.posX<0 || b.posX>windowWidth ||
            b.posY<0 || b.posY>windowHeight
        ){
            b.element.remove()
            bullets.splice(i,1)
        }
    }
}

// состояние врагов
function createEnemy(){

    const enemyDiv = document.createElement("div")
    enemyDiv.className="enemy"

    let x,y

    const edge = Math.floor(Math.random()*4)

    if(edge===0){x=Math.random()*windowWidth;y=0}
    if(edge===1){x=windowWidth;y=Math.random()*windowHeight}
    if(edge===2){x=Math.random()*windowWidth;y=windowHeight}
    if(edge===3){x=0;y=Math.random()*windowHeight}

    enemyDiv.style.left=x+"px"
    enemyDiv.style.top=y+"px"

    gameContainer.appendChild(enemyDiv)

    const bar = document.createElement("div")
    bar.className="health-bar"
    bar.style.width="100%"
    enemyDiv.appendChild(bar)

    enemies.push({

        element:enemyDiv,

        posX:x,
        posY:y,

        width:20,
        height:20,

        health:100,

        bar:bar
    })
}

// появление врагов волнами
function createWave(){

    for(let i=0;i<5;i++){
        setTimeout(createEnemy,i*1000)
    }

    setTimeout(createWave,5000)
}

// основной цикл игры
function gameLoop(){

    if(!isPlaying) return

    requestAnimationFrame(gameLoop)

    updatePosition()

    moveBullets()

    shootAtNearestEnemy()

    for(let i=enemies.length-1;i>=0;i--){

        const e = enemies[i]

        e.posX += (playerX-e.posX)*0.01
        e.posY += (playerY-e.posY)*0.01

        e.element.style.left = e.posX+"px"
        e.element.style.top = e.posY+"px"

        if(Math.hypot(e.posX-playerX,e.posY-playerY)<20){

            playerHealth -= 10

            const bar = playerDiv.querySelector(".health-bar")
            bar.style.width = playerHealth+"%"

            if(playerHealth<=0){
                isPlaying=false
                gameOverMessage.style.display="block"
                return
            }
        }

        for(let j=bullets.length-1;j>=0;j--){

            const b = bullets[j]

            if(checkCollision(b,e)){

                e.health -= 20
                e.bar.style.width = e.health+"%"

                b.element.remove()
                bullets.splice(j,1)

                if(e.health<=0){

                    e.element.remove()
                    enemies.splice(i,1)
                }

                break
            }
        }
    }
}

// init
function initGame(){

    createPlayer()

    createWave()

    gameLoop()
}
