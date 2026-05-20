// ────────────────────────────────────────────────────────────────
// hardhat.config.ts — конфигурация Hardhat для контракта (ТЗ §38, §48).
// Деплой на Base Sepolia (testnet), позже — Base Mainnet.
//
// Требует установки (один раз):
//   npm install -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
// ────────────────────────────────────────────────────────────────

import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config(); // подхватываем .env (приватный ключ деплоера)

// Приватный ключ кошелька-деплоера. НИКОГДА не коммить .env в git!
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'cancun',
      viaIR: true, // дешевле gas (ТЗ §38)
    },
  },
  networks: {
    // Base Sepolia — тестовая сеть для MVP (ТЗ §35).
    baseSepolia: {
      url: 'https://sepolia.base.org',
      chainId: 84532,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    // Base Mainnet — для продакшена (позже).
    base: {
      url: 'https://mainnet.base.org',
      chainId: 8453,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
  // Для верификации контракта на Basescan (опционально).
  etherscan: {
    apiKey: { baseSepolia: process.env.BASESCAN_API_KEY ?? '' },
  },
};

export default config;
