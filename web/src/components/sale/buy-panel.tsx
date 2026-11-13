"use client";

import { Contract } from "ethers";
import { useEffect, useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spotify } from "@/components/ui/icon";
import { useWallet } from "@/hooks/wallet";
import { reader } from "@/lib/chain";
import { eth, parseEth, txError } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import { prove, toSaleAttestation } from "@/primus/attestation";
import { encryptUint256 } from "@/primus/encrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";
import type { SaleView } from "@/types/sale";

// The contract checks the attestation only on a wallet's first buy, so later buys send an empty one.
const NO_PROOF = ["0x0000000000000000000000000000000000000000", ["", "", "", ""], [], "", "", 0, "", [], []];
const STEPS = [
  ["Spotify", "Opens in the Primus extension"],
  ["Approve", "Allow this sale to pull cCHT"],
  ["Pay", "The amount stays encrypted"],
] as const;

export function BuyPanel({ sale, onDone }: { sale: SaleView; onDone: () => void }) {
  const { account, provider } = useWallet();
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [proved, setProved] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!account) return;
    const saleRead = new Contract(sale.address, cipherSaleAbi, reader);
    let live = true;
    (async () => {
      try {
        const isIn = await saleRead.eligible(account);
        const payment = new Contract(await saleRead.payment(), cipherTokenAbi, reader);
        const ok = await payment.operators(account, sale.address);
        if (!live) return;
        setProved(Boolean(isIn));
        setAllowed(Boolean(ok));
      } catch { /* wallet not ready */ }
    })();
    return () => { live = false; };
  }, [account, sale.address]);

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
    setBad(false);
    setNote("");
    try {
      const signer = await provider.getSigner();
      const saleRead = new Contract(sale.address, cipherSaleAbi, reader);
      let proof: unknown[] = NO_PROOF;
      if (!(await saleRead.eligible(account))) {
        setStep(1);
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
        setProved(true);
      }
      const payment = new Contract(await saleRead.payment(), cipherTokenAbi, signer);
      if (!(await payment.operators(account, sale.address))) {
        setStep(2);
        await (await payment.setOperator(sale.address, true)).wait();
        setAllowed(true);
      }
      setStep(3);
      const sdk = await openFhe(provider);
      const hidden = await encryptUint256(sdk, sale.address, account, value);
      const saleContract = new Contract(sale.address, cipherSaleAbi, signer);
      await (await saleContract.buy(proof, [hidden.handle, hidden.data], { value: fheFee("buy") })).wait();
      setStep(4);
      setNote("Joined. The amount is a ciphertext.");
      onDone();
    } catch (err) {
      setBad(true);
      setNote(txError(err, "Buy failed"));
    } finally {
      setBusy(false);
    }
  }

  const closed = saleStatus(sale) !== "live";
  const mark = (n: number) => {
    if (step >= 4 || n < step) return "done";
    if (n === step) return bad ? "bad" : "on";
    if (step === 0 && ((n === 1 && proved) || (n === 2 && allowed))) return "done";
    return "";
  };

  return (
    <div className="stack">
      <h2>Join</h2>
      <ol className="steps">
        {STEPS.map(([title, detail], index) => {
          const n = index + 1;
          const state = mark(n);
          return (
            <li key={title} className={state}>
              <span>{n === 1 ? <Spotify /> : state === "done" ? "✓" : n}</span>
              <div>
                <b>{n === 1 ? (sale.meta.gate || title) : title}</b>
                <small>{detail}</small>
              </div>
            </li>
          );
        })}
      </ol>
      <Field label={`cCHT amount, ${eth(sale.minContribution)} to ${eth(sale.maxContribution)}`} value={amount} onChange={setAmount} />
      <Button disabled={busy || closed} onClick={buy}>{busy ? "Working" : closed ? "Sale closed" : "Contribute"}</Button>
      {note ? <p className={bad ? "note bad" : "note"}>{note}</p> : null}
    </div>
  );
}
