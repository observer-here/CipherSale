export const cipherTokenAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function underlying() view returns (address)",
  "function balanceOf(address) view returns (bytes32)",
  "function operators(address,address) view returns (bool)",
  "function setOperator(address,bool)",
  "function deposit(uint256) payable",
  "function unwrap(uint256,address) payable returns (bytes32)",
  "function finalizeUnwrap(bytes32,uint256,bytes)",
  "function unwrapTo(bytes32) view returns (address)",
  "event UnwrapRequested(address indexed from, address indexed to, bytes32 indexed id, uint256 amount)",
] as const;
