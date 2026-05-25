// ────────────────────────────────────────────────────────────────
// config.ts — все настройки игры в одном месте.
// Меняй ЦИФРЫ здесь, не лезь в игровую логику.
// ────────────────────────────────────────────────────────────────

// Стартовые параметры игрока (ТЗ §20).
export const PLAYER_CONFIG = {
  hp: 100,
  moveSpeed: 160,
  attackDamage: 10,
  attackCooldown: 800, // мс между автоатаками
  attackRange: 220, // радиус, в котором ищется цель (px)
  critChance: 0, // 0..1
  projectileSpeed: 340, // скорость огненного болта (px/s)
  projectileCount: 1, // сколько болтов за выстрел
  pickupRadius: 70, // радиус притяжения XP-орбов (px)
} as const;

// Базовые параметры врагов ДО умножения на difficulty (ТЗ §21).
// weight — вес в случайном выборе обычного врага (elite спавнится отдельно).
// Базовые статы врагов (ТЗ §22). Меняешь тут — меняется в игре.
// size — высота спрайта на экране (px). Влияет и на масштаб, и на хитбокс.
export const ENEMY_CONFIG = {
  slime: { hp: 20, speed: 45, contactDamage: 6, xp: 4, size: 24, weight: 5 },
  bat: { hp: 10, speed: 130, contactDamage: 4, xp: 3, size: 18, weight: 4 },
  skeleton: { hp: 40, speed: 70, contactDamage: 10, xp: 7, size: 26, weight: 3 },
  elite: { hp: 220, speed: 60, contactDamage: 20, xp: 40, size: 38, weight: 0 },
  // Tiny RPG Forest by Ansimuz (CC0)
  // Treant — медленный живой лес, много HP, тяжёлый удар
  treant: { hp: 160, speed: 38, contactDamage: 18, xp: 22, size: 42, weight: 0 },
  // Mole — юркий крот, мало HP, быстрый, ныряет близко
  mole: { hp: 18, speed: 150, contactDamage: 8, xp: 6, size: 22, weight: 0 },
} as const;

// Параметры босса (ТЗ §21). HP/урон масштабируются множителем волны.
export const BOSS_CONFIG = {
  hp: 1400, // базовое HP — намного выше элитки
  speed: 48, // базовая скорость (на фазе 1)
  contactDamage: 28, // тяжёлый контактный урон
  xp: 200, // большая награда
  size: 110, // крупный спрайт (высота в пикселях на экране)
  // Способность «огонь»: периодический выстрел по прямой в игрока.
  // Снаряд летит ровно в точку, где был игрок на момент выстрела —
  // увернуться можно, просто сместившись с линии огня.
  fireInterval: 2200, // мс между выстрелами огнём (фаза 1)
  fireSpeed: 230, // скорость снаряда огня (px/s)
  fireDamage: 16, // урон от попадания огня
  // Способность «призыв»: периодический спавн свиты.
  summonInterval: 6000, // мс между призывами (фаза 1)
  summonCount: 3, // сколько мелких врагов за один призыв

  // Фазы по HP — босс становится злее по мере получения урона.
  // Множители применяются к базовым параметрам выше.
  phases: {
    // Фаза 1 (100..66% HP) — базовые тайминги, никаких множителей.
    phase1: { hpThreshold: 1.00, fireMul: 1.00, summonMul: 1.00, speedMul: 1.00 },
    // Фаза 2 (66..33%) — атаки чаще, чуть быстрее.
    phase2: { hpThreshold: 0.66, fireMul: 0.73, summonMul: 0.83, speedMul: 1.15 },
    // Фаза 3 (<33%) — в ярости: огонь и призыв спамом, заметно быстрее.
    phase3: { hpThreshold: 0.33, fireMul: 0.50, summonMul: 0.67, speedMul: 1.30 },
  },
};

// Параметры роста сложности (ТЗ §23–24).
export const DIFFICULTY = {
  scalePerMinute: 60, // difficulty = 1 + elapsedSeconds / 60
  baseSpawnRate: 1500, // стартовый интервал спавна (мс)
  minSpawnRate: 400, // минимальный интервал спавна (мс)
  spawnRateDecayPerSec: 5, // на сколько мс уменьшается интервал за секунду
  eliteFirstSpawnSec: 75, // когда появится первая элитка
  eliteIntervalSec: 45, // интервал между элитками
};

// Размер арены — небольшая закрытая карта, камера следует за игроком.
export const ARENA = { width: 1600, height: 1600 };

// Финальный счёт за run.
export function scoreFromRun(kills: number, level: number, survivalSec: number): number {
  return kills * 10 + level * 50 + Math.floor(survivalSec);
}

// Сколько XP нужно для перехода на следующий уровень (растёт квадратично).
export function xpForLevel(level: number): number {
  return Math.floor(8 + level * level * 2.2);
}
