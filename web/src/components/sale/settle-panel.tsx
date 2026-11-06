"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet";
import { cipher, eth, txError } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import { decryptHandle } from "@/primus/decrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";
import type { SaleView } from "@/types/sale";

export function SettlePanel({ sale }: { sale: SaleView }) {
  const { account, provider } = useWallet();
  const [mine, setMine] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const owner = account && account.toLowerCase() === sale.owner.toLowerCase();

  async function run(fn: "settle" | "collect" | "cancel") {
    if (!provider) return;
    setBusy(true);
    setNote("");
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(sale.address, cipherSaleAbi, signer);
      const tx = fn === "cancel"
        ? await contract.cancel()
        : await contract[fn]({ value: await fheFee(await openFhe(provider), sale.address, fn) });
      await tx.wait();
      setNote(fn);
    } catch (err) {
      setNote(txError(err, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    if (!provider || !account) return;
    setBusy(true);
    try {
      const saleContract = new Contract(sale.address, cipherSaleAbi, provider);
      const handle = await saleContract.claimable(account);
      const sdk = await openFhe(provider);
      const tokens = await decryptHandle(sdk, handle, sale.address);
      setMine(`${eth(tokens)} ${sale.symbol}`);
    } catch (err) {
      setMine(txError(err, "Cannot decrypt"));
    } finally {
      setBusy(false);
    }
  }

  const closed = sale.canceled || saleStatus(sale) === "ended";

  return (
    <div className="stack">
      <h2 style={{ margin: 0 }}>After the window</h2>
      <p className="hint">Raised <span className="mono">{cipher(sale.raised)}</span>. Settle pays tokens if the hidden total cleared the soft cap. Otherwise it returns cCHT.</p>
      <div className="row">
        <Button variant="ghost" disabled={busy || !account} onClick={reveal}>Decrypt mine</Button>
        <Button disabled={busy || !account || !closed} onClick={() => run("settle")}>Settle</Button>
        {owner ? <Button variant="ghost" disabled={busy || !closed} onClick={() => run("collect")}>Collect</Button> : null}
        {owner ? <Button variant="ghost" disabled={busy || closed} onClick={() => run("cancel")}>Cancel</Button> : null}
      </div>
      {mine ? <p className="note mono">{mine}</p> : null}
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}
