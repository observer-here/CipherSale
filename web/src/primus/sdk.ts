// FHETransform browser client.
// https://fhetransform.primuslabs.xyz/ — encrypt locally, Jazz returns the handle, userDecrypt reads an ACL-allowed handle.
// The SDK is imported on first use so pages that never touch FHE do not download it.
import type { BrowserProvider } from "ethers";

export async function openFhe(provider: BrowserProvider) {
  const { FheTransformSDK } = await import("@primuslabs/fhetransform-sdk");
  const signer = await provider.getSigner();
  const sdk = new FheTransformSDK({ provider, signer });
  await sdk.init();
  return sdk;
}
