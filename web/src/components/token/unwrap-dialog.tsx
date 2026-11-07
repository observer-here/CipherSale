"use client";

import { Contract, JsonRpcProvider } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useWallet } from "@/hooks/wallet";
import { ADDR, RPC } from "@/lib/chain";
import { eth, parseEth, txError } from "@/lib/format";
import { publicDecryptHandles } from "@/primus/decrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";

type Pending = { id: string; amount: bigint };

export function UnwrapDialog({ onDone }: { onDone: () => void }) {
  const { account, provider } = useWallet();
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);

  const loadPending = useCallback(async () => {
    if (!account) return;
    const ccht = new Contract(ADDR.ccht, cipherTokenAbi, new JsonRpcProvider(RPC));
    const logs = await ccht.queryFilter(ccht.filters.UnwrapRequested(account), 0, "latest");
    const rows = await Promise.all(logs.map(async (log) => {
      const { id, amount: value } = (log as unknown as { args: { id: string; amount: bigint } }).args;
      return (await ccht.unwrapTo(id)) === "0x0000000000000000000000000000000000000000" ? null : { id, amount: value };
    }));
    setPending(rows.filter((row): row is Pending => row !== null));
  }, [account]);

  useEffect(() => {
    loadPending().catch(() => undefined);
  }, [loadPending]);

  async function finalize(id: string) {
    if (!provider) return;
    const signer = await provider.getSigner();
    const sdk = await openFhe(provider);
    setNote("Decrypting the burned amount");
    const { values: [cleartext], proof } = await publicDecryptHandles(sdk, [id]);
    setNote("Releasing CHT");
    await (await new Contract(ADDR.ccht, cipherTokenAbi, signer).finalizeUnwrap(id, cleartext, proof)).wait();
  }

  async function run(work: () => Promise<void>, done: string) {
    setBusy(true);
    setNote("");
    try {
      await work();
      setNote(done);
      onDone();
    } catch (err) {
      setNote(txError(err, "Unwrap failed"));
    } finally {
      setBusy(false);
      loadPending().catch(() => undefined);
    }
  }

  async function unwrap() {
    if (!provider) return;
    const value = parseEth(amount);
    if (value <= 0n) return setNote("Enter an amount");
    await run(async () => {
      const signer = await provider.getSigner();
      const ccht = new Contract(ADDR.ccht, cipherTokenAbi, signer);
      const sdk = await openFhe(provider);
      setNote("Burning cCHT");
      const receipt = await (await ccht.unwrap(value, await signer.getAddress(), { value: await fheFee(sdk, ADDR.ccht, "unwrap") })).wait();
      const event = receipt.logs.flatMap((log: { topics: string[]; data: string }) => ccht.interface.parseLog(log) ?? []).find((parsed: { name: string }) => parsed.name === "UnwrapRequested");
      if (!event) throw new Error("Unwrap request not found");
      await finalize(event.args.id);
    }, "Unwrapped");
  }

  return (
    <div className="stack">
      <p className="hint">Unwrap cCHT back into CHT. The burned amount is decrypted, then released on chain with a proof. You can only unwrap what you hold.</p>
      <Field label="cCHT amount" value={amount} onChange={setAmount} />
      <Button disabled={busy} onClick={unwrap}>{busy ? "Working" : "Unwrap"}</Button>
      {pending.map((row) => (
        <Button key={row.id} variant="ghost" disabled={busy} onClick={() => run(() => finalize(row.id), "Unwrapped")}>
          Finish pending unwrap of {eth(row.amount)}
        </Button>
      ))}
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}
