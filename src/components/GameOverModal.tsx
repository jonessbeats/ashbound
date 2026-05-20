'use client';

// ────────────────────────────────────────────────────────────────
// GameOverModal.tsx — экран конца run.
// Две концовки: VICTORY (локация пройдена) и YOU DIED (игрок погиб).
// Кнопки: Restart / Next Location (только при победе) / Mint / Share.
// Минт бейджа — реальная onchain-транзакция на Base (ТЗ §31–32).
// ────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { EventBus, GameEvents } from '@/game/EventBus';
import type { RunResult } from '@/game/types';
import { LOCATIONS, getLocationIndex } from '@/game/locations';
import { saveRun } from '@/web3/localProgress';
import { useMintRunBadge } from '@/web3/mintRunBadge';
import { isTestnet } from '@/web3/chains';
import WalletConnect from './WalletConnect';

export default function GameOverModal() {
  const [result, setResult] = useState<RunResult | null>(null);
  const [bestScore, setBestScore] = useState(0);

  const { isConnected } = useAccount();
  const mint = useMintRunBadge();

  const mintRef = useRef(mint);
  mintRef.current = mint;

  // Слушаем конец run из Phaser (победа или смерть).
  useEffect(() => {
    const onGameOver = (r: RunResult) => {
      const progress = saveRun(r); // сохранить + отметить локацию пройденной
      mintRef.current.reset();
      setResult(r);
      setBestScore(progress.bestScore);
    };
    EventBus.on(GameEvents.GAME_OVER, onGameOver);
    return () => {
      EventBus.off(GameEvents.GAME_OVER, onGameOver);
    };
  }, []);

  if (!result) return null;

  const victory = result.victory;
  const mm = Math.floor(result.survivalTime / 60);
  const ss = (result.survivalTime % 60).toString().padStart(2, '0');

  // Есть ли следующая локация после пройденной.
  const idx = getLocationIndex(result.locationId);
  const nextLocation = victory && idx >= 0 ? LOCATIONS[idx + 1] : undefined;

  // Перезапустить ту же локацию.
  const restart = () => {
    EventBus.emit(GameEvents.RESTART);
    setResult(null);
  };

  // Перейти к следующей локации.
  const goNext = () => {
    if (!nextLocation) return;
    EventBus.emit(GameEvents.START_LOCATION, nextLocation.id);
    setResult(null);
  };

  const share = () => {
    const text = victory
      ? `Cleared ${result.locationName} in Ashbound: Base Survivors — ${result.score} points!`
      : `Fell on wave ${result.wavesCleared} in Ashbound: Base Survivors — ${result.score} points.`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      alert('Result copied to clipboard');
    }
  };

  const stats: [string, string | number][] = [
    ['Location', result.locationName],
    ['Waves Cleared', `${result.wavesCleared} / ${result.totalWaves}`],
    ['Time', `${mm}:${ss}`],
    ['Score', result.score.toLocaleString()],
    ['Level Reached', result.level],
    ['Enemies Killed', result.kills],
    ['Best Score', bestScore.toLocaleString()],
  ];

  // ── Текст кнопки минта по стадии транзакции ──
  let mintLabel = 'MINT RUN BADGE';
  if (mint.isSwitching) mintLabel = 'SWITCH NETWORK IN WALLET…';
  else if (mint.isPending) mintLabel = 'CONFIRM IN WALLET…';
  else if (mint.isConfirming) mintLabel = 'MINTING ON-CHAIN…';
  else if (mint.isSuccess) mintLabel = '✓ BADGE MINTED';
  const mintBusy = mint.isSwitching || mint.isPending || mint.isConfirming;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 p-5">
      {victory ? (
        <>
          <h2 className="mb-1 font-mono text-3xl tracking-widest text-amber-400">
            LOCATION CLEARED
          </h2>
          <p className="mb-6 text-sm text-slate-400">{result.locationName} has been survived</p>
        </>
      ) : (
        <>
          <h2 className="mb-1 font-mono text-3xl tracking-widest text-red-500">YOU DIED</h2>
          <p className="mb-6 text-sm text-slate-500">The ashes settle once more</p>
        </>
      )}

      {/* Таблица статов run */}
      <div className="mb-6 w-full max-w-sm rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between border-b border-slate-800/60 py-2 text-sm last:border-0"
          >
            <span className="text-slate-400">{label}</span>
            <span className="font-mono text-amber-300">{value}</span>
          </div>
        ))}
      </div>

      {/* Кнопки действий — все 44px+ (ТЗ §12) */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        {/* При победе и наличии следующей локации — кнопка перехода */}
        {nextLocation && (
          <button
            onClick={goNext}
            className="min-h-[52px] rounded-lg bg-amber-600 font-mono text-base text-slate-950 transition-colors active:bg-amber-500"
          >
            NEXT: {nextLocation.name.toUpperCase()}
          </button>
        )}

        <button
          onClick={restart}
          className={
            'min-h-[52px] rounded-lg font-mono text-base transition-colors ' +
            (nextLocation
              ? 'border border-slate-700 bg-slate-900 text-slate-300 active:bg-slate-800'
              : 'bg-amber-600 text-slate-950 active:bg-amber-500')
          }
        >
          {victory ? 'REPLAY LOCATION' : 'RETRY'}
        </button>

        {/* Минт бейджа */}
        {!isConnected ? (
          <WalletConnect className="w-full" />
        ) : (
          <button
            onClick={() => mint.mint(result)}
            disabled={mintBusy || mint.isSuccess}
            className="min-h-[52px] rounded-lg border border-amber-500/50 bg-slate-900 font-mono text-base text-amber-300 transition-colors active:bg-amber-950/60 disabled:opacity-60"
          >
            {mintLabel}
          </button>
        )}

        {mint.error && <p className="text-center text-xs text-red-400">{mint.error}</p>}

        {mint.isSuccess && mint.txHash && (
          <a
            href={`https://${isTestnet ? 'sepolia.' : ''}basescan.org/tx/${mint.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center font-mono text-xs text-sky-400 underline"
          >
            View transaction ↗
          </a>
        )}

        <button
          onClick={share}
          className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 font-mono text-sm text-slate-300 transition-colors active:bg-slate-800"
        >
          SHARE
        </button>
      </div>
    </div>
  );
}
