'use client';
import { useAccount } from 'wagmi';
import { useCheckIn } from '@/web3/useCheckIn';
import { activeChain } from '@/web3/chains';

export default function DailyCheckIn({ className = '' }: { className?: string }) {
  const { isConnected } = useAccount();
  const {
    doCheckIn,
    canCheckIn,
    streak,
    bestStreak,
    isPending,
    isConfirming,
    isSwitching,
    error,
    wrongNetwork,
  } = useCheckIn();

  if (!isConnected) return null;

  const busy = isPending || isConfirming || isSwitching;
  const disabled = busy || (!canCheckIn && !wrongNetwork);

  let label = 'GM · Daily Check-in';
  if (isSwitching) label = 'Switch network…';
  else if (isPending) label = 'Confirm in wallet…';
  else if (isConfirming) label = 'Checking in…';
  else if (wrongNetwork) label = `Switch to ${activeChain.name}`;
  else if (!canCheckIn) label = '✓ Checked in today';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        onClick={doCheckIn}
        disabled={disabled}
        className={
          'min-h-[44px] rounded-lg font-mono text-sm tracking-wider transition-colors ' +
          (disabled
            ? 'bg-slate-800/70 text-slate-500'
            : 'bg-sky-600 text-slate-950 active:bg-sky-500')
        }
      >
        {label}
      </button>

      
      {(streak > 0 || bestStreak > 0) && (
        <div className="text-center font-mono text-xs text-slate-400">
          <span>
            🔥 streak <span className="text-sky-400">{streak}</span>
          </span>
          <span className="mx-2 text-slate-700">·</span>
          <span>
            best <span className="text-slate-300">{bestStreak}</span>
          </span>
        </div>
      )}

      {error && (
        <p className="text-center text-xs text-rose-400">{error}</p>
      )}
    </div>
  );
}
