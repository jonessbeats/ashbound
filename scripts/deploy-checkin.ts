//
// Sepolia:  npx hardhat run scripts/deploy-checkin.ts --network baseSepolia
// Mainnet:  $env:CONFIRM_DEPLOY="yes"; npx hardhat run scripts/deploy-checkin.ts --network base
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
    console.error('Mainnet deploy requires CONFIRM_DEPLOY=yes. Aborting.');
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log('Network:', network.name);
  console.log('Deployer:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');

  const Factory = await ethers.getContractFactory('AshboundCheckIn');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\nAshboundCheckIn deployed:', address);
  console.log('\nAdd to .env.local and Vercel:');
  console.log('  NEXT_PUBLIC_CHECKIN_ADDRESS=' + address);

  const netFlag = isMainnet ? '--network base' : '--network baseSepolia';
  console.log('\nVerify (no constructor args):');
  console.log('  npx hardhat verify ' + netFlag + ' ' + address);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
