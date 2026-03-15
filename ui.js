// ===========================
// VAMPIRE SURVIVORS — UI.JS
// HUD updates, level up screen, menus
// ===========================

class UIManager {
  constructor(game) {
    this.game = game;

    // Elements
    this.hpBar     = document.getElementById('hpBar');
    this.hpText    = document.getElementById('hpText');
    this.xpBar     = document.getElementById('xpBar');
    this.timerEl   = document.getElementById('timerDisplay');
    this.scoreEl   = document.getElementById('scoreDisplay');
    this.levelEl   = document.getElementById('levelDisplay');
    this.killEl    = document.getElementById('killCount');
    this.weapHud   = document.getElementById('weaponsHud');
    this.levelUpChoices = document.getElementById('levelUpChoices');
    this.newLevelEl = document.getElementById('newLevel');

    this.lowHpOverlay = null;
    this._initOverlays();
    this._addMenuParticles();
  }

  _initOverlays() {
    // Low HP overlay
    this.lowHpOverlay = document.createElement('div');
    this.lowHpOverlay.className = 'low-hp-overlay';
    document.getElementById('gameScreen').appendChild(this.lowHpOverlay);

    // Vignette
    const vig = document.createElement('div');
    vig.className = 'vignette';
    document.getElementById('gameScreen').appendChild(vig);
  }

