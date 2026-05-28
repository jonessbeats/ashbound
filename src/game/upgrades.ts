// ────────────────────────────────────────────────────────────────
// upgrades.ts — пул апгрейдов и логика применения.
// ВАЖНО: каждый стат имеет ЛИМИТ по количеству применений.
// Это не даёт игроку собрать имбобилд за 5 минут.
// ────────────────────────────────────────────────────────────────

import type { Upgrade, UpgradeId } from './types';
import type Player from './Player';

// Сколько раз можно взять каждый апгрейд за run.
export const UPGRADE_LIMITS: Record<UpgradeId, number> = {
  damage: 4,
  moveSpeed: 3,
  attackCooldown: 4,
  maxHp: 5,
  pickupRadius: 3,
  critChance: 4,           // макс 32% крита (4 × 8%)
  projectileSpeed: 3,
  projectileCount: 3,      // макс +45% range (3 × 15%)
};

// Счётчик использований за текущий run (сбрасывается при beginLocation).
const usedCount: Partial<Record<UpgradeId, number>> = {};

export function resetUpgradeCounts(): void {
  for (const k in usedCount) delete usedCount[k as UpgradeId];
}

function isAvailable(id: UpgradeId): boolean {
  return (usedCount[id] ?? 0) < UPGRADE_LIMITS[id];
}

// Полный список апгрейдов.
export const UPGRADE_POOL: Upgrade[] = [
  { id: 'damage', title: '+12% Damage', description: 'All weapons hit harder' },
  { id: 'moveSpeed', title: '+10% Move Speed', description: 'Move faster — live longer' },
  { id: 'attackCooldown', title: '-10% Cooldown', description: 'Attack more often' },
  { id: 'maxHp', title: '+20 Max HP', description: 'Bigger health pool' },
  { id: 'pickupRadius', title: '+25 Pickup Radius', description: 'XP pulled from further away' },
  { id: 'critChance', title: '+8% Crit Chance', description: 'Chance to double damage' },
  { id: 'projectileSpeed', title: '+10% Weapon Speed', description: 'Faster swings and projectiles' },
  { id: 'projectileCount', title: '+15% Weapon Range', description: 'Melee reach & ranged distance' },
];

// Выбрать 3 случайных разных апгрейда — только из доступных (не исчерпанных).
export function rollUpgrades(): Upgrade[] {
  const pool = UPGRADE_POOL.filter((u) => isAvailable(u.id));
  const out: Upgrade[] = [];
  const work = [...pool];
  while (out.length < 3 && work.length > 0) {
    const i = Math.floor(Math.random() * work.length);
    out.push(work.splice(i, 1)[0]);
  }
  // Если меньше 3 опций (всё исчерпано) — добавим maxHp как safe-апгрейд
  while (out.length < 3) {
    out.push({ id: 'maxHp', title: '+10 Max HP', description: 'Tiny bonus' });
  }
  return out;
}

// Типизированный геттер WeaponManager-а. Безопасный — возвращает undefined
// если сцена или менеджер ещё не готовы.
function getWM(player: Player): {
  slots: { damage: number; cooldown: number; range: number }[]
} | undefined {
  const scene = player?.scene as unknown as {
    weaponManager?: { slots?: { damage: number; cooldown: number; range: number }[] }
  } | undefined;
  if (!scene || !scene.weaponManager || !Array.isArray(scene.weaponManager.slots)) {
    return undefined;
  }
  return scene.weaponManager as {
    slots: { damage: number; cooldown: number; range: number }[]
  };
}

// Применить выбранный апгрейд к игроку.
export function applyUpgrade(player: Player, id: UpgradeId): void {
  // Засчитываем использование
  usedCount[id] = (usedCount[id] ?? 0) + 1;

  const s = player.stats;
  const wm = getWM(player);

  switch (id) {
    case 'damage':
      s.attackDamage = Math.round(s.attackDamage * 1.12);
      if (wm) wm.slots.forEach((ws) => { ws.damage = Math.round(ws.damage * 1.12); });
      break;
    case 'moveSpeed':
      s.moveSpeed = Math.round(s.moveSpeed * 1.10);
      break;
    case 'attackCooldown':
      s.attackCooldown = Math.max(120, Math.round(s.attackCooldown * 0.90));
      if (wm) wm.slots.forEach((ws) => {
        ws.cooldown = Math.max(150, Math.round(ws.cooldown * 0.90));
      });
      break;
    case 'maxHp':
      s.maxHp += 20;
      player.heal(20);
      break;
    case 'pickupRadius':
      s.pickupRadius += 25;
      break;
    case 'critChance':
      s.critChance = Math.min(0.4, s.critChance + 0.08); // потолок 40%
      break;
    case 'projectileSpeed':
      s.projectileSpeed = Math.round(s.projectileSpeed * 1.10);
      if (wm) wm.slots.forEach((ws) => {
        ws.cooldown = Math.max(150, Math.round(ws.cooldown * 0.90));
      });
      break;
    case 'projectileCount':
      s.projectileCount += 1;
      if (wm) wm.slots.forEach((ws) => {
        ws.range = Math.round(ws.range * 1.15);
      });
      break;
  }
}
