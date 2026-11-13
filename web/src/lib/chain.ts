import { JsonRpcProvider } from "ethers";

export const CHAIN_ID = 97;
const RPC = "https://bsc-testnet-rpc.publicnode.com";

// Every read goes through this public node, so pages load without a wallet or on the wrong network.
export const reader = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });

export const ADDR = {
  cht: process.env.NEXT_PUBLIC_CHT ?? "",
  ccht: process.env.NEXT_PUBLIC_CCHT ?? "",
  tokenFactory: process.env.NEXT_PUBLIC_TOKEN_FACTORY ?? "",
  saleFactory: process.env.NEXT_PUBLIC_SALE_FACTORY ?? "",
} as const;
