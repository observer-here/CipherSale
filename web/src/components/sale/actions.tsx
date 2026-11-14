"use client";

import { Contract, id } from "ethers";
import { useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet";
import { requireChain } from "@/lib/chain";
import { txError } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import { decryptHandle, publicDecryptHandles } from "@/primus/decrypt";
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
    const signer = await provider!.getSigner();
    const me = await signer.getAddress();
    const code = (await provider!.getCode(sale.address)).toLowerCase();
    if (code.includes(id("claim(uint256,bytes)").slice(2, 10))) {
      const handle = await contract.claimable(me);
      if (BigInt(handle) === 0n) throw new Error("This wallet did not buy in this sale");
      if (!(await contract.claimOpen(me))) await (await contract.requestClaim()).wait();
      const sdk = await openFhe(provider!);
      const { values: [amount], proof } = await publicDecryptHandles(sdk, [handle]);
      await (await contract.claim(amount, proof)).wait();
      return;
    }
    // This sale locked the sold tokens in its wrapper. Settle moves them, unwrap releases the plain token.
    if (!(await contract.settled(me))) {
      if (BigInt(await contract.claimable(me)) === 0n) throw new Error("This wallet did not buy in this sale");
      await (await contract.settle({ value: fheFee("settle") })).wait();
    }
    const wrapper = await new Contract(sale.address, ["function saleToken() view returns (address)"], provider).saleToken();
    const wrapped = new Contract(wrapper, cipherTokenAbi, signer);
    const balance = await wrapped.balanceOf(me);
    if (BigInt(balance) === 0n) throw new Error("Nothing left to claim");
    setNote("Releasing the project tokens");
    const sdk = await openFhe(provider!);
    const amount = await decryptHandle(sdk, balance, wrapper);
    if (amount === 0n) throw new Error("Could not read the claim amount");
    const receipt = await (await wrapped.unwrap(amount, me, { value: fheFee("unwrap") })).wait();
    const opened = receipt?.logs
      .map((log: { topics: string[]; data: string }) => { try { return wrapped.interface.parseLog(log); } catch { return null; } })
      .find((row: { name: string; args: { id: string } } | null) => row?.name === "UnwrapRequested");
    if (!opened) throw new Error("Unwrap request not found");
    const { values: [cleartext], proof } = await publicDecryptHandles(sdk, [opened.args.id]);
    await (await wrapped.finalizeUnwrap(opened.args.id, cleartext, proof)).wait();
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
