'use client';

// ────────────────────────────────────────────────────────────────
// WalletConnect.tsx — подключение кошелька.
// Показывает только релевантные для Base кошельки: Coinbase, MetaMask,
// Rabby + общий Injected. Каждый со своим фирменным цветом.
// ────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import type { Connector } from 'wagmi';

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Фирменные стили кнопок по кошельку. Ключ — нижний регистр имени.
interface WalletStyle {
  label: string;
  className: string;
  priority: number; // порядок в списке
}

const WALLET_STYLES: Record<string, WalletStyle> = {
  'coinbase wallet': {
    label: 'Coinbase Wallet',
    className: 'border-blue-500 bg-blue-600 text-white active:bg-blue-500',
    priority: 1,
  },
  metamask: {
    label: 'MetaMask',
    className: 'border-orange-500 bg-orange-600 text-white active:bg-orange-500',
    priority: 2,
  },
  rabby: {
    label: 'Rabby',
    className: 'border-sky-400 bg-sky-500 text-white active:bg-sky-400',
    priority: 3,
  },
};

// Имена коннекторов, которые показываем (остальные инжектед прячем).
// 'injected' ловит дефолтный browser-кошелёк под общим именем.
function classify(name: string): { key: string; style: WalletStyle } | null {
  const n = name.trim().toLowerCase();
  if (n.includes('coinbase')) return { key: 'coinbase wallet', style: WALLET_STYLES['coinbase wallet'] };
  if (n.includes('metamask')) return { key: 'metamask', style: WALLET_STYLES['metamask'] };
  if (n.includes('rabby')) return { key: 'rabby', style: WALLET_STYLES['rabby'] };
  return null;
}

export default function WalletConnect({ className = '' }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [pickerOpen, setPickerOpen] = useState(false);

  // Отбираем только Coinbase / MetaMask / Rabby + один общий Injected.
  const seen = new Set<string>();
  const named: { connector: Connector; style: WalletStyle }[] = [];
  let injectedFallback: Connector | null = null;

  for (const c of connectors) {
    const hit = classify(c.name);
    if (hit) {
      if (seen.has(hit.key)) continue;
      seen.add(hit.key);
      named.push({ connector: c, style: hit.style });
    } else if (c.id === 'injected' && !injectedFallback) {
      injectedFallback = c;
    }
  }

  named.sort((a, b) => a.style.priority - b.style.priority);

  // ── Подключён ──
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

  return (
    <>
      <button
        onClick={() => setPickerOpen(true)}
        className={
          'min-h-[48px] rounded-lg border border-slate-700 bg-slate-900/80 ' +
          'font-mono text-sm text-slate-300 transition-colors active:bg-slate-800 ' +
          className
        }
      >
        CONNECT WALLET
      </button>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-center font-mono text-sm tracking-widest text-amber-400">
              SELECT WALLET
            </h3>

            <div className="flex flex-col gap-2">
              {named.map(({ connector, style }) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setPickerOpen(false);
                  }}
                  disabled={isPending}
                  className={
                    'min-h-[48px] rounded-lg border font-mono text-sm font-bold tracking-wide ' +
                    'transition-colors disabled:opacity-50 ' +
                    style.className
                  }
                >
                  {style.label}
                </button>
              ))}

              {/* Общий fallback для прочих браузерных кошельков */}
              {injectedFallback && (
                <button
                  onClick={() => {
                    connect({ connector: injectedFallback! });
                    setPickerOpen(false);
                  }}
                  disabled={isPending}
                  className="min-h-[44px] rounded-lg border border-slate-600 bg-slate-800/80 font-mono text-xs text-slate-300 transition-colors active:bg-slate-700 disabled:opacity-50"
                >
                  Other wallet
                </button>
              )}
            </div>

            <button
              onClick={() => setPickerOpen(false)}
              className="mt-3 min-h-[40px] w-full rounded-lg border border-slate-700 bg-slate-900 font-mono text-xs text-slate-400 active:bg-slate-800"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </>
  );
}
