export type EnemyKind = 'slime' | 'bat' | 'skeleton' | 'skeleton2' | 'elite' | 'treant' | 'mole' | 'vampire' | 'goblin' | 'orc' | 'mummy' | 'zombie' | 'fire_skull';

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

export interface HudState {
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  kills: number;
  score: number;
  timeSec: number;
  wave: number;
  totalWaves: number;
  enemiesLeft: number;
  bossActive: boolean;
  bossHpFraction: number;
}

export interface RunResult {
  score: number;
  survivalTime: number;
  level: number;
  kills: number;
  timestamp: number; // Date.now()
  locationId: string;
  locationName: string;
  wavesCleared: number;
  totalWaves: number;
  victory: boolean;
}

export interface WaveState {
  current: number;
  total: number;
  enemiesLeft: number;
  intermission: boolean;
  boss: boolean;
}

export type UpgradeId =
  | 'damage'
  | 'moveSpeed'
  | 'attackCooldown'
  | 'maxHp'
  | 'pickupRadius'
  | 'critChance'
  | 'projectileSpeed'
  | 'projectileCount';

export interface Upgrade {
  id: UpgradeId;
  title: string;
  description: string;
}
