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
  state: number;
  totalRaised: bigint;
  totalSold: bigint;
  listingId: string;
  listed: boolean;
  buyers: number;
  raised: string;
  tokensSold: string;
  name: string;
  symbol: string;
};
