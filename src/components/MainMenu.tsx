'use client';

// ────────────────────────────────────────────────────────────────
// MainMenu.tsx — главный экран (ТЗ §40).
// Logo, атмосферный фон, Start Run, Connect Wallet (заглушка), Best Score.
// ────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { loadProgress } from '@/web3/localProgress';
import WalletConnect from './WalletConnect';

export default function MainMenu({ onStart }: { onStart: () => void }) {
  const [bestScore, setBestScore] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);

  // localStorage доступен только на клиенте — читаем после монтирования.
  useEffect(() => {
    const p = loadProgress();
    setBestScore(p.bestScore);
    setTotalRuns(p.totalRuns);
  }, []);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#0a0c14] px-6">
      {/* Атмосферный фон: радиальное свечение факелов (ТЗ §15, §17) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(255,140,50,0.12), transparent 60%),' +
            'radial-gradient(ellipse at 20% 80%, rgba(120,60,160,0.14), transparent 55%),' +
            'radial-gradient(ellipse at 85% 70%, rgba(180,40,40,0.10), transparent 55%)',
        }}
      />

      {/* Логотип */}
      <div className="relative z-10 mb-2 text-center">
        <h1 className="font-mono text-4xl font-bold tracking-tight text-slate-100">
          ASHBOUND
        </h1>
        <p className="mt-1 font-mono text-sm tracking-[0.35em] text-amber-500">
          BASE SURVIVORS
        </p>
      </div>

      <p className="relative z-10 mb-10 max-w-xs text-center text-sm text-slate-500">
        Survive endless waves. Clear locations. Mint your ashes.
      </p>

      {/* Кнопки меню — крупные, 44px+ */}
      <div className="relative z-10 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onStart}
          className="min-h-[56px] rounded-lg bg-amber-600 font-mono text-lg tracking-wider text-slate-950 transition-colors active:bg-amber-500"
        >
          START RUN
        </button>
        <WalletConnect className="w-full" />
      </div>

      {/* Локальная статистика */}
      <div className="relative z-10 mt-8 text-center font-mono text-xs text-slate-600">
        <div>
          BEST SCORE <span className="text-amber-400">{bestScore.toLocaleString()}</span>
        </div>
        <div className="mt-1">
          RUNS <span className="text-slate-400">{totalRuns}</span>
        </div>
      </div>
    </div>
  );
}
