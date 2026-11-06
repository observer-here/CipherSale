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
          <p className="lede">CHT is the normal token. cCHT is its confidential version, and only this wallet can decrypt the balance.</p>
        </div>
      </div>
      {!account ? <Button onClick={connect}>Connect</Button> : (
        <>
          <div className="split">
            <div className="box"><span className="hint">CHT</span><b className="mono">{cht}</b></div>
            <div className="box"><span className="hint">cCHT</span><b className="mono">{ccht}</b></div>
          </div>
          <div className="box">
            <WrapDialog onDone={() => refresh().catch(() => undefined)} />
          </div>
          <div className="box">
            <UnwrapDialog onDone={() => refresh().catch(() => undefined)} />
          </div>
          <div className="row">
            <Button variant="ghost" onClick={claim}>Faucet 1,000 CHT</Button>
          </div>
          {note ? <p className="note">{note}</p> : null}
        </>
      )}
    </section>
  );
}
