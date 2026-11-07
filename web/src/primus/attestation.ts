// zkTLS in the browser. Docs: https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/zktls-js-sdk-api
// init(appId) talks to the Primus extension. sign() stays on the server because it needs appSecret.
// startAttestation returns the Attestation struct CipherSale.buy verifies on chain.
// The SDK is imported on first use so the sale page does not download it until a buyer joins.
import type { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";

type Proof = {
  recipient: string;
  request: { url: string; header: string; method: string; body: string };
  reponseResolve: { keyName: string; parseType: string; parsePath: string }[];
  data: string;
  attConditions: string;
  timestamp: number;
  additionParams: string;
  attestors: { attestorAddr: string; url: string }[];
  signatures: string[];
};

let client: PrimusZKTLS | null = null;

export async function prove(user: string): Promise<Proof> {
  const appId = process.env.NEXT_PUBLIC_PRIMUS_APP_ID;
  const template = process.env.NEXT_PUBLIC_PRIMUS_TEMPLATE_ID;
  if (!appId || !template) {
    throw new Error("Set NEXT_PUBLIC_PRIMUS_APP_ID and NEXT_PUBLIC_PRIMUS_TEMPLATE_ID");
  }
  if (!client) client = new (await import("@primuslabs/zktls-js-sdk")).PrimusZKTLS();
  await client.init(appId);
  const request = client.generateRequestParams(template, user);
  const res = await fetch("/api/primus/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request: request.toJsonString() }),
  });
  const body = (await res.json()) as { signed?: string; error?: string };
  if (!res.ok || !body.signed) throw new Error(body.error || "Could not sign the zkTLS request");
  const attestation = (await client.startAttestation(body.signed)) as Proof;
  if (!client.verifyAttestation(attestation)) throw new Error("Attestor signature did not match");
  return attestation;
}

// The attestor signs every field as emitted, so nothing here may be rewritten. The contract reads the timestamp in ms.
export function toSaleAttestation(att: Proof) {
  return {
    recipient: att.recipient,
    request: att.request,
    reponseResolve: att.reponseResolve ?? [],
    data: att.data ?? "",
    attConditions: att.attConditions ?? "",
    timestamp: att.timestamp,
    additionParams: att.additionParams ?? "",
    attestors: att.attestors ?? [],
    signatures: att.signatures ?? [],
  };
}
