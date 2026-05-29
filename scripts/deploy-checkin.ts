// ─────────────────────────────────────────────────────────────────
// deploy-checkin.ts — деплой контракта ежедневного чек-ина.
//
// Sepolia:  npx hardhat run scripts/deploy-checkin.ts --network baseSepolia
// Mainnet:  $env:CONFIRM_DEPLOY="yes"; npx hardhat run scripts/deploy-checkin.ts --network base
// ─────────────────────────────────────────────────────────────────

const hre = require('hardhat');

async function main() {
  const { ethers, network } = hre;

  const isMainnet = network.name === 'base';
  const isSepolia = network.name === 'baseSepolia';

  if (!isMainnet && !isSepolia) {
    console.error('Unknown network: ' + network.name);
    process.exit(1);
  }

  if (isMainnet && process.env.CONFIRM_DEPLOY !== 'yes') {
    console.error('Mainnet-деплой требует CONFIRM_DEPLOY=yes. Прерываю.');
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log('Сеть:', network.name);
  console.log('Деплоер:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Баланс:', ethers.formatEther(balance), 'ETH');

  const Factory = await ethers.getContractFactory('AshboundCheckIn');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\n✓ AshboundCheckIn задеплоен:', address);
  console.log('\nДобавь в .env.local и Vercel:');
  console.log('  NEXT_PUBLIC_CHECKIN_ADDRESS=' + address);

  const netFlag = isMainnet ? '--network base' : '--network baseSepolia';
  console.log('\nВерификация (без аргументов конструктора):');
  console.log('  npx hardhat verify ' + netFlag + ' ' + address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
