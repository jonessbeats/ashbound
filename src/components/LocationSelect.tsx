'use client';
import { useEffect, useState } from 'react';
import { LOCATIONS } from '@/game/locations';
import { loadProgress, isLocationUnlocked } from '@/web3/localProgress';

interface Props {
  onPick: (locationId: string) => void;
  onBack: () => void;
}

export default function LocationSelect({ onPick, onBack }: Props) {
  const [cleared, setCleared] = useState<string[]>([]);

  useEffect(() => {
    setCleared(loadProgress().clearedLocations);
  }, []);

  // Meme Rush pinned to the top as the featured bonus level
  const ordered = [
    ...LOCATIONS.filter((l) => l.id === 'meme-rush'),
    ...LOCATIONS.filter((l) => l.id !== 'meme-rush'),
  ];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center bg-[#0a0c14] p-5">
      <h1 className="mb-1 mt-4 font-mono text-2xl tracking-widest text-amber-400">
        SELECT LOCATION
      </h1>
      <p className="mb-6 text-sm text-slate-500">Clear a location to unlock the next</p>

      
      <div className="flex w-full max-w-sm flex-col gap-3">
        {ordered.map((loc) => {
          const unlocked = isLocationUnlocked(loc.id, cleared);
          const done = cleared.includes(loc.id);
          const isMeme = loc.id === 'meme-rush';

          return (
            <button
              key={loc.id}
              disabled={!unlocked}
              onClick={() => unlocked && onPick(loc.id)}
              className={
                'min-h-[72px] rounded-lg border p-3 text-left transition-colors ' +
                (unlocked
                  ? isMeme
                    ? 'border-[#0052FF] bg-[#0052FF]/10 shadow-[0_0_20px_rgba(0,82,255,0.35)] active:bg-[#0052FF]/20'
                    : 'border-amber-500/40 bg-slate-900/80 active:bg-amber-950/50'
                  : 'border-slate-800 bg-slate-950/60 opacity-55')
              }
            >
              <div className="flex items-center justify-between">
                <span className={'font-mono text-base ' + (isMeme ? 'text-[#4d8bff]' : 'text-slate-100')}>{loc.name}</span>
                <span className="font-mono text-xs">
                  {done ? (
                    <span className="text-emerald-400">✓ CLEARED</span>
                  ) : unlocked ? (
                    isMeme ? (
                      <span className="text-[#4d8bff]">★ BONUS</span>
                    ) : (
                      <span className="text-amber-400">PLAYABLE</span>
                    )
                  ) : (
                    <span className="text-slate-500">🔒 LOCKED</span>
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{loc.description}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {loc.waves.length} waves
              </p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="mt-6 min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 px-6 font-mono text-sm text-slate-300 transition-colors active:bg-slate-800"
      >
        ← BACK
      </button>
    </div>
  );
}
