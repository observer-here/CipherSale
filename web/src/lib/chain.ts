export const CHAIN_ID = 97;
export const RPC = "https://bsc-testnet-rpc.publicnode.com";

export const ADDR = {
  cht: process.env.NEXT_PUBLIC_CHT ?? "",
  ccht: process.env.NEXT_PUBLIC_CCHT ?? "",
  tokenFactory: process.env.NEXT_PUBLIC_TOKEN_FACTORY ?? "",
  saleFactory: process.env.NEXT_PUBLIC_SALE_FACTORY ?? "",
} as const;
