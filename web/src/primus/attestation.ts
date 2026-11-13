// zkTLS in the browser. Docs: https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/zktls-js-sdk-api
// init(appId) talks to the Primus extension. sign() stays on the server because it needs appSecret.
// startAttestation returns the Attestation struct CipherSale.buy verifies on chain.
// The SDK is imported on first use so the sale page does not download it until a buyer joins.
import { keccak256, toUtf8Bytes } from "ethers";

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

export async function prove(user: string): Promise<Proof> {
  const appId = process.env.NEXT_PUBLIC_PRIMUS_APP_ID;
  const template = process.env.NEXT_PUBLIC_PRIMUS_TEMPLATE_ID;
  if (!appId || !template) {
    throw new Error("Set NEXT_PUBLIC_PRIMUS_APP_ID and NEXT_PUBLIC_PRIMUS_TEMPLATE_ID");
  }
  const { PrimusZKTLS } = await import("@primuslabs/zktls-js-sdk");
  const sdk = new PrimusZKTLS();
  await sdk.init(appId);
  const request = sdk.generateRequestParams(template, user);
  const res = await fetch("/api/primus/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request: request.toJsonString() }),
  });
  const body = (await res.json()) as { signed?: string; error?: string };
  if (!res.ok || !body.signed) throw new Error(body.error || "Could not sign the zkTLS request");
  return (await sdk.startAttestation(body.signed)) as Proof;
}

// CipherSale stores keccak256(attConditions). The sale contract checks the attestor signature.
export function assertSaleProof(conditionHash: string, att: ReturnType<typeof toSaleAttestation>) {
  if (keccak256(toUtf8Bytes(att.attConditions)).toLowerCase() !== conditionHash.toLowerCase()) {
    throw new Error("This sale locked a different check. Create a new sale, then join that one.");
  }
}

// The attestor signs every field as emitted, so nothing here may be rewritten. The contract reads the timestamp in ms.
// A signature without 0x is still the same 65 bytes. The Solidity verifier rejects it unless it is hex.
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
    signatures: (att.signatures ?? []).map((sig) => (sig.startsWith("0x") ? sig : `0x${sig}`)),
  };
}
