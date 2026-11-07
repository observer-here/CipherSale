"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { chtAbi } from "@/abi/cht";
import { UnwrapDialog } from "@/components/token/unwrap-dialog";
import { WrapDialog } from "@/components/token/wrap-dialog";
import { Button } from "@/components/ui/button";
import { useBalances } from "@/hooks/balances";
import { useWallet } from "@/hooks/wallet";
import { ADDR } from "@/lib/chain";
import { txError } from "@/lib/format";

export default function AssetsPage() {
  const { account, provider, connect } = useWallet();
  const { cht, ccht, refresh } = useBalances();
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"wrap" | "unwrap">("wrap");

  async function claim() {
    if (!provider) return;
    setNote("");
    try {
      const signer = await provider.getSigner();
      await (await new Contract(ADDR.cht, chtAbi, signer).faucet()).wait();
      setNote("1,000 CHT claimed");
      await refresh();
    } catch (err) {
      setNote(txError(err, "Faucet already used"));
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">WALLET</p>
          <h1>Assets</h1>
          <p className="lede">Wrap CHT into cCHT to hide the balance, or unwrap it back. Only this wallet can decrypt cCHT.</p>
        </div>
      </div>
      {!account ? (
        <div className="box">
          <p className="hint">Connect a wallet to see your CHT and cCHT balances.</p>
          <Button onClick={connect}>Connect</Button>
        </div>
      ) : (
        <>
          <div className="split">
            <div className="box">
              <span className="hint">CHT · public</span>
              <b className="balance">{cht}</b>
              <span className="hint">BEP-20, visible on BscScan</span>
            </div>
            <div className="box">
              <span className="hint">cCHT · confidential</span>
              <b className="balance">{ccht}</b>
              <span className="hint">Encrypted, decrypts for this wallet only</span>
            </div>
          </div>
          <div className="box">
            <div className="filters">
              <button className={tab === "wrap" ? "on" : ""} onClick={() => setTab("wrap")}>Wrap</button>
              <button className={tab === "unwrap" ? "on" : ""} onClick={() => setTab("unwrap")}>Unwrap</button>
            </div>
            {tab === "wrap" ? (
              <WrapDialog onDone={() => refresh().catch(() => undefined)} />
            ) : (
              <UnwrapDialog onDone={() => refresh().catch(() => undefined)} />
            )}
          </div>
          <div className="row">
            <Button variant="ghost" onClick={claim}>Faucet 1,000 CHT</Button>
            {note ? <span className="note">{note}</span> : null}
          </div>
        </>
      )}
    </section>
  );
}
