// ===========================
// BOOT - Порядок загрузки модулей
// ===========================

// Core сначала
import './game-core.js';

// Затем прототипы
import './game-update.js';
import './game-events.js';

// Системы
import './weapons-core.js';
import './weapons-system.js';
import './player.js';
import './enemies.js';
import './world.js';

console.log('🎮 Все игровые модули загружены!');
