"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useWallet } from "@/hooks/wallet";
import { parseEth, txError } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import { prove, toSaleAttestation } from "@/primus/attestation";
import { encryptUint256 } from "@/primus/encrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";
import type { SaleView } from "@/types/sale";

export function BuyPanel({ sale }: { sale: SaleView }) {
  const { account, provider } = useWallet();
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function buy() {
    if (!provider || !account) return setNote("Connect a wallet");
    let value: bigint;
    try {
      value = parseEth(amount);
    } catch {
      return setNote("Enter an amount");
    }
    if (value <= 0n) return setNote("Enter an amount");
    setBusy(true);
    setNote("Requesting zkTLS proof");
    try {
      const signer = await provider.getSigner();
      const attestation = toSaleAttestation(await prove(account));
      const saleRead = new Contract(sale.address, cipherSaleAbi, provider);
      const payment = new Contract(await saleRead.payment(), cipherTokenAbi, signer);
      const allowed = await payment.operators(account, sale.address);
      if (!allowed) {
        setNote("Approving cCHT");
        const tx = await payment.setOperator(sale.address, true);
        await tx.wait();
      }
      setNote("Encrypting amount");
      const sdk = await openFhe(provider);
      const hidden = await encryptUint256(sdk, sale.address, account, value);
      const fee = await fheFee(sdk, sale.address, "buy");
      const proof = [
        attestation.recipient,
        [attestation.request.url, attestation.request.header, attestation.request.method, attestation.request.body],
        attestation.reponseResolve.map((row: { keyName: string; parseType: string; parsePath: string }) => [row.keyName, row.parseType, row.parsePath]),
        attestation.data,
        attestation.attConditions,
        attestation.timestamp,
        attestation.additionParams,
        attestation.attestors.map((row: { attestorAddr: string; url: string }) => [row.attestorAddr, row.url]),
        attestation.signatures,
      ];
      const saleContract = new Contract(sale.address, cipherSaleAbi, signer);
      const tx = await saleContract.buy(proof, [hidden.handle, hidden.data], { value: fee });
      await tx.wait();
      setNote("Joined. The amount is a ciphertext.");
    } catch (err) {
      setNote(txError(err, "Buy failed"));
    } finally {
      setBusy(false);
    }
  }

  const closed = saleStatus(sale) !== "live" || !sale.funded;
  return (
    <div className="stack">
      <h2 style={{ margin: 0 }}>Join</h2>
      <ol className="hint">
        <li>Primus extension proves the sale condition.</li>
        <li>This wallet approves cCHT for the sale.</li>
        <li>The amount is encrypted, then the sale takes it.</li>
      </ol>
      <Field label="cCHT amount" value={amount} onChange={setAmount} />
      <Button disabled={busy || closed} onClick={buy}>{busy ? "Working" : closed ? "Sale closed" : "Contribute"}</Button>
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}
