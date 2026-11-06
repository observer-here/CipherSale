"use client";

import { Contract } from "ethers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { chtAbi } from "@/abi/cht";
import { Band } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { WrapDialog } from "@/components/token/wrap-dialog";
import { useWallet } from "@/hooks/wallet";
import { ADDR } from "@/lib/chain";
import { cipher, eth, short } from "@/lib/format";
import { confidentialBalance } from "@/lib/read";
import { decryptHandle } from "@/primus/decrypt";
import { openFhe } from "@/primus/sdk";

const links = [
  { href: "/", label: "Sales" },
  { href: "/create-token", label: "Create token" },
  { href: "/create-sale", label: "Create sale" },
];

export function SiteHeader() {
  const path = usePathname();
  const { account, provider, busy, error, connect } = useWallet();
  const [cht, setCht] = useState("—");
  const [ccht, setCcht] = useState("—");
  const [open, setOpen] = useState(false);
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
      setNote(err instanceof Error ? err.message : "Faucet already used");
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-white/15 bg-[#0c0d0f]">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-6 py-4">
        <Link href="/">
          <span className="text-lg tracking-[0.18em]">CIPHERSALE</span>
          <span className="mt-1 block h-px w-16 bg-[#9ff6ff]" />
        </Link>
        <nav className="flex gap-6 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={path === link.href ? "text-[#9ff6ff]" : "text-white/70"}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {account ? (
            <>
              <span>CHT <span className="mono">{cht}</span></span>
              <span>cCHT <span className="mono text-[#9ff6ff]">{ccht}</span></span>
              <Button onClick={claim}>Faucet</Button>
              <Button onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Wrap"}</Button>
              <span className="mono text-white/55">{short(account)}</span>
            </>
          ) : (
            <Button disabled={busy} onClick={connect}>{busy ? "Connecting" : "Connect"}</Button>
          )}
        </div>
      </div>
      {error || note ? <p className="px-6 pb-3 text-sm text-[#9ff6ff]">{error || note}</p> : null}
      <Band open={open}>
        <WrapDialog onDone={() => { setOpen(false); refresh().catch(() => undefined); }} />
      </Band>
    </header>
  );
}
