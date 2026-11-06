// Every FHE call must send the executor fee as msg.value.
// SDK: estimateFheFee(contract, function, chainId).
import type { FheTransformSDK } from "@primuslabs/fhetransform-sdk";
import { CHAIN_ID } from "@/lib/chain";

const FALLBACK = 2_000_000n * 1_000_000_000n;

export async function fheFee(sdk: FheTransformSDK, contract: string, fn: string) {
  try {
    const quote = await sdk.estimateFheFee(contract, fn, BigInt(CHAIN_ID));
    if (quote.totalFee > 0n) return quote.totalFee;
  } catch {
    /* fee table may not know this function name */
  }
  return FALLBACK;
}
