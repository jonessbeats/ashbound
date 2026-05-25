// ────────────────────────────────────────────────────────────────
// types.ts — общие типы игры. Используются и Phaser-сценой, и React.
// ────────────────────────────────────────────────────────────────

// Виды врагов.
export type EnemyKind = 'slime' | 'bat' | 'skeleton' | 'skeleton2' | 'elite' | 'treant' | 'mole' | 'vampire';

// Текущие статы игрока (меняются апгрейдами по ходу run).
export interface PlayerStats {
  maxHp: number;
  moveSpeed: number;
  attackDamage: number;
  attackCooldown: number;
  attackRange: number;
  critChance: number;
  projectileSpeed: number;
  projectileCount: number;
  pickupRadius: number;
}

// Снимок состояния для HUD — сцена шлёт его каждый кадр в React.
export interface HudState {
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  kills: number;
  score: number;
  timeSec: number;
  wave: number; // текущая волна (1-based)
  totalWaves: number; // всего волн в локации
  enemiesLeft: number; // врагов осталось в текущей волне
  bossActive: boolean; // идёт ли бой с боссом
  bossHpFraction: number; // доля HP босса 0..1 (для HP-бара)
}

// Результат завершённого run — для экрана смерти/победы и минта NFT.
export interface RunResult {
  score: number;
  survivalTime: number; // секунды
  level: number;
  kills: number;
  timestamp: number; // Date.now()
  locationId: string; // в какой локации был run
  locationName: string; // её название (для экранов)
  wavesCleared: number; // сколько волн зачищено
  totalWaves: number; // всего волн в локации
  victory: boolean; // true — локация пройдена, false — игрок погиб
}

// Снимок состояния волн — сцена шлёт его в HUD.
export interface WaveState {
  current: number; // номер текущей волны (1-based)
  total: number; // всего волн в локации
  enemiesLeft: number; // сколько врагов осталось в текущей волне
  intermission: boolean; // true — пауза между волнами
  boss: boolean; // true — следующая/текущая волна боссовая
}

// Идентификаторы апгрейдов (ТЗ §28).
export type UpgradeId =
  | 'damage'
  | 'moveSpeed'
  | 'attackCooldown'
  | 'maxHp'
  | 'pickupRadius'
  | 'critChance'
  | 'projectileSpeed'
  | 'projectileCount';

// Описание апгрейда для модалки выбора.
export interface Upgrade {
  id: UpgradeId;
  title: string;
  description: string;
}
