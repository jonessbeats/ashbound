'use client';

// ────────────────────────────────────────────────────────────────
// WaveBanner.tsx — баннер «Wave N» поверх игры.
// Появляется на паузе между волнами (intermission), затем исчезает.
// Данные приходят из Phaser событием WAVE_CHANGED.
// ────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { EventBus, GameEvents } from '@/game/EventBus';
import type { WaveState } from '@/game/types';

export default function WaveBanner() {
  const [banner, setBanner] = useState<{ wave: number; total: number; boss: boolean } | null>(
    null,
  );

  useEffect(() => {
    const onWave = (s: WaveState) => {
      // Показываем баннер только в паузе перед волной.
      if (s.intermission) {
        setBanner({ wave: s.current, total: s.total, boss: s.boss });
        // Прячем через 2.2с (чуть короче паузы между волнами).
        const t = setTimeout(() => setBanner(null), 2200);
        return () => clearTimeout(t);
      } else {
        setBanner(null);
      }
    };
    EventBus.on(GameEvents.WAVE_CHANGED, onWave);
    return () => {
      EventBus.off(GameEvents.WAVE_CHANGED, onWave);
    };
  }, []);

  if (!banner) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div
        className={
          'rounded-lg border bg-slate-950/80 px-8 py-4 text-center ' +
          (banner.boss ? 'border-red-500/70' : 'border-amber-500/40')
        }
      >
        {banner.boss ? (
          <>
            <div className="font-mono text-2xl tracking-widest text-red-500">BOSS WAVE</div>
            <div className="mt-1 font-mono text-xs text-red-300">final wave — survive it</div>
          </>
        ) : (
          <>
            <div className="font-mono text-2xl tracking-widest text-amber-400">
              WAVE {banner.wave}
            </div>
            <div className="mt-1 font-mono text-xs text-slate-400">of {banner.total}</div>
          </>
        )}
      </div>
    </div>
  );
}
