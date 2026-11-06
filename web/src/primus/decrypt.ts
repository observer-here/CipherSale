// User decrypt. Jazz re-encrypts KMS shares to this wallet. The contract ACL must allow the caller.
// SDK: FheTransformSDK.userDecrypt.
// Public decrypt. For a handle the contract marked decryptable, Jazz returns the cleartext and a KMS proof
// that the contract checks on chain. SDK: FheTransformSDK.publicDecrypt.
import { getAddress } from "ethers";
import type { FheTransformSDK } from "@primuslabs/fhetransform-sdk";

export async function decryptHandle(sdk: FheTransformSDK, handle: string, contract: string) {
  if (!handle || BigInt(handle) === 0n) return 0n;
  const result = await sdk.userDecrypt({
    payloads: { handle, contractAddress: getAddress(contract) },
  } as Parameters<FheTransformSDK["userDecrypt"]>[0]);
  const plain = Array.isArray(result.plaintexts) ? result.plaintexts[0] : result.plaintexts;
  return typeof plain?.value === "bigint" ? plain.value : 0n;
}

export async function publicDecryptHandle(sdk: FheTransformSDK, handle: string) {
  const result = await sdk.publicDecrypt({ payloads: [handle] } as Parameters<FheTransformSDK["publicDecrypt"]>[0]);
  const plain = Array.isArray(result.plaintexts) ? result.plaintexts[0] : result.plaintexts;
  if (typeof plain?.value !== "bigint" || !result.decryptionProof) throw new Error("Decryption returned no proof");
  return { amount: plain.value, proof: result.decryptionProof as string };
}
