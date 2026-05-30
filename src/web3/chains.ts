import { base, baseSepolia } from 'viem/chains';

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532);

export const activeChain = CHAIN_ID === base.id ? base : baseSepolia;

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const CHECKIN_ADDRESS = (process.env.NEXT_PUBLIC_CHECKIN_ADDRESS ??
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const isTestnet = activeChain.id === baseSepolia.id;
