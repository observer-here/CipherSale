"use client";

// Unwrap burns cCHT, then finalizeUnwrap releases CHT with the KMS proof. If step two fails, the request id
// is kept in localStorage so it can be finished later. Public RPCs reject log scans from block 0.
import { Contract } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useWallet } from "@/hooks/wallet";
import { ADDR, reader } from "@/lib/chain";
import { parseEth, txError } from "@/lib/format";
import { publicDecryptHandles } from "@/primus/decrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";

const ZERO = "0x0000000000000000000000000000000000000000";
const key = (account: string) => `unwraps:${ADDR.ccht}:${account.toLowerCase()}`;
const saved = (account: string): string[] => JSON.parse(localStorage.getItem(key(account)) ?? "[]");

export function UnwrapDialog({ onDone }: { onDone: () => void }) {
  const { account, provider } = useWallet();
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string[]>([]);

  const loadPending = useCallback(async () => {
    if (!account) return;
    const ccht = new Contract(ADDR.ccht, cipherTokenAbi, reader);
    const open = (await Promise.all(saved(account).map(async (id) => ((await ccht.unwrapTo(id)) === ZERO ? null : id))))
      .filter((id): id is string => id !== null);
    localStorage.setItem(key(account), JSON.stringify(open));
    setPending(open);
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
    if (!provider || !account) return;
    const value = parseEth(amount);
    if (value <= 0n) return setNote("Enter an amount");
    await run(async () => {
      const signer = await provider.getSigner();
      const ccht = new Contract(ADDR.ccht, cipherTokenAbi, signer);
      const sdk = await openFhe(provider);
      setNote("Burning cCHT");
      const receipt = await (await ccht.unwrap(value, account, { value: await fheFee(sdk, ADDR.ccht, "unwrap") })).wait();
      const event = receipt.logs.flatMap((log: { topics: string[]; data: string }) => ccht.interface.parseLog(log) ?? []).find((parsed: { name: string }) => parsed.name === "UnwrapRequested");
      if (!event) throw new Error("Unwrap request not found");
      localStorage.setItem(key(account), JSON.stringify([...saved(account), event.args.id]));
      await finalize(event.args.id);
    }, "Unwrapped");
  }

  return (
    <div className="stack">
      <p className="hint">Unwrap cCHT back into CHT. The burned amount is decrypted, then released on chain with a proof. You can only unwrap what you hold.</p>
      <Field label="cCHT amount" value={amount} onChange={setAmount} />
      <Button disabled={busy} onClick={unwrap}>{busy ? "Working" : "Unwrap"}</Button>
      {pending.map((id) => (
        <Button key={id} variant="ghost" disabled={busy} onClick={() => run(() => finalize(id), "Unwrapped")}>
          Finish pending unwrap
        </Button>
      ))}
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}
