// zkTLS SDK expects ethers v5 utils. next.config points that package's ethers import here.
import { Wallet, isAddress, keccak256, recoverAddress, solidityPacked } from "ethers";

export const ethers = {
  Wallet,
  utils: {
    keccak256,
    isAddress,
    recoverAddress,
    solidityPack: solidityPacked,
  },
};
