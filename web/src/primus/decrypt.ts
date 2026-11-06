// User decrypt. Jazz re-encrypts KMS shares to this wallet. The contract ACL must allow the caller.
// SDK: FheTransformSDK.userDecrypt.
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
