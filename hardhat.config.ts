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
      optimizer: { enabled: true, runs: 200 }, // дешевле gas (ТЗ §38)
      // Cancun нужен для mcopy opcode, который использует OZ v5.1+.
      // Base mainnet и Sepolia поддерживают Cancun с весны 2024.
      evmVersion: 'cancun',
      // viaIR — промежуточный IR-проход оптимизатора. Лечит "Stack too deep"
      // на тяжёлых abi.encodePacked цепочках в tokenURI. Компиляция дольше
      // (~30 секунд против 5), bytecode чуть эффективнее. Стандартная практика
      // для NFT-контрактов с on-chain метаданными.
      viaIR: true,
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
  // Один ключ Basescan покрывает и testnet, и mainnet.
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY ?? '',
      base: process.env.BASESCAN_API_KEY ?? '',
    },
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
      {
        network: 'baseSepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia.basescan.org',
        },
      },
    ],
  },
};

export default config;
