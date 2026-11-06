export const tokenFactoryAbi = [
  "function createToken(string,string,uint256) returns (address)",
  "function allTokens(uint256) view returns (address)",
  "event TokenCreated(address indexed creator, address token, string name, string symbol, uint256 supply)",
] as const;
