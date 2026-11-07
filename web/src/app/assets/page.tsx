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
  const { cht, ccht, chtRaw, cchtRaw, refresh, reveal } = useBalances(Boolean(account), false);
  const [tab, setTab] = useState<"wrap" | "unwrap">("wrap");
  const [shown, setShown] = useState(false);
  const [eye, setEye] = useState(false);
  const [note, setNote] = useState("");

  async function done() {
    await refresh();
    if (shown) await reveal();
  }

  async function toggle() {
    if (shown) return setShown(false);
    setEye(true);
    try {
      await reveal();
      setShown(true);
    } finally {
      setEye(false);
    }
  }

  async function claim() {
    if (!provider) return;
    setNote("");
    try {
      await (await new Contract(ADDR.cht, chtAbi, await provider.getSigner()).faucet()).wait();
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
          <h1>Assets</h1>
          <p className="lede">Wrap CHT into cCHT, or unwrap it back. 1 CHT = 1 cCHT.</p>
        </div>
      </div>
      {!account ? (
        <div className="box swap">
          <p className="hint">Connect a wallet to wrap and unwrap.</p>
          <Button onClick={connect}>Connect</Button>
        </div>
      ) : (
        <div className="box swap">
          <div className="split">
            <div>
              <span className="hint">CHT balance</span>
              <b className="balance mono">{cht}</b>
              <button className="eye" type="button" onClick={claim}>Claim 1,000 CHT</button>
            </div>
            <div>
              <span className="hint">cCHT balance</span>
              <b className="balance mono">{shown ? ccht : "••••••"}</b>
              <button className="eye" type="button" onClick={toggle}>{eye ? "Decrypting" : shown ? "Hide" : "Show"}</button>
            </div>
          </div>
          <div className="filters">
            <button className={tab === "wrap" ? "on" : ""} type="button" onClick={() => setTab("wrap")}>Wrap CHT</button>
            <button className={tab === "unwrap" ? "on" : ""} type="button" onClick={() => setTab("unwrap")}>Unwrap cCHT</button>
          </div>
          {tab === "wrap" ? (
            <WrapDialog balance={chtRaw} onDone={() => done().catch(() => undefined)} />
          ) : (
            <UnwrapDialog balance={cchtRaw} onMax={async () => { const value = await reveal(); setShown(true); return value; }} onDone={() => done().catch(() => undefined)} />
          )}
          {note ? <p className="note">{note}</p> : null}
        </div>
      )}
    </section>
  );
}
