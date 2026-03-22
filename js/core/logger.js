// ============================================================
// logger.js — отладочные сообщения в консоль
// ============================================================

var GameLogger = (function () {
    function info(msg) {
        console.info('[Game]', msg);
    }

    function logGameStart() {
        console.log('[Game] Старт игры');
    }

    function logPause() {
        console.log('[Game] Пауза');
    }

    function logResume() {
        console.log('[Game] Продолжение');
    }

    function logGameOver() {
        console.log('[Game] Конец игры');
    }

    return {
        info: info,
        logGameStart: logGameStart,
        logPause: logPause,
        logResume: logResume,
        logGameOver: logGameOver,
    };
})();
