// ────────────────────────────────────────────────────────────────
// wagmiConfig.ts — конфигурация wagmi: сети Base + коннекторы кошельков.
// Поддержка Coinbase Wallet, MetaMask/injected, Base App wallet (ТЗ §39).
// Attribution: bc_188glhjm — Base App builder code для атрибуции транзакций.
// ────────────────────────────────────────────────────────────────

import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { Attribution } from 'ox/erc8021';

// Base App attribution — все транзакции (включая минт NFT) получат суффикс.
// Это позволяет Base отслеживать активность твоего приложения.
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_188glhjm'],
});

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],

  connectors: [
    coinbaseWallet({
      appName: 'Ashbound: Base Survivors',
      preference: 'all',
    }),
    injected(),
  ],

  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },

  // @ts-ignore — dataSuffix поддерживается wagmi через ox
  dataSuffix: DATA_SUFFIX,

  ssr: true,
});
