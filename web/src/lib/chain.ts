import { JsonRpcProvider, type BrowserProvider } from "ethers";

export const CHAIN_ID = 97;
const RPC = "https://bsc-testnet-rpc.publicnode.com";

// Every read goes through this public node, so pages load without a wallet or on the wrong network.
export const reader = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });

// The wallet provider is pinned to chain 97 for reads. A transaction still follows the wallet,
// and the Cipher contracts revert on any other chain.
export async function requireChain(provider: BrowserProvider) {
  const hex = await provider.send("eth_chainId", []);
  if (BigInt(hex) !== BigInt(CHAIN_ID)) throw new Error("Switch the wallet to BNB testnet");
}

export const ADDR = {
  cht: process.env.NEXT_PUBLIC_CHT ?? "",
  ccht: process.env.NEXT_PUBLIC_CCHT ?? "",
  tokenFactory: process.env.NEXT_PUBLIC_TOKEN_FACTORY ?? "",
  saleFactory: process.env.NEXT_PUBLIC_SALE_FACTORY ?? "",
} as const;
