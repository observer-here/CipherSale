"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { chtAbi } from "@/abi/cht";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ADDR } from "@/lib/chain";
import { parseEth } from "@/lib/format";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";
import { useWallet } from "@/hooks/wallet";

export function WrapDialog({ onDone }: { onDone: () => void }) {
  const { provider } = useWallet();
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function wrap() {
    if (!provider) return;
    setBusy(true);
    setNote("");
    try {
      const signer = await provider.getSigner();
      const me = await signer.getAddress();
      const value = parseEth(amount);
      const cht = new Contract(ADDR.cht, chtAbi, signer);
      const ccht = new Contract(ADDR.ccht, cipherTokenAbi, signer);
      const allowance = await cht.allowance(me, ADDR.ccht);
      if (allowance < value) {
        const approved = await cht.approve(ADDR.ccht, value);
        await approved.wait();
      }
      const sdk = await openFhe(provider);
      const fee = await fheFee(sdk, ADDR.ccht, "deposit");
      const tx = await ccht.deposit(value, { value: fee });
      await tx.wait();
      setNote("Wrapped");
      onDone();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Wrap failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid max-w-md gap-4">
      <p className="text-sm text-white/70">Wrap CHT into cCHT. The confidential balance decrypts only for this wallet.</p>
      <Field label="CHT amount" value={amount} onChange={setAmount} />
      <Button disabled={busy} onClick={wrap}>{busy ? "Wrapping" : "Wrap"}</Button>
      {note ? <p className="text-sm">{note}</p> : null}
    </div>
  );
}
