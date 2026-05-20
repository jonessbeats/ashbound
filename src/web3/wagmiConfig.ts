// ────────────────────────────────────────────────────────────────
// wagmiConfig.ts — конфигурация wagmi: сети Base + коннекторы кошельков.
// Поддержка Coinbase Wallet, MetaMask/injected, Base App wallet (ТЗ §39).
// ────────────────────────────────────────────────────────────────

import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

// Конфиг знает обе сети Base. Какая активна — решает chains.ts по env;
// кошелёк подключается к нужной, при необходимости предлагает переключиться.
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],

  // Коннекторы — способы подключить кошелёк (ТЗ §39).
  connectors: [
    // Coinbase Wallet — основной для Base App.
    coinbaseWallet({
      appName: 'Ashbound: Base Survivors',
      preference: 'all', // и smart wallet, и расширение
    }),
    // injected — MetaMask и любой кошелёк, встроенный в браузер.
    injected(),
  ],

  // Транспорт для каждой сети: http() берёт публичный RPC цепи.
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },

  // SSR-режим — Next.js рендерит на сервере, wagmi должен это учитывать.
  ssr: true,
});
