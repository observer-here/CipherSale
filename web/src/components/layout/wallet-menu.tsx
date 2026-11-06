"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, paths } from "@/components/ui/icon";
import { useBalances } from "@/hooks/balances";
import { useWallet } from "@/hooks/wallet";
import { short } from "@/lib/format";

export function WalletMenu() {
  const { account, connect, disconnect } = useWallet();
  const { cht, ccht } = useBalances();
  const [open, setOpen] = useState(false);

  if (!account) return <button className="wallet-btn" onClick={connect}><Icon d={paths.wallet} />Connect</button>;

  return (
    <>
      <button className="wallet-btn" onClick={() => setOpen((value) => !value)}>
        <Icon d={paths.wallet} />{short(account)}<Icon d={paths.chevron} size={14} />
      </button>
      {open ? (
        <div className="menu">
          <div className="balances">
            <span>CHT <b className="mono">{cht}</b></span>
            <span>cCHT <b className="mono">{ccht}</b></span>
          </div>
          <div className="row">
            <Link className="btn" href="/assets" onClick={() => setOpen(false)}>Assets</Link>
            <Button variant="ghost" onClick={() => { disconnect(); setOpen(false); }}>Disconnect</Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
