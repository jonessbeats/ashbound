export const PLAYER_CONFIG = {
  hp: 100,
  moveSpeed: 160,
  attackDamage: 10,
  attackCooldown: 800,
  attackRange: 220,
  critChance: 0, // 0..1
  projectileSpeed: 340,
  projectileCount: 1,
  pickupRadius: 70,
} as const;

export const ENEMY_CONFIG = {
  slime: { hp: 20, speed: 55, contactDamage: 8, xp: 4, size: 32, weight: 5 },
  bat: { hp: 10, speed: 155, contactDamage: 6, xp: 3, size: 28, weight: 4 },
  skeleton: { hp: 40, speed: 85, contactDamage: 13, xp: 7, size: 36, weight: 3 },
  elite: { hp: 220, speed: 72, contactDamage: 26, xp: 40, size: 44, weight: 0 },
  // Tiny RPG Forest by Ansimuz (CC0)
  treant: { hp: 160, speed: 48, contactDamage: 24, xp: 22, size: 46, weight: 0 },
  mole: { hp: 18, speed: 180, contactDamage: 11, xp: 6, size: 30, weight: 0 },
  // 2D Pixel Dungeon Asset Pack by Pixel_Poem (commercial OK)
  skeleton2: { hp: 80, speed: 68, contactDamage: 19, xp: 12, size: 36, weight: 0 },
  vampire: { hp: 30, speed: 145, contactDamage: 18, xp: 10, size: 34, weight: 0 },
  // Creature Free Pack by Electric Lemon Games (commercial OK)
  goblin: { hp: 35, speed: 115, contactDamage: 12, xp: 8, size: 34, weight: 4 },
  orc: { hp: 120, speed: 62, contactDamage: 28, xp: 18, size: 40, weight: 0 },
  mummy: { hp: 200, speed: 38, contactDamage: 11, xp: 16, size: 38, weight: 0 },
  zombie: { hp: 50, speed: 50, contactDamage: 16, xp: 6, size: 34, weight: 5 },
  fire_skull: { hp: 60, speed: 135, contactDamage: 20, xp: 14, size: 32, weight: 0 },
} as const;

export const BOSS_CONFIG = {
  hp: 1400,
  speed: 48,
  contactDamage: 28,
  xp: 200,
  size: 110,
  fireInterval: 1500,
  fireSpeed: 260,
  fireDamage: 18,
  fireRange: 420,
  fireBurst: 3,
  fireSpread: 0.35,
  summonInterval: 6000,
  summonCount: 3,

  phases: {
    phase1: { hpThreshold: 1.00, fireMul: 1.00, summonMul: 1.00, speedMul: 1.00 },
    phase2: { hpThreshold: 0.66, fireMul: 0.73, summonMul: 0.83, speedMul: 1.15 },
    phase3: { hpThreshold: 0.33, fireMul: 0.50, summonMul: 0.67, speedMul: 1.30 },
  },
};

export const DIFFICULTY = {
  scalePerMinute: 60, // difficulty = 1 + elapsedSeconds / 60
  baseSpawnRate: 1500,
  minSpawnRate: 400,
  spawnRateDecayPerSec: 5,
  eliteFirstSpawnSec: 75,
  eliteIntervalSec: 45,
};

export const ARENA = { width: 1600, height: 1600 };

export function scoreFromRun(kills: number, level: number, survivalSec: number): number {
  return kills * 10 + level * 50 + Math.floor(survivalSec);
}

export function xpForLevel(level: number): number {
  return Math.floor(8 + level * level * 2.2);
}
