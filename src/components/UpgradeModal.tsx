'use client';
import { useEffect, useState } from 'react';
import { EventBus, GameEvents } from '@/game/EventBus';
import type { Upgrade, UpgradeId } from '@/game/types';

export default function UpgradeModal() {
  const [choices, setChoices] = useState<Upgrade[] | null>(null);

  useEffect(() => {
    const onLevelUp = (ups: Upgrade[]) => setChoices(ups);
    EventBus.on(GameEvents.LEVEL_UP, onLevelUp);
    return () => {
      EventBus.off(GameEvents.LEVEL_UP, onLevelUp);
    };
  }, []);

  if (!choices) return null;

  const pick = (id: UpgradeId) => {
    EventBus.emit(GameEvents.UPGRADE_PICKED, id);
    setChoices(null);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 p-5">
      <h2 className="mb-1 font-mono text-2xl tracking-widest text-amber-400">LEVEL UP</h2>
      <p className="mb-6 text-sm text-slate-400">Pick one</p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {choices.map((u) => (
          <button
            key={u.id}
            onClick={() => pick(u.id)}
            className="min-h-[64px] rounded-lg border border-amber-500/40 bg-slate-900/90 px-4 py-3 text-left transition-colors active:bg-amber-950/60"
          >
            <div className="font-mono text-base text-amber-300">{u.title}</div>
            <div className="text-sm text-slate-400">{u.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
