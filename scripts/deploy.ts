const hre = require('hardhat');

const IMAGE_BASE_URI = 'https://ashbound.xyz/badges/';
const LOCATION_NAMES = [
  'Ashen Ruins',
  'Dead Forest',
  'Frozen Crypt',
  'Enchanted Forest',
  'Mountain Pass',
];

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
  console.log('--------------------------------------------------------');
  console.log('Network:  ' + network.name + (isMainnet ? '  MAINNET' : ''));
  console.log('Deployer: ' + deployer.address);
  console.log('Balance:  ' + ethers.formatEther(balance) + ' ETH');
  console.log('imageBaseURI:  ' + IMAGE_BASE_URI);
  console.log('locationNames: ' + JSON.stringify(LOCATION_NAMES));
  console.log('--------------------------------------------------------');
  console.log('');

  if (balance < ethers.parseEther('0.001')) {
    console.error('Insufficient ETH. Need at least ~0.001 ETH.');
    process.exit(1);
  }

  if (isMainnet && process.env.CONFIRM_DEPLOY !== 'yes') {
    console.error('Mainnet deploy requires: CONFIRM_DEPLOY=yes npm run contracts:deploy:mainnet');
    process.exit(1);
  }

  console.log('Deploying...');
  const Factory = await ethers.getContractFactory('AshboundRunBadge');
  const contract = await Factory.deploy(IMAGE_BASE_URI, LOCATION_NAMES);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('');
  console.log('Deployed: ' + address);
  console.log('');
  console.log('Set in .env.local:');
  console.log('  NEXT_PUBLIC_CONTRACT_ADDRESS=' + address);
  if (isMainnet) console.log('  NEXT_PUBLIC_CHAIN_ID=8453');
  console.log('');
  console.log('Set the same vars in Vercel -> Settings -> Environment Variables.');
  console.log('');
  const netFlag = isMainnet ? '--network base' : '--network baseSepolia';
  console.log('Verify:');
  console.log('  npx hardhat verify ' + netFlag + ' ' + address + ' "' + IMAGE_BASE_URI + '" \'[' + LOCATION_NAMES.map(n => '"' + n + '"').join(',') + ']\'');
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
