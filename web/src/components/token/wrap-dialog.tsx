"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { usdtAbi } from "@/abi/usdt";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet";
import { ADDR, requireChain } from "@/lib/chain";
import { eth, parseEth, txError } from "@/lib/format";
import { fheFee } from "@/primus/fee";
function preview(value: string) {
  try { return eth(parseEth(value)); } catch { return "0"; }
}

export function WrapDialog({ balance, onDone }: { balance: bigint; onDone: () => void }) {
  const { provider } = useWallet();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const value = preview(amount);

  async function wrap() {
    if (!provider) return;
    let wei: bigint;
    try { wei = parseEth(amount); } catch { return setNote("Enter an amount"); }
    if (wei <= 0n) return setNote("Enter an amount");
    setBusy(true);
    setNote("");
    setBad(false);
    try {
      await requireChain(provider);
      const signer = await provider.getSigner();
      const me = await signer.getAddress();
      const usdt = new Contract(ADDR.cht, usdtAbi, signer);
      const cusdt = new Contract(ADDR.ccht, cipherTokenAbi, signer);
      if (await usdt.allowance(me, ADDR.ccht) < wei) {
        setNote("Approving USDT");
        await (await usdt.approve(ADDR.ccht, wei)).wait();
      }
      await (await cusdt.deposit(wei, { value: fheFee("deposit") })).wait();
      setAmount("");
      setNote("Wrapped");
      onDone();
    } catch (err) {
      setBad(true);
      setNote(txError(err, "Wrap failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="swap-top">
        <span className="hint">Amount to wrap</span>
        <button type="button" onClick={() => setAmount(eth(balance))}>Max</button>
      </div>
      <label className="amount">
        <input placeholder="0.0" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <b>USDT</b>
      </label>
      <p className="hint">You receive <b className="mono">{value} cUSDT</b>. 1 USDT = 1 cUSDT.</p>
      <p className="hint">cUSDT is the confidential wrapper. The balance decrypts only for this wallet.</p>
      <Button disabled={busy || value === "0"} onClick={wrap}>{busy ? "Wrapping" : "Wrap USDT to cUSDT"}</Button>
      {note ? <p className={bad ? "note bad" : "note"}>{note}</p> : null}
    </div>
  );
}
