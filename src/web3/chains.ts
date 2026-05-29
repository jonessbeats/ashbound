// ────────────────────────────────────────────────────────────────
// chains.ts — настройка сети Base (ТЗ §35).
// MVP работает на Base Sepolia (testnet). Для mainnet — поменять env.
// ────────────────────────────────────────────────────────────────

import { base, baseSepolia } from 'viem/chains';

// CHAIN_ID берётся из env. По умолчанию — Base Sepolia (84532).
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532);

// Выбираем объект цепи по id. Base mainnet = 8453.
export const activeChain = CHAIN_ID === base.id ? base : baseSepolia;

// Адрес задеплоенного контракта (заполнить после деплоя).
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Адрес контракта ежедневного чек-ина (заполнить после деплоя).
export const CHECKIN_ADDRESS = (process.env.NEXT_PUBLIC_CHECKIN_ADDRESS ??
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Удобный флаг — на тестнете мы или на мейннете.
export const isTestnet = activeChain.id === baseSepolia.id;
