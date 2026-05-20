// ────────────────────────────────────────────────────────────────
// upgrades.ts — пул апгрейдов и логика их применения (ТЗ §28).
// ────────────────────────────────────────────────────────────────

import type { Upgrade, UpgradeId } from './types';
import type Player from './Player';

// Полный список апгрейдов MVP.
export const UPGRADE_POOL: Upgrade[] = [
  { id: 'damage', title: '+20% Damage', description: 'Огненные болты бьют сильнее' },
  { id: 'moveSpeed', title: '+15% Move Speed', description: 'Двигайся быстрее — живи дольше' },
  { id: 'attackCooldown', title: '-15% Cooldown', description: 'Стреляешь чаще' },
  { id: 'maxHp', title: '+25 Max HP', description: 'Больше запас прочности' },
  { id: 'pickupRadius', title: '+30 Pickup Radius', description: 'XP притягивается издалека' },
  { id: 'critChance', title: '+8% Crit Chance', description: 'Шанс удвоить урон' },
  { id: 'projectileSpeed', title: '+25% Projectile Speed', description: 'Болты летят быстрее' },
  { id: 'projectileCount', title: '+1 Projectile', description: 'Ещё один болт за выстрел' },
];

// Выбрать 3 случайных разных апгрейда для модалки level up.
export function rollUpgrades(): Upgrade[] {
  const pool = [...UPGRADE_POOL];
  const out: Upgrade[] = [];
  while (out.length < 3 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

// Применить выбранный апгрейд к игроку.
export function applyUpgrade(player: Player, id: UpgradeId): void {
  const s = player.stats;
  switch (id) {
    case 'damage':
      s.attackDamage = Math.round(s.attackDamage * 1.2);
      break;
    case 'moveSpeed':
      s.moveSpeed = Math.round(s.moveSpeed * 1.15);
      break;
    case 'attackCooldown':
      s.attackCooldown = Math.round(s.attackCooldown * 0.85);
      break;
    case 'maxHp':
      s.maxHp += 25;
      player.heal(25); // лечим на величину прибавки
      break;
    case 'pickupRadius':
      s.pickupRadius += 30;
      break;
    case 'critChance':
      s.critChance = Math.min(1, s.critChance + 0.08);
      break;
    case 'projectileSpeed':
      s.projectileSpeed = Math.round(s.projectileSpeed * 1.25);
      break;
    case 'projectileCount':
      s.projectileCount += 1;
      break;
  }
}
