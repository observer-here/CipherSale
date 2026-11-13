// encrypt() returns { handle, data }, the uve_uint256 the sale buy call expects.
import { getAddress } from "ethers";
import type { FheTransformSDK } from "@primuslabs/fhetransform-sdk";

export async function encryptUint256(sdk: FheTransformSDK, contract: string, user: string, value: bigint) {
  const { FheType } = await import("@primuslabs/fhetransform-sdk");
  const { encryptedValues } = await sdk.encrypt({
    payloads: [{ value, fheType: FheType.ve_uint256 }],
    contractAddress: getAddress(contract),
    userAddress: getAddress(user),
  } as Parameters<FheTransformSDK["encrypt"]>[0]);
  const encrypted = Array.isArray(encryptedValues) ? encryptedValues[0] : encryptedValues;
  if (!encrypted?.handle || !encrypted.data) throw new Error("Encryption returned no ciphertext");
  return { handle: encrypted.handle, data: encrypted.data };
}
