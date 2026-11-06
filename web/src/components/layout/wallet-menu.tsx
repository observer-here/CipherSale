"use client";

import { Contract } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { chtAbi } from "@/abi/cht";
import { WrapDialog } from "@/components/token/wrap-dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/wallet";
import { ADDR } from "@/lib/chain";
import { cipher, eth, short, txError } from "@/lib/format";
import { confidentialBalance } from "@/lib/read";
import { decryptHandle } from "@/primus/decrypt";
import { openFhe } from "@/primus/sdk";

export function WalletMenu() {
  const { account, provider, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [cht, setCht] = useState("—");
  const [ccht, setCcht] = useState("—");
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    if (!provider || !account) return;
    const plain = new Contract(ADDR.cht, chtAbi, provider);
    setCht(eth(await plain.balanceOf(account)));
    const handle = await confidentialBalance(provider, ADDR.ccht, account);
    setCcht(cipher(handle));
    try {
      const sdk = await openFhe(provider);
      setCcht(eth(await decryptHandle(sdk, handle, ADDR.ccht)));
    } catch {
      setCcht(cipher(handle));
    }
  }, [provider, account]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  async function claim() {
    if (!provider) return;
    setNote("");
    try {
      const signer = await provider.getSigner();
      const tx = await new Contract(ADDR.cht, chtAbi, signer).faucet();
      await tx.wait();
      setNote("1,000 CHT claimed");
      await refresh();
    } catch (err) {
      setNote(txError(err, "Faucet already used"));
    }
  }

  if (!account) return <button className="wallet-btn" onClick={connect}>Connect</button>;

  return (
    <>
      <button className="wallet-btn mono" onClick={() => setOpen((value) => !value)}>{short(account)}</button>
      {open ? (
        <div className="menu">
          <div className="balances">
            <span>CHT <b className="mono">{cht}</b></span>
            <span>cCHT <b className="mono">{ccht}</b></span>
          </div>
          <div className="row">
            <Button onClick={claim}>Faucet</Button>
            <Button variant="ghost" onClick={() => setWrap((value) => !value)}>{wrap ? "Close" : "Wrap"}</Button>
            <Button variant="ghost" onClick={() => { disconnect(); setOpen(false); }}>Disconnect</Button>
          </div>
          {note ? <p className="note">{note}</p> : null}
          {wrap ? <WrapDialog onDone={() => { setWrap(false); refresh().catch(() => undefined); }} /> : null}
        </div>
      ) : null}
    </>
  );
}
