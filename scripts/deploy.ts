// ────────────────────────────────────────────────────────────────
// deploy.ts — скрипт деплоя AshboundRunBadge (ТЗ §48).
//
// Запуск:
//   npx hardhat run scripts/deploy.ts --network baseSepolia
//
// После деплоя скопируй адрес контракта в .env.local:
//   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
// ────────────────────────────────────────────────────────────────

import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  // Кошелёк-деплоер (берётся из hardhat.config networks.accounts).
  const [deployer] = await ethers.getSigners();
  console.log('Деплой от адреса:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Баланс деплоера:', ethers.formatEther(balance), 'ETH');

  // Разворачиваем контракт. Конструктор без аргументов.
  const Factory = await ethers.getContractFactory('AshboundRunBadge');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('');
  console.log('✓ AshboundRunBadge задеплоен:', address);
  console.log('');
  console.log('Добавь в .env.local:');
  console.log('  NEXT_PUBLIC_CONTRACT_ADDRESS=' + address);
}

// Стандартный обработчик ошибок для hardhat-скриптов.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
