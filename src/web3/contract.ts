export { CONTRACT_ADDRESS } from './chains';

export const ASHBOUND_ABI = [
  // ── Mint ─────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'mintRunBadge',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'locationId', type: 'uint8' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },

  // ── Reads ────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'hasMinted',
    stateMutability: 'view',
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'locationId', type: 'uint8' },
    ],
    outputs: [{ name: '', type: 'bool' }],
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
    type: 'function',
    name: 'mintedPerLocation',
    stateMutability: 'view',
    inputs: [{ name: 'locationId', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },

  // ── Events ───────────────────────────────────────────────────
  {
    type: 'event',
    name: 'RunBadgeMinted',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'locationId', type: 'uint8', indexed: true },
      { name: 'edition', type: 'uint256', indexed: false },
      { name: 'mintedAt', type: 'uint256', indexed: false },
    ],
  },

  { type: 'error', name: 'InvalidLocation', inputs: [] },
  { type: 'error', name: 'AlreadyMintedForLocation', inputs: [] },
  { type: 'error', name: 'SoulboundNonTransferable', inputs: [] },
] as const;
