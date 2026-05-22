'use client';

// ────────────────────────────────────────────────────────────────
// MainMenu.tsx — главный экран (ТЗ §40).
// Пиксельный логотип ASHBOUND + случайный фон из пула (раз в сутки) +
// кнопки на полупрозрачной тёмной плашке для читаемости поверх любого фона.
// Каждый фон имеет mobile (9:16) и desktop wide (16:9) версии.
// ────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { loadProgress } from '@/web3/localProgress';
import WalletConnect from './WalletConnect';

// Пул фонов. Каждая запись содержит portrait и wide версию.
// "key" — стабильный идентификатор для детерминированного выбора по дате.
const BACKGROUNDS = [
  { key: 'castle', portrait: '/assets/menu/bg_castle.png', wide: '/assets/menu/bg_castle_wide.png' },
  { key: 'forest', portrait: '/assets/menu/bg_forest.png', wide: '/assets/menu/bg_forest_wide.png' },
  { key: 'aurora', portrait: '/assets/menu/bg_aurora.png', wide: '/assets/menu/bg_aurora_wide.png' },
  { key: 'lava', portrait: '/assets/menu/bg_lava.png', wide: '/assets/menu/bg_lava_wide.png' },
  { key: 'desert', portrait: '/assets/menu/bg_desert.png', wide: '/assets/menu/bg_desert_wide.png' },
  { key: 'swamp', portrait: '/assets/menu/bg_swamp.png', wide: '/assets/menu/bg_swamp_wide.png' },
];

// Стабильно-случайный фон по текущей дате (YYYY-MM-DD).
// Один день = один фон, на следующий день — другой. Не зависит от перезахода.
function pickDailyBackground(): (typeof BACKGROUNDS)[number] {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  // Простая хэш-сумма строки даты в число.
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return BACKGROUNDS[hash % BACKGROUNDS.length];
}

export default function MainMenu({ onStart }: { onStart: () => void }) {
  const [bestScore, setBestScore] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  // bg выбирается на клиенте, чтобы хэш считался от локальной даты юзера.
  const [bg, setBg] = useState<(typeof BACKGROUNDS)[number] | null>(null);
  // isWide — экран шире, чем выше → грузим landscape-версию фона.
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const p = loadProgress();
    setBestScore(p.bestScore);
    setTotalRuns(p.totalRuns);
    setBg(pickDailyBackground());

    // Определяем ориентацию и обновляем при ресайзе/повороте.
    const updateOrientation = () => setIsWide(window.innerWidth > window.innerHeight);
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  // Какую версию фона грузить — wide на десктопе, portrait на мобиле.
  const bgSrc = bg ? (isWide ? bg.wide : bg.portrait) : null;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#0a0c14] px-6">
      {/* Фоновая картинка — на весь экран, обрезается по центру (object-cover). */}
      {bgSrc && (
        <img
          src={bgSrc}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          // Подсказка браузеру: грузить с высоким приоритетом, картинка LCP.
          fetchPriority="high"
        />
      )}

      {/* Лёгкое затемнение поверх фона — чтобы UI читался даже на ярких фонах. */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      {/* Логотип ASHBOUND — пиксельный баннер.
          tracking-wider не нужен (он часть картинки). Размер регулируется max-w. */}
      <div className="relative z-10 mb-6 w-full max-w-md px-6">
        <img
          src="/assets/menu/logo.png"
          alt="ASHBOUND"
          className="h-auto w-full"
          style={{ imageRendering: 'pixelated' }}
        />
        <p className="mt-1 text-center font-mono text-xs tracking-[0.45em] text-amber-300/90">
          BASE SURVIVORS
        </p>
      </div>

      {/* Плашка с кнопками. Полупрозрачный тёмный фон + лёгкое размытие —
          UI читается поверх любого пиксельного фона. */}
      <div
        className="relative z-10 flex w-full max-w-xs flex-col gap-3 rounded-2xl p-5"
        style={{ background: 'rgba(8, 11, 20, 0.78)', backdropFilter: 'blur(2px)' }}
      >
        <p className="text-center text-xs text-slate-400">
          Survive endless waves. Clear locations. Mint your ashes.
        </p>

        <button
          onClick={onStart}
          className="min-h-[56px] rounded-lg bg-amber-600 font-mono text-lg tracking-wider text-slate-950 transition-colors active:bg-amber-500"
        >
          START RUN
        </button>
        <WalletConnect className="w-full" />

        {/* Локальная статистика — внутри той же плашки, мелким шрифтом */}
        <div className="mt-2 border-t border-slate-700/40 pt-3 text-center font-mono text-xs text-slate-500">
          <span>
            BEST <span className="text-amber-400">{bestScore.toLocaleString()}</span>
          </span>
          <span className="mx-3 text-slate-700">·</span>
          <span>
            RUNS <span className="text-slate-300">{totalRuns}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
