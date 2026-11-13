// FHE client. Loaded on first encrypt or decrypt.
import type { BrowserProvider } from "ethers";

export async function openFhe(provider: BrowserProvider) {
  const { FheTransformSDK } = await import("@primuslabs/fhetransform-sdk");
  const signer = await provider.getSigner();
  const sdk = new FheTransformSDK({ provider, signer });
  await sdk.init();
  return sdk;
}