  _addMenuParticles() {
    const container = document.getElementById('menuParticles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'mp';
      const size = Utils.rand(3, 8);
      const isBlood = Math.random() < 0.6;
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        bottom: ${Utils.rand(-20, 20)}%;
        width: ${size}px; height: ${size}px;
        background: ${isBlood ? `rgba(192,21,42,${Utils.rand(0.4, 0.8)})` : `rgba(100,50,200,${Utils.rand(0.3, 0.7)})`};
        animation-duration: ${Utils.rand(6, 18)}s;
        animation-delay: ${Utils.rand(0, 10)}s;
      `;
      container.appendChild(p);
    }
  }

  // ---- HUD Update ----
  updateHUD(player, gameTime, score, kills) {
    // HP
    const hpPct = Utils.clamp(player.hp / player.maxHp, 0, 1) * 100;
    this.hpBar.style.width = hpPct + '%';
    this.hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    // HP color
    if (hpPct > 50) this.hpBar.style.background = 'linear-gradient(90deg, #7a0a18, #c0152a, #ff4466)';
    else if (hpPct > 25) this.hpBar.style.background = 'linear-gradient(90deg, #c06000, #f39c12, #ffcc00)';
    else this.hpBar.style.background = 'linear-gradient(90deg, #7a0000, #ff0000, #ff6666)';

    // Low HP danger
    if (hpPct < 25) this.lowHpOverlay.classList.add('danger');
    else this.lowHpOverlay.classList.remove('danger');

    // XP
    this.xpBar.style.width = (player.getXpPercent() * 100) + '%';

    // Timer
    this.timerEl.textContent = Utils.formatTime(gameTime);

    // Score
    this.scoreEl.textContent = Utils.formatNum(score);

    // Level
    this.levelEl.textContent = player.level;

    // Kills
    this.killEl.textContent = `☠ ${kills}`;

    // Weapons HUD
    this._updateWeaponsHUD(player);
  }

  _updateWeaponsHUD(player) {
    this.weapHud.innerHTML = '';
    for (const w of player.weapons) {
      const cd = w.getEffectiveCooldown();
      const cdPct = Utils.clamp(w.timer / cd, 0, 1) * 100;
      const slot = document.createElement('div');
      slot.className = 'weapon-slot active';
      slot.innerHTML = `
        <span class="weapon-icon">${w.data.icon}</span>
        <span class="weapon-level">Lv${w.level}</span>
        <div class="weapon-cooldown-bar" style="width:${cdPct}%"></div>
      `;
      slot.title = w.data.name;
      this.weapHud.appendChild(slot);
    }
  }

  // ---- Level Up ----
  showLevelUp(player, callback) {
    const choices = this._generateChoices(player);
    this.levelUpChoices.innerHTML = '';
    this.newLevelEl.textContent = player.level;

    for (const c of choices) {
      const card = document.createElement('div');
      card.className = `choice-card rarity-${c.rarity}`;
      card.innerHTML = `
        <span class="choice-icon">${c.icon}</span>
        <span class="choice-name">${c.name}</span>
        <span class="choice-desc">${c.desc}</span>
        ${c.currentLevel ? `<span class="choice-upgrade-level">Уровень ${c.currentLevel} → ${c.currentLevel + 1}</span>` : ''}
        <span class="choice-rarity-badge">${this._rarityLabel(c.rarity)}</span>
      `;
      card.addEventListener('click', () => {
        this._screenFlash('gold');
        callback(c);
      });
      this.levelUpChoices.appendChild(card);
    }

    this.showScreen('levelUpScreen');
  }

  _generateChoices(player) {
    const choices = [];
    const POOL_SIZE = 3;

    // Weapon upgrades first (if player has weapons at non-max level)
    const upgradeable = player.weapons.filter(w => w.level < w.data.maxLevel);
    for (const w of upgradeable) {
      if (choices.length >= POOL_SIZE) break;
      const upg = w.data.upgrades[w.level - 1];
      choices.push({
        type: 'weapon_upgrade',
        weaponId: w.data.id,
        icon: w.data.icon,
        name: `${w.data.name} +`,
        desc: upg ? upg.desc : 'Улучшить оружие',
        rarity: 'upgrade',
        currentLevel: w.level
      });
    }

    // New weapons
    const allWeaponIds = Object.keys(WEAPONS_DATA);
    const playerWeaponIds = player.weapons.map(w => w.data.id);
    const availableWeapons = allWeaponIds.filter(id => !playerWeaponIds.includes(id));
    Utils.randChoice && availableWeapons.sort(() => Math.random() - 0.5);

    for (const id of availableWeapons) {
      if (choices.length >= POOL_SIZE) break;
      const d = WEAPONS_DATA[id];
      choices.push({
        type: 'new_weapon',
        weaponId: id,
        icon: d.icon,
        name: d.name,
        desc: d.desc,
        rarity: d.rarity
      });
    }

    // Passives
    const allPassiveIds = Object.keys(PASSIVES_DATA);
    const shuffled = [...allPassiveIds].sort(() => Math.random() - 0.5);
    for (const id of shuffled) {
      if (choices.length >= POOL_SIZE) break;
      const d = PASSIVES_DATA[id];
      const lvl = player.passives[id] || 0;
      if (lvl >= d.maxLevel) continue;
      choices.push({
        type: 'passive',
        passiveId: id,
        icon: d.icon,
        name: d.name,
        desc: d.desc,
        rarity: d.rarity,
        currentLevel: lvl || null
      });
    }

    // Pad to 3 if needed
    while (choices.length < POOL_SIZE) {
      const id = Utils.randChoice(allPassiveIds);
      const d = PASSIVES_DATA[id];
      const lvl = player.passives[id] || 0;
      if (lvl >= d.maxLevel) continue;
      choices.push({
        type: 'passive',
        passiveId: id,
        icon: d.icon,
        name: d.name,
        desc: d.desc,
        rarity: d.rarity,
        currentLevel: lvl || null
      });
    }

    return choices.slice(0, POOL_SIZE);
  }

  _rarityLabel(r) {
    const labels = {
      common: 'Обычное',
      rare: 'Редкое',
      epic: 'Эпическое',
      upgrade: 'Улучшение'
    };
    return labels[r] || r;
  }

  // ---- Game Over ----
  showGameOver(player, gameTime, score, kills, victory = false) {
    const el = document.getElementById('gameOverTitle');
    el.textContent = victory ? 'ПОБЕДА!' : 'GAME OVER';
    el.className = `gameover-title${victory ? ' victory' : ''}`;

    document.getElementById('finalTime').textContent  = Utils.formatTime(gameTime);
    document.getElementById('finalKills').textContent = kills;
    document.getElementById('finalLevel').textContent = player.level;
    document.getElementById('finalScore').textContent = Utils.formatNum(score);
    this.showScreen('gameOverScreen');
  }

  // ---- Screen management ----
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  // ---- Floating text ----
  spawnFloatText(text, x, y, type = 'damage') {
    const el = document.createElement('div');
    el.className = `float-text ${type}`;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // ---- Screen flash ----
  _screenFlash(color = 'red') {
    const el = document.createElement('div');
    el.className = `screen-flash ${color}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 400);
  }

  screenFlash(color) { this._screenFlash(color); }
}
