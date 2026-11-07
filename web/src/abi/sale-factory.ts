export const saleFactoryAbi = [
  "function createSale(address,string,(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint64,uint64)) returns (address)",
  "function allSales(uint256) view returns (address)",
  "event SaleCreated(address indexed creator, address sale, address token, address ctoken)",
] as const;
