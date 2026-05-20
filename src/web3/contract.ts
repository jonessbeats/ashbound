// ────────────────────────────────────────────────────────────────
// contract.ts — ABI контракта AshboundRunBadge.
// Минимальный ABI: только то, что вызывает фронтенд (ТЗ §37).
// Полный ABI генерируется Hardhat'ом в artifacts/ после компиляции.
// ────────────────────────────────────────────────────────────────

export { CONTRACT_ADDRESS } from './chains';

// ABI — описание функций контракта для viem/wagmi.
// Здесь только mintRunBadge + событие RunBadgeMinted + balanceOf.
export const ASHBOUND_ABI = [
  {
    type: 'function',
    name: 'mintRunBadge',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'score', type: 'uint256' },
      { name: 'survivalTime', type: 'uint256' },
      { name: 'level', type: 'uint256' },
      { name: 'kills', type: 'uint256' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalMinted',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'RunBadgeMinted',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'score', type: 'uint256', indexed: false },
      { name: 'survivalTime', type: 'uint256', indexed: false },
      { name: 'level', type: 'uint256', indexed: false },
      { name: 'kills', type: 'uint256', indexed: false },
    ],
  },
] as const;
