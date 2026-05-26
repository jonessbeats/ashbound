// ────────────────────────────────────────────────────────────────
// upgrades.ts — пул апгрейдов и логика их применения (ТЗ §28).
// ────────────────────────────────────────────────────────────────

import type { Upgrade, UpgradeId } from './types';
import type Player from './Player';

// Полный список апгрейдов MVP.
export const UPGRADE_POOL: Upgrade[] = [
  { id: 'damage', title: '+20% Damage', description: 'All weapons hit harder' },
  { id: 'moveSpeed', title: '+15% Move Speed', description: 'Move faster — live longer' },
  { id: 'attackCooldown', title: '-15% Cooldown', description: 'Attack more often' },
  { id: 'maxHp', title: '+25 Max HP', description: 'Bigger health pool' },
  { id: 'pickupRadius', title: '+30 Pickup Radius', description: 'XP pulled from further away' },
  { id: 'critChance', title: '+8% Crit Chance', description: 'Chance to double damage' },
  { id: 'projectileSpeed', title: '+15% Weapon Speed', description: 'Faster swings and projectiles' },
  { id: 'projectileCount', title: '+15% Weapon Range', description: 'Melee reach & ranged distance' },
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
      // Бустим все оружия
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wmd = (player.scene as any).weaponManager;
      if (wmd && wmd.slots) {
        wmd.slots.forEach((ws: { damage: number }) => {
          ws.damage = Math.round(ws.damage * 1.2);
        });
      }
      break;
    case 'moveSpeed':
      s.moveSpeed = Math.round(s.moveSpeed * 1.15);
      break;
    case 'attackCooldown':
      s.attackCooldown = Math.max(80, Math.round(s.attackCooldown * 0.85));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wmc = (player.scene as any).weaponManager;
      if (wmc && wmc.slots) {
        wmc.slots.forEach((ws: { cooldown: number }) => {
          ws.cooldown = Math.max(60, Math.round(ws.cooldown * 0.85));
        });
      }
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
      s.projectileSpeed = Math.round(s.projectileSpeed * 1.15);
      // Реально применяем — ускоряем cooldown всех оружий (melee и ranged)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wmsp = (player.scene as any).weaponManager;
      if (wmsp && wmsp.slots) {
        wmsp.slots.forEach((ws: { cooldown: number }) => {
          ws.cooldown = Math.max(60, Math.round(ws.cooldown * 0.85));
        });
      }
      break;
    case 'projectileCount':
      // Теперь это global weapon range boost — увеличивает дальность всех оружий
      s.projectileCount += 1;
      // Применяем к WeaponManager через player.scene (костыль, но работает)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wm = (player.scene as any).weaponManager;
      if (wm && wm.slots) {
        wm.slots.forEach((ws: { range: number }) => {
          ws.range = Math.round(ws.range * 1.15);
        });
      }
      break;
  }
}
