"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useWallet } from "@/hooks/wallet";
import { reader } from "@/lib/chain";
import { parseEth, txError } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import { prove, toSaleAttestation } from "@/primus/attestation";
import { encryptUint256 } from "@/primus/encrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";
import type { SaleView } from "@/types/sale";

// The contract checks the attestation only on a wallet's first buy, so later buys send an empty one.
const NO_PROOF = ["0x0000000000000000000000000000000000000000", ["", "", "", ""], [], "", "", 0, "", [], []];

export function BuyPanel({ sale, onDone }: { sale: SaleView; onDone: () => void }) {
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
    try {
      const signer = await provider.getSigner();
      const saleRead = new Contract(sale.address, cipherSaleAbi, reader);
      let proof: unknown[] = NO_PROOF;
      if (!(await saleRead.eligible(account))) {
        setNote("Requesting zkTLS proof");
        const att = toSaleAttestation(await prove(account));
        proof = [
          att.recipient,
          [att.request.url, att.request.header, att.request.method, att.request.body],
          att.reponseResolve.map((row) => [row.keyName, row.parseType, row.parsePath]),
          att.data,
          att.attConditions,
          att.timestamp,
          att.additionParams,
          att.attestors.map((row) => [row.attestorAddr, row.url]),
          att.signatures,
        ];
      }
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
      const saleContract = new Contract(sale.address, cipherSaleAbi, signer);
      const tx = await saleContract.buy(proof, [hidden.handle, hidden.data], { value: fee });
      await tx.wait();
      setNote("Joined. The amount is a ciphertext.");
      onDone();
    } catch (err) {
      setNote(txError(err, "Buy failed"));
    } finally {
      setBusy(false);
    }
  }

  const closed = saleStatus(sale) !== "live";
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
