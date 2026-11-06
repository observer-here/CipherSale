import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

const key = process.env.PRIVATE_KEY ?? "";
const accounts = key === "" ? [] : [key.startsWith("0x") ? key : `0x${key}`];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    bnbTestnet: {
      url: process.env.BNB_TESTNET_RPC ?? "https://bsc-testnet-rpc.publicnode.com",
      chainId: 97,
      accounts,
    },
  },
};

export default config;
