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

export default function HUD({ onExit }: { onExit: () => void }) {
  const [hud, setHud] = useState<HudState>(INITIAL);
  const [confirmExit, setConfirmExit] = useState(false);

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
    // Кнопки внутри HUD при этом переопределяют pointer-events:auto.
    // max-w + mx-auto — на широких экранах HUD не растягивается на всю ширину.
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto max-w-md p-3">
      {/* Верхняя строка: 4 плашки одинакового стиля — LVL / WAVE / KILLS / EXIT */}
      <div className="flex items-center justify-between gap-2 font-mono text-sm text-slate-200">
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
        {/* EXIT — выглядит как остальные плашки, но кликабелен.
            Тап 1 — переход в «confirm»-режим (надпись YES?), тап 2 — выход.
            Через 3с без второго тапа сбрасывается обратно. */}
        <button
          onClick={() => {
            if (confirmExit) {
              onExit();
            } else {
              setConfirmExit(true);
              setTimeout(() => setConfirmExit(false), 3000);
            }
          }}
          className={
            'pointer-events-auto rounded px-2 py-1 transition-colors ' +
            (confirmExit
              ? 'bg-red-900/80 text-red-100 active:bg-red-800'
              : 'bg-slate-900/70 text-slate-200 active:bg-slate-800')
          }
        >
          {confirmExit ? 'YES?' : 'EXIT'}
        </button>
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
