// @primuslabs/zktls-js-sdk calls ethers v5 `ethers.utils`. This app uses ethers v6.
// next.config redirects only that package's `ethers` import to this file.
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
