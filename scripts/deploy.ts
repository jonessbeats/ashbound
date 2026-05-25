const hre = require('hardhat');

const IMAGE_BASE_URI = 'https://ashbound.xyz/badges/';
const LOCATION_NAMES = ['Ashen Ruins', 'Dead Forest', 'Frozen Crypt'];

async function main() {
  const { ethers, network } = hre;

  const isMainnet = network.name === 'base';
  const isSepolia = network.name === 'baseSepolia';

  if (!isMainnet && !isSepolia) {
    console.error('Unknown network: ' + network.name);
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('');
  console.log('────────────────────────────────────────────────────────');
  console.log('СЕТЬ:     ' + network.name + (isMainnet ? '  ⚠ MAINNET' : ''));
  console.log('ДЕПЛОЕР:  ' + deployer.address);
  console.log('БАЛАНС:   ' + ethers.formatEther(balance) + ' ETH');
  console.log('imageBaseURI:  ' + IMAGE_BASE_URI);
  console.log('locationNames: ' + JSON.stringify(LOCATION_NAMES));
  console.log('────────────────────────────────────────────────────────');
  console.log('');

  if (balance < ethers.parseEther('0.001')) {
    console.error('Недостаточно ETH. Нужно минимум ~0.001 ETH.');
    process.exit(1);
  }

  if (isMainnet && process.env.CONFIRM_DEPLOY !== 'yes') {
    console.error('Деплой на MAINNET требует: CONFIRM_DEPLOY=yes npm run contracts:deploy:mainnet');
    process.exit(1);
  }

  console.log('Деплою...');
  const Factory = await ethers.getContractFactory('AshboundRunBadge');
  const contract = await Factory.deploy(IMAGE_BASE_URI, LOCATION_NAMES);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('');
  console.log('✓ Задеплоен: ' + address);
  console.log('');
  console.log('Обнови в .env.local:');
  console.log('  NEXT_PUBLIC_CONTRACT_ADDRESS=' + address);
  if (isMainnet) console.log('  NEXT_PUBLIC_CHAIN_ID=8453');
  console.log('');
  console.log('Обнови в Vercel → Settings → Environment Variables → те же строки.');
  console.log('');
  const netFlag = isMainnet ? '--network base' : '--network baseSepolia';
  console.log('Верификация:');
  console.log('  npx hardhat verify ' + netFlag + ' ' + address + ' "' + IMAGE_BASE_URI + '" \'["Ashen Ruins","Dead Forest","Frozen Crypt"]\'');
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
