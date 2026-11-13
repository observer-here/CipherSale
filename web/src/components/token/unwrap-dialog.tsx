"use client";

// Unwrap burns cCHT, then finalizeUnwrap releases CHT with the KMS proof.
// A request that stops after the burn is kept in localStorage so it can be finished later.
import { Contract } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet";
import { ADDR, reader, requireChain } from "@/lib/chain";
import { eth, parseEth, short, txError } from "@/lib/format";
import { publicDecryptHandles } from "@/primus/decrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";

const ZERO = "0x0000000000000000000000000000000000000000";
const key = (account: string) => `unwraps:${ADDR.ccht}:${account.toLowerCase()}`;
const saved = (account: string): string[] => JSON.parse(localStorage.getItem(key(account)) ?? "[]");

function preview(value: string) {
  try { return eth(parseEth(value)); } catch { return "0"; }
}

export function UnwrapDialog({
  balance,
  onMax,
  onDone,
}: {
  balance: bigint;
  onMax: () => Promise<bigint>;
  onDone: () => void;
}) {
  const { account, provider } = useWallet();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const value = preview(amount);

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
    if (!provider) return;
    setBusy(true);
    setNote("");
    setBad(false);
    try {
      await requireChain(provider);
      await work();
      setNote(done);
      onDone();
    } catch (err) {
      setBad(true);
      setNote(txError(err, "Unwrap failed"));
    } finally {
      setBusy(false);
      loadPending().catch(() => undefined);
    }
  }

  async function unwrap() {
    if (!provider || !account) return;
    let wei: bigint;
    try { wei = parseEth(amount); } catch { return setNote("Enter an amount"); }
    if (wei <= 0n) return setNote("Enter an amount");
    await run(async () => {
      const signer = await provider.getSigner();
      const me = await signer.getAddress();
      const ccht = new Contract(ADDR.ccht, cipherTokenAbi, signer);
      setNote("Burning cCHT");
      const receipt = await (await ccht.unwrap(wei, me, { value: fheFee("unwrap") })).wait();
      const event = receipt.logs
        .map((log: { topics: string[]; data: string }) => { try { return ccht.interface.parseLog(log); } catch { return null; } })
        .find((parsed: { name: string } | null) => parsed?.name === "UnwrapRequested");
      if (!event) throw new Error("Unwrap request not found");
      localStorage.setItem(key(me), JSON.stringify([...saved(me), event.args.id]));
      await finalize(event.args.id);
      setAmount("");
    }, "Unwrapped");
  }

  return (
    <div className="stack">
      <div className="swap-top">
        <span className="hint">Amount to unwrap</span>
        <button type="button" onClick={async () => setAmount(eth(balance > 0n ? balance : await onMax()))}>Max</button>
      </div>
      <label className="amount">
        <input placeholder="0.0" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <b>cCHT</b>
      </label>
      <p className="hint">You receive <b className="mono">{value} CHT</b>. 1 cCHT = 1 CHT.</p>
      <p className="hint">Unwrap burns cCHT, then releases CHT after the decryption proof. Keep a little tBNB for the fee.</p>
      <Button disabled={busy || value === "0"} onClick={unwrap}>{busy ? "Unwrapping" : "Unwrap cCHT to CHT"}</Button>
      {pending.map((id) => (
        <Button key={id} variant="ghost" disabled={busy} onClick={() => run(() => finalize(id), "Unwrapped")}>
          Finish {short(id)}
        </Button>
      ))}
      {note ? <p className={bad ? "note bad" : "note"}>{note}</p> : null}
    </div>
  );
}
