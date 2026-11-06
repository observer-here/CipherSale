export const cipherSaleAbi = [
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "function saleToken() view returns (address)",
  "function payment() view returns (address)",
  "function funded() view returns (bool)",
  "function canceled() view returns (bool)",
  "function raised() view returns (bytes32)",
  "function contributions(address) view returns (bytes32)",
  "function claimable(address) view returns (bytes32)",
  "function eligible(address) view returns (bool)",
  "function options() view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint64,uint64)",
  "function buy((address,(string,string,string,string),(string,string,string)[],string,string,uint64,string,(address,string)[],bytes[]),(bytes32,bytes)) payable",
  "function settle() payable",
  "function collect() payable",
  "function cancel()",
] as const;

export const erc20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
] as const;
