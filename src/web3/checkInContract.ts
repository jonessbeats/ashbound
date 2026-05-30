export { CHECKIN_ADDRESS } from './chains';

export const CHECKIN_ABI = [
  {
    type: 'function',
    name: 'checkIn',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'canCheckIn',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getRecord',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'lastDay', type: 'uint64' },
      { name: 'streak', type: 'uint32' },
      { name: 'bestStreak', type: 'uint32' },
      { name: 'total', type: 'uint32' },
    ],
  },
  {
    type: 'function',
    name: 'totalCheckIns',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'CheckIn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'day', type: 'uint64', indexed: true },
      { name: 'streak', type: 'uint32', indexed: false },
      { name: 'total', type: 'uint32', indexed: false },
    ],
  },
] as const;
