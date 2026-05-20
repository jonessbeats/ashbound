'use client';

// ────────────────────────────────────────────────────────────────
// WalletConnect.tsx — кнопка подключения кошелька (ТЗ §39).
// Не подключён → показывает «Connect Wallet».
// Подключён → показывает сокращённый адрес + возможность отключиться.
// ────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// 0x1234…abcd — укоротить адрес для компактного отображения.
function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletConnect({ className = '' }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Открыт ли список коннекторов (когда их несколько).
  const [pickerOpen, setPickerOpen] = useState(false);

  // ── Кошелёк подключён: показываем адрес, тап = отключить ──
  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className={
          'min-h-[48px] rounded-lg border border-emerald-600/50 bg-slate-900/80 ' +
          'font-mono text-sm text-emerald-300 transition-colors active:bg-slate-800 ' +
          className
        }
      >
        {shortAddress(address)} · DISCONNECT
      </button>
    );
  }

  // ── Список коннекторов открыт: показываем по кнопке на кошелёк ──
  if (pickerOpen) {
    return (
      <div className={'flex flex-col gap-2 ' + className}>
        {connectors.map((c) => (
          <button
            key={c.uid}
            onClick={() => {
              connect({ connector: c });
              setPickerOpen(false);
            }}
            disabled={isPending}
            className="min-h-[48px] rounded-lg border border-amber-500/40 bg-slate-900/90 font-mono text-sm text-amber-300 transition-colors active:bg-amber-950/60 disabled:opacity-50"
          >
            {c.name}
          </button>
        ))}
        <button
          onClick={() => setPickerOpen(false)}
          className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-900 font-mono text-xs text-slate-400 active:bg-slate-800"
        >
          CANCEL
        </button>
      </div>
    );
  }

  // ── Не подключён: единая кнопка «Connect Wallet» ──
  return (
    <button
      onClick={() => {
        // Один коннектор — соединяемся сразу; несколько — открываем выбор.
        if (connectors.length === 1) connect({ connector: connectors[0] });
        else setPickerOpen(true);
      }}
      className={
        'min-h-[48px] rounded-lg border border-slate-700 bg-slate-900/80 ' +
        'font-mono text-sm text-slate-300 transition-colors active:bg-slate-800 ' +
        className
      }
    >
      CONNECT WALLET
    </button>
  );
}
