export const cipherTokenAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function underlying() view returns (address)",
  "function balanceOf(address) view returns (bytes32)",
  "function operators(address,address) view returns (bool)",
  "function setOperator(address,bool)",
  "function deposit(uint256) payable",
] as const;
