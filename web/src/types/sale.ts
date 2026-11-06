export type SaleTerms = {
  tokenPresale: bigint;
  tokenLiquidity: bigint;
  liquidityBps: bigint;
  softCap: bigint;
  hardCap: bigint;
  minContribution: bigint;
  maxContribution: bigint;
  presaleRate: bigint;
  listingRate: bigint;
  start: number;
  end: number;
};

export type SaleView = SaleTerms & {
  address: string;
  owner: string;
  token: string;
  saleToken: string;
  funded: boolean;
  canceled: boolean;
  raised: string;
  name: string;
  symbol: string;
};
