// zkTLS in the browser. Docs: https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/zktls-js-sdk-api
// init(appId) talks to the Primus extension. sign() stays on the server because it needs appSecret.
// startAttestation returns the Attestation struct CipherSale.buy verifies on chain.
import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";

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
  if (!client) client = new PrimusZKTLS();
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

export function toSaleAttestation(att: Proof) {
  const stamp = Number(att.timestamp);
  return {
    recipient: att.recipient,
    request: att.request,
    reponseResolve: att.reponseResolve ?? [],
    data: att.data ?? "",
    attConditions: att.attConditions ?? "",
    timestamp: stamp > 1_000_000_000_000 ? Math.floor(stamp / 1000) : stamp,
    additionParams: att.additionParams ?? "",
    attestors: att.attestors ?? [],
    signatures: att.signatures ?? [],
  };
}
