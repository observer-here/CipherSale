import { ethers, network } from "hardhat";

const BNB_TESTNET_ID = 97;
const PRIMUS_VERIFIER = "0xBc074EbE6D39A97Fb35726832300a950e2D94324";

async function main() {
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  if (chainId !== BNB_TESTNET_ID) throw new Error(`This deploy is for BNB testnet (${BNB_TESTNET_ID})`);

  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Set PRIVATE_KEY");

  console.log(`network ${network.name} chain ${chainId}`);
  console.log(`deployer ${deployer.address}`);

  const usdt = await ethers.deployContract("USDT");
  await usdt.waitForDeployment();

  const cusdt = await ethers.deployContract("CipherToken", [
    "Confidential USDT",
    "cUSDT",
    await usdt.getAddress(),
  ]);
  await cusdt.waitForDeployment();

  const tokens = await ethers.deployContract("TokenFactory");
  await tokens.waitForDeployment();

  const sales = await ethers.deployContract("CipherSaleFactory", [
    await cusdt.getAddress(),
    PRIMUS_VERIFIER,
  ]);
  await sales.waitForDeployment();

  console.log(`USDT ${await usdt.getAddress()}`);
  console.log(`cUSDT ${await cusdt.getAddress()}`);
  console.log(`TokenFactory ${await tokens.getAddress()}`);
  console.log(`CipherSaleFactory ${await sales.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
