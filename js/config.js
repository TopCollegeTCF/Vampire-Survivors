const CONFIG = {
  // World
  WORLD_W: 4000,
  WORLD_H: 4000,
  TILE_SIZE: 64,

  // Player
  PLAYER_BASE_HP: 100,
  PLAYER_BASE_SPEED: 200,
  PLAYER_RADIUS: 14,
  PLAYER_IFRAMES: 800, // ms invincibility after hit

  // XP
  XP_LEVELS: (() => {
    const arr = [0];
    for (let i = 1; i <= 60; i++) {
      arr.push(arr[i - 1] + Math.floor(5 + i * 8 + i * i * 0.8));
    }
    return arr;
  })(),

  // Camera
  CAM_LERP: 0.12,

  // Spawn
  SPAWN_RADIUS_MIN: 600,
  SPAWN_RADIUS_MAX: 800,

  // Game duration (seconds) — 15 min
  GAME_DURATION: 900,

  // Tile colors
  TILE_COLORS: ['#1a2a14','#162211','#1e2e16','#182412','#1c2813'],
  TILE_DETAIL_COLORS: ['#0e1a0c','#122010','#0c1808'],

  // Enemy types
  ENEMY_TYPES: {
    BAT: {
      id: 'BAT', name: 'Летучая мышь', emoji: '🦇',
      hp: 18, speed: 130, damage: 8, xp: 2, radius: 10,
      color: '#6a0dad', colorInner: '#9030d0',
      scoreValue: 10
    },
    SKELETON: {
      id: 'SKELETON', name: 'Скелет', emoji: '💀',
      hp: 45, speed: 75, damage: 15, xp: 5, radius: 14,
      color: '#c8b87a', colorInner: '#ddd0a0',
      scoreValue: 20
    },
    ZOMBIE: {
      id: 'ZOMBIE', name: 'Зомби', emoji: '🧟',
      hp: 80, speed: 55, damage: 20, xp: 8, radius: 16,
      color: '#2d5a2d', colorInner: '#4a8a4a',
      scoreValue: 30
    },
    GHOST: {
      id: 'GHOST', name: 'Призрак', emoji: '👻',
      hp: 30, speed: 100, damage: 12, xp: 6, radius: 13,
      color: 'rgba(150,180,255,0.7)', colorInner: 'rgba(200,220,255,0.9)',
      scoreValue: 25, phasing: true
    },
    ORC: {
      id: 'ORC', name: 'Орк', emoji: '👹',
      hp: 200, speed: 50, damage: 30, xp: 20, radius: 22,
      color: '#2a5a10', colorInner: '#50a030',
      scoreValue: 80
    },
    VAMPIRE: {
      id: 'VAMPIRE', name: 'Вампир', emoji: '🧛',
      hp: 120, speed: 95, damage: 25, xp: 15, radius: 16,
      color: '#8b0000', colorInner: '#c0152a',
      scoreValue: 60
    },
    DEMON: {
      id: 'DEMON', name: 'Демон', emoji: '😈',
      hp: 350, speed: 70, damage: 40, xp: 40, radius: 24,
      color: '#8b0000', colorInner: '#ff2222',
      scoreValue: 150, isBoss: true
    },
    LICH: {
      id: 'LICH', name: 'Лич', emoji: '☠️',
      hp: 600, speed: 60, damage: 50, xp: 80, radius: 28,
      color: '#3a0070', colorInner: '#9000ff',
      scoreValue: 300, isBoss: true
    }
  },

  // Spawn waves — by minute
  SPAWN_WAVES: [
    { time: 0,   types: ['BAT'], rate: 1.8 },
    { time: 30,  types: ['BAT', 'SKELETON'], rate: 1.5 },
    { time: 60,  types: ['BAT', 'SKELETON', 'ZOMBIE'], rate: 1.2 },
    { time: 90,  types: ['SKELETON', 'ZOMBIE', 'GHOST'], rate: 1.0 },
    { time: 120, types: ['ZOMBIE', 'GHOST', 'ORC'], rate: 0.9 },
    { time: 180, types: ['GHOST', 'ORC', 'VAMPIRE'], rate: 0.75 },
    { time: 240, types: ['ORC', 'VAMPIRE', 'DEMON'], rate: 0.6 },
    { time: 360, types: ['VAMPIRE', 'DEMON', 'LICH'], rate: 0.5 },
    { time: 480, types: ['DEMON', 'LICH'], rate: 0.4 }
  ],

  // XP gem sizes
  XP_GEM_SIZES: {
    small:  { r: 5,  xp: 2,  color: '#5dade2' },
    medium: { r: 7,  xp: 6,  color: '#a855f7' },
    large:  { r: 10, xp: 15, color: '#f59e0b' }
  }
};

