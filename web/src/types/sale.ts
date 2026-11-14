import type { SaleMeta } from "@/lib/meta";

export type SaleTerms = {
  tokenPresale: bigint;
  softCap: bigint;
  hardCap: bigint;
  minContribution: bigint;
  maxContribution: bigint;
  presaleRate: bigint;
  start: number;
  end: number;
};

export type SaleView = SaleTerms & {
  address: string;
  owner: string;
  token: string;
  saleToken: string;
  state: number;
  totalRaised: bigint;
  totalSold: bigint;
  buyers: number;
  raised: string;
  tokensSold: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  meta: SaleMeta;
};
