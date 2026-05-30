export type WeaponId = 'sword' | 'axe' | 'bow' | 'dagger' | 'spear' | 'staff';
export type WeaponStyle = 'melee' | 'ranged';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  description: string;
  spriteKey: string;
  style: WeaponStyle;
  baseDamage: number;
  baseCooldown: number;
  baseRange: number;
  projectileSpeed?: number;
  piercing?: boolean;
  swingArc?: number;
}

export const WEAPON_REGISTRY: Record<WeaponId, WeaponDef> = {
  sword: {
    id: 'sword',
    name: 'Sword',
    description: 'Wide arc melee attack. Your starting weapon.',
    spriteKey: 'weapon-sword',
    style: 'melee',
    baseDamage: 14,
    baseCooldown: 600,
    baseRange: 72,
    swingArc: Math.PI,           // 180°
  },
  axe: {
    id: 'axe',
    name: 'Battle Axe',
    description: 'Full 360° cleave. Slow but devastating.',
    spriteKey: 'weapon-axe',
    style: 'melee',
    baseDamage: 22,
    baseCooldown: 1100,
    baseRange: 68,
    swingArc: Math.PI * 2,       // 360°
  },
  dagger: {
    id: 'dagger',
    name: 'Dagger',
    description: 'Lightning fast stabs. Low range, high rate.',
    spriteKey: 'weapon-dagger',
    style: 'melee',
    baseDamage: 7,
    baseCooldown: 280,
    baseRange: 48,
    swingArc: Math.PI * 0.5,     // 90°
  },
  spear: {
    id: 'spear',
    name: 'Spear',
    description: 'Narrow piercing thrust with long reach.',
    spriteKey: 'weapon-spear',
    style: 'melee',
    baseDamage: 18,
    baseCooldown: 800,
    baseRange: 100,
    swingArc: Math.PI * 0.33,    // 60°
  },
  bow: {
    id: 'bow',
    name: 'Longbow',
    description: 'Fires an arrow at the nearest enemy.',
    spriteKey: 'weapon-bow',
    style: 'ranged',
    baseDamage: 12,
    baseCooldown: 700,
    baseRange: 500,
    projectileSpeed: 420,
    piercing: false,
  },
  staff: {
    id: 'staff',
    name: 'Fire Staff',
    description: 'Launches a homing firebolt at enemies.',
    spriteKey: 'weapon-staff',
    style: 'ranged',
    baseDamage: 16,
    baseCooldown: 900,
    baseRange: 400,
    projectileSpeed: 320,
    piercing: false,
  },
};

export const WEAPON_ORDER: WeaponId[] = ['sword', 'axe', 'dagger', 'spear', 'bow', 'staff'];

export interface WeaponState {
  def: WeaponDef;
  level: number;
  nextAttackAt: number;
  damage: number;
  cooldown: number;
  range: number;
}

export function makeWeaponState(id: WeaponId, now = 0): WeaponState {
  const def = WEAPON_REGISTRY[id];
  return {
    def,
    level: 1,
    nextAttackAt: now,
    damage: def.baseDamage,
    cooldown: def.baseCooldown,
    range: def.baseRange,
  };
}

export function upgradeWeapon(ws: WeaponState): WeaponState {
  if (ws.level >= 5) return ws;
  return {
    ...ws,
    level: ws.level + 1,
    damage: Math.round(ws.damage * 1.25),
    cooldown: Math.max(60, Math.round(ws.cooldown * 0.88)),
    range: Math.round(ws.range * 1.08),
  };
}