// WEAPONS DATA
const WEAPONS_DATA = {
  SWORD_ARC: {
    id: 'SWORD_ARC', name: 'Удар мечом', icon: '⚔️',
    desc: 'Наносит урон веером перед персонажем',
    baseDamage: 30, baseCooldown: 0.9, baseRange: 100,
    arcAngle: Math.PI * 0.6, projectileCount: 1,
    rarity: 'common', maxLevel: 8,
    upgrades: [
      { dmg: 1.15, range: 1.1, desc: '+15% урон, +10% дальность' },
      { dmg: 1.2, cd: 0.9, desc: '+20% урон, -10% перезарядка' },
      { dmg: 1.2, arc: 1.2, desc: '+20% урон, +20% угол атаки' },
      { dmg: 1.3, count: 1, desc: '+30% урон, +1 удар' },
      { dmg: 1.2, range: 1.2, desc: '+20% урон, +20% дальность' },
      { dmg: 1.3, cd: 0.85, desc: '+30% урон, -15% перезарядка' },
      { dmg: 1.5, desc: '+50% урон (максимум!)' }
    ]
  },
  MAGIC_BOLT: {
    id: 'MAGIC_BOLT', name: 'Магический болт', icon: '🔮',
    desc: 'Запускает магические снаряды по случайным врагам',
    baseDamage: 18, baseCooldown: 1.4, baseRange: 350,
    projectileCount: 1, speed: 300, piercing: 1,
    rarity: 'common', maxLevel: 8,
    upgrades: [
      { dmg: 1.2, desc: '+20% урон' },
      { dmg: 1.1, count: 1, desc: '+10% урон, +1 снаряд' },
      { dmg: 1.2, cd: 0.9, desc: '+20% урон, -10% перезарядка' },
      { dmg: 1.1, piercing: 1, desc: '+10% урон, +1 пробитие' },
      { dmg: 1.3, count: 1, desc: '+30% урон, +1 снаряд' },
      { dmg: 1.2, cd: 0.85, desc: '+20% урон, -15% перезарядка' },
      { dmg: 1.5, desc: '+50% урон (максимум!)' }
    ]
  },
  HOLY_WATER: {
    id: 'HOLY_WATER', name: 'Святая вода', icon: '💧',
    desc: 'Бросает флакон, создающий лужу урона',
    baseDamage: 12, baseCooldown: 2.0, baseRange: 200,
    poolDuration: 3.0, poolRadius: 50, tickRate: 0.5,
    rarity: 'rare', maxLevel: 8,
    upgrades: [
      { dmg: 1.2, desc: '+20% урон лужи' },
      { dmg: 1.1, poolR: 1.2, desc: '+10% урон, +20% размер лужи' },
      { dmg: 1.2, cd: 0.9, desc: '+20% урон, -10% перезарядка' },
      { dmg: 1.1, poolDur: 1.3, desc: '+10% урон, +30% длительность' },
      { dmg: 1.3, count: 1, desc: '+30% урон, +1 бросок' },
      { dmg: 1.2, cd: 0.85, desc: '+20% урон, -15% перезарядка' },
      { dmg: 1.5, desc: '+50% урон (максимум!)' }
    ]
  },
  CROSS_BOOMERANG: {
    id: 'CROSS_BOOMERANG', name: 'Крест-бумеранг', icon: '✝️',
    desc: 'Летит прямо, отражается и возвращается',
    baseDamage: 22, baseCooldown: 1.6, baseRange: 300,
    speed: 260, rarity: 'rare', maxLevel: 8,
    upgrades: [
      { dmg: 1.25, desc: '+25% урон' },
      { dmg: 1.1, cd: 0.9, desc: '+10% урон, -10% перезарядка' },
      { dmg: 1.2, count: 1, desc: '+20% урон, +1 крест' },
      { dmg: 1.3, range: 1.2, desc: '+30% урон, +20% дальность' },
      { dmg: 1.2, cd: 0.85, desc: '+20% урон, -15% перезарядка' },
      { dmg: 1.2, count: 1, desc: '+20% урон, +1 крест' },
      { dmg: 1.5, desc: '+50% урон (максимум!)' }
    ]
  },
  LIGHTNING: {
    id: 'LIGHTNING', name: 'Молния', icon: '⚡',
    desc: 'Бьёт молнией по ближайшему врагу, цепляя соседей',
    baseDamage: 40, baseCooldown: 2.5, baseRange: 400,
    chainCount: 2, chainRange: 120,
    rarity: 'epic', maxLevel: 8,
    upgrades: [
      { dmg: 1.2, desc: '+20% урон' },
      { dmg: 1.1, chain: 1, desc: '+10% урон, +1 цепь' },
      { dmg: 1.3, cd: 0.9, desc: '+30% урон, -10% перезарядка' },
      { dmg: 1.2, chain: 1, chainR: 1.2, desc: '+20% урон, +1 цепь, +20% радиус цепи' },
      { dmg: 1.3, cd: 0.85, desc: '+30% урон, -15% перезарядка' },
      { dmg: 1.2, chain: 2, desc: '+20% урон, +2 цепи' },
      { dmg: 1.5, desc: '+50% урон (максимум!)' }
    ]
  },
  FIRE_WAND: {
    id: 'FIRE_WAND', name: 'Огненная палочка', icon: '🔥',
    desc: 'Стреляет огненным шаром, поджигающим врагов',
    baseDamage: 25, baseCooldown: 1.8, baseRange: 320,
    burnDamage: 5, burnDuration: 3.0, speed: 280,
    rarity: 'common', maxLevel: 8,
    upgrades: [
      { dmg: 1.2, desc: '+20% урон' },
      { dmg: 1.1, burnDmg: 1.3, desc: '+10% урон, +30% поджог' },
      { dmg: 1.2, cd: 0.9, desc: '+20% урон, -10% перезарядка' },
      { dmg: 1.1, burnDur: 1.4, count: 1, desc: '+10% урон, дольше поджог, +1 шар' },
      { dmg: 1.3, cd: 0.85, desc: '+30% урон, -15% перезарядка' },
      { dmg: 1.2, burnDmg: 1.5, desc: '+20% урон, +50% поджог' },
      { dmg: 1.5, desc: '+50% урон (максимум!)' }
    ]
  },
  GARLIC: {
    id: 'GARLIC', name: 'Чеснок', icon: '🧄',
    desc: 'Постоянный АоЕ урон вокруг персонажа',
    baseDamage: 6, baseCooldown: 0.5, baseRange: 90,
    rarity: 'rare', maxLevel: 8,
    upgrades: [
      { dmg: 1.3, desc: '+30% урон' },
      { dmg: 1.1, range: 1.2, desc: '+10% урон, +20% радиус' },
      { dmg: 1.3, cd: 0.85, desc: '+30% урон, -15% перезарядка' },
      { dmg: 1.2, range: 1.15, desc: '+20% урон, +15% радиус' },
      { dmg: 1.2, cd: 0.8, desc: '+20% урон, -20% перезарядка' },
      { dmg: 1.3, range: 1.2, desc: '+30% урон, +20% радиус' },
      { dmg: 1.5, desc: '+50% урон (максимум!)' }
    ]
  },
  SHADOW_BLADE: {
    id: 'SHADOW_BLADE', name: 'Теневой клинок', icon: '🗡️',
    desc: 'Высокоскоростные клинки в 8 направлениях',
    baseDamage: 14, baseCooldown: 1.1, baseRange: 200,
    projectileCount: 8, speed: 380, piercing: 99,
    rarity: 'epic', maxLevel: 8,
    upgrades: [
      { dmg: 1.2, desc: '+20% урон' },
      { dmg: 1.1, cd: 0.9, desc: '+10% урон, -10% перезарядка' },
      { dmg: 1.3, speed: 1.2, desc: '+30% урон, +20% скорость' },
      { dmg: 1.2, cd: 0.85, desc: '+20% урон, -15% перезарядка' },
      { dmg: 1.2, range: 1.2, desc: '+20% урон, +20% дальность' },
      { dmg: 1.3, cd: 0.8, desc: '+30% урон, -20% перезарядка' },
      { dmg: 1.5, desc: '+50% урон (максимум!)' }
    ]
  }
};

