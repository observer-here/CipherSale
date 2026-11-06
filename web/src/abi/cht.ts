export const chtAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function faucet()",
  "function approve(address,uint256) returns (bool)",
] as const;
