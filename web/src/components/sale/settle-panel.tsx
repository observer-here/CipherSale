"use client";

// After the window: reveal totals with a KMS proof, then claim or refund. The owner can cancel while active
// and, after success, unwrap the liquidity share and pair it on PancakeSwap.
import { Contract } from "ethers";
import { useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet";
import { reader } from "@/lib/chain";
import { cipher, eth, txError } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import { decryptHandle, publicDecryptHandles } from "@/primus/decrypt";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";
import type { SaleView } from "@/types/sale";

const HINT = {
  upcoming: "The sale has not opened yet.",
  live: "Contributions are encrypted. Nobody sees the raised total until the window closes.",
  ended: "The window closed. Finalize reveals the raised total and tokens sold with a KMS proof.",
  finalizing: "The totals are decryptable. Finalize submits them with the proof.",
  refunding: "The soft cap was missed or the sale was canceled. Refund returns your cCHT.",
  succeeded: "The soft cap was met. Claim sends your confidential tokens.",
};

export function SettlePanel({ sale, onDone }: { sale: SaleView; onDone: () => void }) {
  const { account, provider } = useWallet();
  const [mine, setMine] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const status = saleStatus(sale);
  const owner = !!account && account.toLowerCase() === sale.owner.toLowerCase();

  async function run(label: string, work: (contract: Contract) => Promise<void>) {
    if (!provider) return setNote("Connect a wallet");
    setBusy(true);
    setNote(label);
    try {
      await work(new Contract(sale.address, cipherSaleAbi, await provider.getSigner()));
      setNote("Done");
      onDone();
    } catch (err) {
      setNote(txError(err, "Failed"));
    } finally {
      setBusy(false);
    }
  }

  const finalize = () => run("Revealing the totals", async (contract) => {
    if (sale.state === 1) {
      await (await contract.requestFinalize()).wait();
      if (Number(await contract.state()) !== 2) return;
    }
    const sdk = await openFhe(provider!);
    const { values: [raised, sold], proof } = await publicDecryptHandles(sdk, [await contract.raised(), await contract.tokensSold()]);
    const value = raised >= sale.softCap ? await fheFee(sdk, sale.saleToken, "deposit") : 0n;
    await (await contract.finalize(raised, sold, proof, { value })).wait();
  });

  const settle = () => run(status === "succeeded" ? "Claiming" : "Refunding", async (contract) => {
    const fee = await fheFee(await openFhe(provider!), sale.address, "settle");
    await (await contract.settle({ value: fee })).wait();
  });

  const addLiquidity = () => run("Listing on PancakeSwap", async (contract) => {
    const sdk = await openFhe(provider!);
    let id = sale.listingId;
    if (BigInt(id) === 0n) {
      await (await contract.list({ value: await fheFee(sdk, await contract.payment(), "unwrap") })).wait();
      id = await contract.listingId();
    }
    const { proof } = await publicDecryptHandles(sdk, [id]);
    await (await contract.addLiquidity(proof)).wait();
  });

  const cancel = () => run("Canceling", async (contract) => {
    await (await contract.cancel()).wait();
  });

  async function reveal() {
    if (!provider || !account) return;
    setBusy(true);
    try {
      const contract = new Contract(sale.address, cipherSaleAbi, reader);
      const sdk = await openFhe(provider);
      const paid = await decryptHandle(sdk, await contract.contributions(account), sale.address);
      const tokens = await decryptHandle(sdk, await contract.claimable(account), sale.address);
      setMine(`Paid ${eth(paid)} cCHT for ${eth(tokens)} ${sale.symbol}`);
    } catch (err) {
      setMine(txError(err, "Cannot decrypt"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h2 style={{ margin: 0 }}>After the window</h2>
      <p className="hint">{HINT[status]}</p>
      <p className="hint">
        {sale.totalRaised > 0n
          ? `Raised ${eth(sale.totalRaised)} cCHT, sold ${eth(sale.totalSold)} ${sale.symbol}.`
          : <>Raised <span className="mono">{cipher(sale.raised)}</span></>}
      </p>
      <div className="row">
        <Button variant="ghost" disabled={busy || !account} onClick={reveal}>Decrypt mine</Button>
        {status === "ended" || status === "finalizing" ? <Button disabled={busy || !account} onClick={finalize}>Finalize</Button> : null}
        {status === "succeeded" || status === "refunding" ? (
          <Button disabled={busy || !account} onClick={settle}>{status === "succeeded" ? "Claim tokens" : "Refund cCHT"}</Button>
        ) : null}
        {owner && status === "succeeded" && sale.liquidityBps > 0n && !sale.listed ? (
          <Button variant="ghost" disabled={busy} onClick={addLiquidity}>Add liquidity</Button>
        ) : null}
        {owner && (status === "live" || status === "upcoming") ? <Button variant="ghost" disabled={busy} onClick={cancel}>Cancel</Button> : null}
      </div>
      {mine ? <p className="note mono">{mine}</p> : null}
      {note ? <p className="note">{note}</p> : null}
    </div>
  );
}
