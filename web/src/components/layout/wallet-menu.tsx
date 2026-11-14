"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, paths } from "@/components/ui/icon";
import { useWallet } from "@/hooks/wallet";
import { short } from "@/lib/format";

export function WalletMenu() {
  const { account, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function down(event: PointerEvent) {
      if (ref.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function esc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!account) return <button className="wallet-btn" onClick={connect}><Icon d={paths.wallet} />Connect</button>;

  return (
    <div className="pop" ref={ref}>
      <button className="wallet-btn" onClick={() => setOpen((value) => !value)}>
        <Icon d={paths.wallet} />{short(account)}<Icon d={paths.chevron} size={14} />
      </button>
      {open ? (
        <div className="menu tight">
          <Button variant="ghost" onClick={() => { disconnect(); setOpen(false); }}>Disconnect</Button>
        </div>
      ) : null}
    </div>
  );
}
