import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { Attribution } from 'ox/erc8021';

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

  dataSuffix: DATA_SUFFIX,

  ssr: true,
});
