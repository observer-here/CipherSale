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

// One proof covers every handle. The contract checks it against abi.encode of the values in the same order.
export async function publicDecryptHandles(sdk: FheTransformSDK, handles: string[]) {
  const result = await sdk.publicDecrypt({ payloads: handles } as Parameters<FheTransformSDK["publicDecrypt"]>[0]);
  const plains = Array.isArray(result.plaintexts) ? result.plaintexts : [result.plaintexts];
  const values = plains.map((plain) => plain?.value);
  if (!values.every((value) => typeof value === "bigint") || !result.decryptionProof) throw new Error("Decryption returned no proof");
  return { values: values as bigint[], proof: result.decryptionProof as string };
}
