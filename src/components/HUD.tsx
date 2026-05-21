'use client';

// ────────────────────────────────────────────────────────────────
// HUD.tsx — игровой интерфейс поверх canvas (ТЗ §41).
// Показывает HP, XP, timer, level, kills, score.
// Данные приходят из Phaser через EventBus каждые ~100мс.
// ────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { EventBus, GameEvents } from '@/game/EventBus';
import type { HudState } from '@/game/types';

const INITIAL: HudState = {
  hp: 100,
  maxHp: 100,
  xp: 0,
  xpToNext: 10,
  level: 1,
  kills: 0,
  score: 0,
  timeSec: 0,
  wave: 1,
  totalWaves: 1,
  enemiesLeft: 0,
  bossActive: false,
  bossHpFraction: 0,
};

export default function HUD() {
  const [hud, setHud] = useState<HudState>(INITIAL);

  // Подписываемся на обновления HUD из игры.
  useEffect(() => {
    const onUpdate = (s: HudState) => setHud(s);
    EventBus.on(GameEvents.HUD_UPDATE, onUpdate);
    return () => {
      EventBus.off(GameEvents.HUD_UPDATE, onUpdate);
    };
  }, []);

  // Время в формате M:SS.
  const mm = Math.floor(hud.timeSec / 60);
  const ss = (hud.timeSec % 60).toString().padStart(2, '0');

  const hpPct = Math.max(0, (hud.hp / hud.maxHp) * 100);
  const xpPct = Math.min(100, (hud.xp / hud.xpToNext) * 100);

  return (
    // pointer-events-none — HUD не перехватывает касания (они идут в джойстик).
    // max-w + mx-auto — на широких экранах HUD не растягивается на всю ширину.
    // pr-16 — справа резервируем место под кнопку EXIT (top-right).
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto max-w-md p-3 pr-16">
      {/* Верхняя строка: волна по центру, level / kills по бокам */}
      <div className="flex items-center justify-between font-mono text-sm text-slate-200">
        <span className="rounded bg-slate-900/70 px-2 py-1">
          LVL <span className="text-amber-400">{hud.level}</span>
        </span>
        <span className="rounded bg-slate-900/70 px-3 py-1 text-base tracking-wide text-slate-100">
          WAVE <span className="text-amber-400">{hud.wave}</span>
          <span className="text-slate-500">/{hud.totalWaves}</span>
        </span>
        <span className="rounded bg-slate-900/70 px-2 py-1">
          ☠ <span className="text-red-400">{hud.kills}</span>
        </span>
      </div>

      {/* Подстрока: враги в волне + время */}
      <div className="mt-1 flex items-center justify-between font-mono text-xs text-slate-400">
        <span>
          {mm}:{ss}
        </span>
        <span>
          ENEMIES <span className="text-red-300">{hud.enemiesLeft}</span>
        </span>
      </div>

      {/* HP-бар */}
      <div className="mt-2">
        <div className="h-4 w-full overflow-hidden rounded border border-red-900/60 bg-slate-900/70">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-150"
            style={{ width: `${hpPct}%` }}
          />
        </div>
        <div className="mt-0.5 text-right font-mono text-xs text-red-300">
          {hud.hp} / {hud.maxHp} HP
        </div>
      </div>

      {/* XP-бар */}
      <div className="mt-1">
        <div className="h-2.5 w-full overflow-hidden rounded border border-sky-900/60 bg-slate-900/70">
          <div
            className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-150"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      {/* HP-бар босса — крупная полоса, видна только в боссовой волне */}
      {hud.bossActive && (
        <div className="mt-2">
          <div className="text-center font-mono text-xs tracking-widest text-red-400">
            ☠ BOSS ☠
          </div>
          <div className="mt-0.5 h-3.5 w-full overflow-hidden rounded border border-red-500/70 bg-slate-900/80">
            <div
              className="h-full bg-gradient-to-r from-red-800 via-red-600 to-amber-500 transition-all duration-150"
              style={{ width: `${Math.max(0, hud.bossHpFraction * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Счёт */}
      <div className="mt-1 text-center font-mono text-xs text-amber-300">
        SCORE {hud.score.toLocaleString()}
      </div>
    </div>
  );
}
