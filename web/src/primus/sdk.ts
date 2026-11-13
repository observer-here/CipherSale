// FHE client. Jazz is called through /jazz because the gateway only allows localhost.
import type { BrowserProvider } from "ethers";

export async function openFhe(provider: BrowserProvider) {
  const { FheTransformSDK } = await import("@primuslabs/fhetransform-sdk");
  const signer = await provider.getSigner();
  const sdk = new FheTransformSDK({ provider, signer, jazzUrl: `${location.origin}/jazz` });
  await sdk.init();
  return sdk;
}
