"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet";
import { requireChain } from "@/lib/chain";
import { txError } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import { publicDecryptHandles } from "@/primus/decrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";
import type { SaleView } from "@/types/sale";

const HINT = {
  upcoming: "The sale has not opened yet.",
  live: "Contributions are encrypted. Canceling the sale, or closing the window, reveals the raised total.",
  ended: "The window closed. Finalize reveals the raised total and tokens sold with a KMS proof.",
  finalizing: "The totals are decryptable. Finalize submits them with the proof.",
  refunding: "The soft cap was missed or the sale was canceled. Refund returns your cUSDT.",
  succeeded: "The soft cap was met. Claim sends the plain project tokens.",
};

export function Actions({ sale, onDone }: { sale: SaleView; onDone: () => void }) {
  const { account, provider } = useWallet();
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const status = saleStatus(sale);
  const owner = !!account && account.toLowerCase() === sale.owner.toLowerCase();

  async function run(label: string, work: (contract: Contract) => Promise<void>) {
    if (!provider) return setNote("Connect a wallet");
    setBusy(true);
    setBad(false);
    setNote(label);
    try {
      await requireChain(provider);
      await work(new Contract(sale.address, cipherSaleAbi, await provider.getSigner()));
      setNote("Done");
      onDone();
    } catch (err) {
      setBad(true);
      setNote(txError(err, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  const finalize = () => run("Revealing the totals", async (contract) => {
    if (sale.state === 1) {
      await (await contract.requestFinalize()).wait();
      const state = Number(await contract.state());
      if (state !== 2) throw new Error(state === 3 ? "Nobody bought, so the sale is refunding" : "Finalize is not ready");
    }
    const sdk = await openFhe(provider!);
    const { values: [raised, sold], proof } = await publicDecryptHandles(sdk, [await contract.raised(), await contract.tokensSold()]);
    const value = !await contract.cancelled() && raised >= sale.softCap && sold > 0n ? fheFee("finalize") : 0n;
    await (await contract.finalize(raised, sold, proof, { value })).wait();
  });

  const settle = () => run("Refunding", async (contract) => {
    await (await contract.settle({ value: fheFee("settle") })).wait();
  });

  const claim = () => run("Claiming", async (contract) => {
    if (!(await contract.claimOpen(account))) await (await contract.requestClaim()).wait();
    const sdk = await openFhe(provider!);
    const { values: [amount], proof } = await publicDecryptHandles(sdk, [await contract.claimable(account)]);
    await (await contract.claim(amount, proof)).wait();
  });

  const cancel = () => run("Canceling", async (contract) => {
    await (await contract.cancel()).wait();
    if (Number(await contract.state()) !== 2) return;
    const sdk = await openFhe(provider!);
    const { values: [raised, sold], proof } = await publicDecryptHandles(sdk, [await contract.raised(), await contract.tokensSold()]);
    await (await contract.finalize(raised, sold, proof)).wait();
  });

  return (
    <div className="box">
      <h2>Actions</h2>
      <p className="hint">{HINT[status]}</p>
      <div className="row">
        {status === "ended" || status === "finalizing" ? <Button disabled={busy || !account} onClick={finalize}>Finalize</Button> : null}
        {status === "succeeded" ? <Button disabled={busy || !account} onClick={claim}>Claim tokens</Button> : null}
        {status === "refunding" ? <Button disabled={busy || !account} onClick={settle}>Refund cUSDT</Button> : null}
        {owner && (status === "live" || status === "upcoming") ? <Button variant="ghost" disabled={busy} onClick={cancel}>Cancel sale</Button> : null}
      </div>
      {note ? <p className={`note${bad ? " bad" : ""}`}>{note}</p> : null}
    </div>
  );
}
