"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, paths } from "@/components/ui/icon";
import { useWallet } from "@/hooks/wallet";
import { short } from "@/lib/format";

export function WalletMenu() {
  const { account, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);

  if (!account) return <button className="wallet-btn" onClick={connect}><Icon d={paths.wallet} />Connect</button>;

  return (
    <>
      <button className="wallet-btn" onClick={() => setOpen((value) => !value)}>
        <Icon d={paths.wallet} />{short(account)}<Icon d={paths.chevron} size={14} />
      </button>
      {open ? (
        <div className="menu tight">
          <Button variant="ghost" onClick={() => { disconnect(); setOpen(false); }}>Disconnect</Button>
        </div>
      ) : null}
    </>
  );
}
