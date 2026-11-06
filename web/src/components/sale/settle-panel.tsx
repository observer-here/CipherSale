"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet";
import { cipher, eth } from "@/lib/format";
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
      setNote(err instanceof Error ? err.message : "Failed");
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
      const tokens = await decryptHandle(sdk, handle, sale.saleToken);
      setMine(`${eth(tokens)} ${sale.symbol}`);
    } catch (err) {
      setMine(err instanceof Error ? err.message : "Cannot decrypt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid max-w-md gap-3 border-t border-white/15 pt-6 text-sm">
      <h2 className="text-lg">After the window</h2>
      <p>Raised <span className="mono text-[#9ff6ff]">{cipher(sale.raised)}</span></p>
      <p className="text-white/60">Settle pays tokens if the hidden total cleared the soft cap. Otherwise it returns cCHT.</p>
      <div className="flex flex-wrap gap-5">
        <Button disabled={busy || !account} onClick={reveal}>Decrypt mine</Button>
        <Button disabled={busy || !account} onClick={() => run("settle")}>Settle</Button>
        {owner ? <Button disabled={busy} onClick={() => run("collect")}>Collect</Button> : null}
        {owner ? <Button disabled={busy} onClick={() => run("cancel")}>Cancel</Button> : null}
      </div>
      {mine ? <p className="mono text-[#9ff6ff]">{mine}</p> : null}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
