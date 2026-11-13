// userDecrypt reads a handle this wallet can access. publicDecrypt returns the KMS proof the contract checks.
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

export async function publicDecryptHandles(sdk: FheTransformSDK, handles: string[]) {
  const result = await sdk.publicDecrypt({ payloads: handles } as Parameters<FheTransformSDK["publicDecrypt"]>[0]);
  const plains = Array.isArray(result.plaintexts) ? result.plaintexts : [result.plaintexts];
  const values = plains.map((plain) => plain?.value);
  if (!values.every((value) => typeof value === "bigint") || !result.decryptionProof) throw new Error("Decryption returned no proof");
  return { values: values as bigint[], proof: result.decryptionProof as string };
}
