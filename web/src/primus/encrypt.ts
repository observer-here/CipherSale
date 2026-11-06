// Encrypts a uint256 for the contract that will call verifyAttestation.
// SDK: FheTransformSDK.encrypt → { handle, data }. That pair is uve_uint256 on chain.
// https://www.npmjs.com/package/@primuslabs/fhetransform-sdk
import { getAddress } from "ethers";
import { FheType, type FheTransformSDK } from "@primuslabs/fhetransform-sdk";

export async function encryptUint256(sdk: FheTransformSDK, contract: string, user: string, value: bigint) {
  const { encryptedValues } = await sdk.encrypt({
    payloads: [{ value, fheType: FheType.ve_uint256 }],
    contractAddress: getAddress(contract),
    userAddress: getAddress(user),
  } as Parameters<FheTransformSDK["encrypt"]>[0]);
  const encrypted = Array.isArray(encryptedValues) ? encryptedValues[0] : encryptedValues;
  if (!encrypted?.handle || !encrypted.data) throw new Error("Encryption returned no ciphertext");
  return { handle: encrypted.handle, data: encrypted.data };
}
