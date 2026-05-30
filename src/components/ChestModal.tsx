'use client';
import { useEffect, useState } from 'react';
import { EventBus, GameEvents } from '@/game/EventBus';
import { WEAPON_REGISTRY } from '@/game/weapons/weaponTypes';
import type { WeaponId } from '@/game/weapons/weaponTypes';

interface ChestOption {
  weaponId: WeaponId;
  isUpgrade: boolean;
}

const WEAPON_SPRITE: Record<WeaponId, string> = {
  sword:  '/assets/sprites/weapon_1.png',
  axe:    '/assets/sprites/weapon_6.png',
  bow:    '/assets/sprites/weapon_11.png',
  dagger: '/assets/sprites/weapon_22.png',
  spear:  '/assets/sprites/weapon_53.png',
  staff:  '/assets/sprites/weapon_57.png',
};

export default function ChestModal() {
  const [options, setOptions] = useState<ChestOption[] | null>(null);

  useEffect(() => {
    const onChestOpen = (opts: ChestOption[]) => setOptions(opts);
    EventBus.on(GameEvents.CHEST_OPEN, onChestOpen);
    return () => { EventBus.off(GameEvents.CHEST_OPEN, onChestOpen); };
  }, []);

  if (!options) return null;

  const pick = (opt: ChestOption) => {
    EventBus.emit(GameEvents.CHEST_PICKED, opt);
    setOptions(null);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 p-5">
      <div className="mb-1 text-3xl">🎁</div>
      <h2 className="mb-1 font-mono text-2xl tracking-widest text-amber-400">CHEST</h2>
      <p className="mb-6 text-sm text-slate-400">Pick one</p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {options.map((opt) => {
          const def = WEAPON_REGISTRY[opt.weaponId];
          return (
            <button
              key={opt.weaponId + opt.isUpgrade}
              onClick={() => pick(opt)}
              className="min-h-[72px] rounded-lg border border-amber-500/40 bg-slate-900/90 px-4 py-3 text-left transition-colors active:bg-amber-950/60"
            >
              <div className="flex items-center gap-3">
                <img
                  src={WEAPON_SPRITE[opt.weaponId]}
                  alt={def.name}
                  width={48}
                  height={48}
                  style={{ imageRendering: 'pixelated' }}
                  className="shrink-0"
                />
                <div>
                  <div className="font-mono text-base text-amber-300">
                    {opt.isUpgrade ? `Upgrade ${def.name}` : `New: ${def.name}`}
                    {opt.isUpgrade && (
                      <span className="ml-2 text-xs text-green-400">+12% dmg / -6% cd</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">{def.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
