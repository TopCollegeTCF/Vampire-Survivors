// ===========================
// ASSETS CONFIG - Конфигурация ресурсов
// ===========================

const ASSETS = {
    images: {
        player: 'assets/images/player/player.png',
        playerGun: 'assets/images/player/player_gun.png',
        
        enemies: {
            BAT: 'assets/images/enemies/bat.png',
            SKELETON: 'assets/images/enemies/skeleton.png',
            ZOMBIE: 'assets/images/enemies/zombie.png',
            GHOST: 'assets/images/enemies/ghost.png',
            ORC: 'assets/images/enemies/orc.png',
            VAMPIRE: 'assets/images/enemies/vampire.png',
            DEMON: 'assets/images/enemies/demon.png',
            LICH: 'assets/images/enemies/lich.png'
        }
    }
};

window.ASSETS = ASSETS;
console.log('[Assets] Конфиг загружен');
