// FHE client. Jazz is called through /jazz because the gateway only allows localhost.
// next.config loads this in place of the SDK worker. That chunk is absent on Vercel.
import type { BrowserProvider } from "ethers";
import { FheWasmClientDirect } from "../../node_modules/@primuslabs/fhetransform-sdk/dist/wasm/fhe-wasm-client.js";

export function createFheWasmClient() {
  return new FheWasmClientDirect();
}

export async function openFhe(provider: BrowserProvider) {
  const { FheTransformSDK } = await import("@primuslabs/fhetransform-sdk");
  const signer = await provider.getSigner();
  const sdk = new FheTransformSDK({ provider, signer, jazzUrl: `${location.origin}/jazz` });
  await sdk.init();
  return sdk;
}