// PASSIVE UPGRADES DATA
const PASSIVES_DATA = {
  MAX_HP: {
    id: 'MAX_HP', name: 'Жизненная сила', icon: '❤️',
    desc: '+25% максимального HP',
    rarity: 'common', maxLevel: 5,
    apply: (player) => { player.maxHp = Math.round(player.maxHp * 1.25); player.hp = Math.min(player.hp + 25, player.maxHp); }
  },
  SPEED: {
    id: 'SPEED', name: 'Лёгкость', icon: '💨',
    desc: '+15% скорость передвижения',
    rarity: 'common', maxLevel: 5,
    apply: (player) => { player.speed *= 1.15; }
  },
  ARMOR: {
    id: 'ARMOR', name: 'Доспех', icon: '🛡️',
    desc: 'Уменьшает получаемый урон на 1',
    rarity: 'rare', maxLevel: 5,
    apply: (player) => { player.armor = (player.armor || 0) + 1; }
  },
  REGEN: {
    id: 'REGEN', name: 'Регенерация', icon: '💚',
    desc: '+0.5 HP/с регенерации',
    rarity: 'rare', maxLevel: 5,
    apply: (player) => { player.regen = (player.regen || 0) + 0.5; }
  },
  MAGNET: {
    id: 'MAGNET', name: 'Магнетизм', icon: '🧲',
    desc: '+50% радиус сбора опыта',
    rarity: 'common', maxLevel: 3,
    apply: (player) => { player.xpMagnetRadius = (player.xpMagnetRadius || 60) * 1.5; }
  },
  CRITICAL: {
    id: 'CRITICAL', name: 'Критический удар', icon: '💥',
    desc: '+10% шанс критического удара (2x урон)',
    rarity: 'rare', maxLevel: 5,
    apply: (player) => { player.critChance = (player.critChance || 0) + 10; }
  },
  XP_GAIN: {
    id: 'XP_GAIN', name: 'Мудрость', icon: '📚',
    desc: '+20% получаемый опыт',
    rarity: 'common', maxLevel: 5,
    apply: (player) => { player.xpMult = (player.xpMult || 1) * 1.2; }
  },
  COOLDOWN: {
    id: 'COOLDOWN', name: 'Быстрые руки', icon: '⏩',
    desc: '-10% перезарядка всего оружия',
    rarity: 'epic', maxLevel: 5,
    apply: (player) => { player.cdMult = (player.cdMult || 1) * 0.9; }
  }
};
