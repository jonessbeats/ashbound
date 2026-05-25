const { run } = require("hardhat");

async function main() {
  console.log("Верифицирую контракт на Base Mainnet...");
  await run("verify:verify", {
    address: "0x40CB3b0BfDF8758bd8aAd0633e1D8b360D70bb0E",
    constructorArguments: [
      "https://ashbound.xyz/badges/",
      ["Ashen Ruins", "Dead Forest", "Frozen Crypt"]
    ],
  });
  console.log("✓ Контракт верифицирован!");
}

main().catch(console.error);
