// The SDK encrypt worker chunk crashes in the production build. Encrypt on the page instead.
import { FheWasmClientDirect } from "../../node_modules/@primuslabs/fhetransform-sdk/dist/wasm/fhe-wasm-client.js";

export function createFheWasmClient() {
  return new FheWasmClientDirect();
}
