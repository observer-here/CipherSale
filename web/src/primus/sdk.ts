// FHETransform browser client.
// https://fhetransform.primuslabs.xyz/ — encrypt locally, Jazz returns the handle, userDecrypt reads an ACL-allowed handle.
import { FheTransformSDK } from "@primuslabs/fhetransform-sdk";
import type { BrowserProvider } from "ethers";

export async function openFhe(provider: BrowserProvider) {
  const signer = await provider.getSigner();
  const sdk = new FheTransformSDK({ provider, signer });
  await sdk.init();
  return sdk;
}
