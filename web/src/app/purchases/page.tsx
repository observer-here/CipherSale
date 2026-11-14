"use client";

import { Contract } from "ethers";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { CardBone, CardBones, SaleCard } from "@/components/sale/sale-card";
import { useSales } from "@/components/sale/use-sales";
import { useWallet } from "@/hooks/wallet";
import { reader } from "@/lib/chain";

export default function PurchasesPage() {
  const { slots, state } = useSales();
  const { account, connect } = useWallet();
  const seen = useRef(new Set<string>());
  const [hits, setHits] = useState<string[]>([]);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    seen.current = new Set();
    setHits([]);
    setLeft(0);
  }, [account]);

  useEffect(() => {
    if (!account) return;
    for (const slot of slots) {
      if (seen.current.has(slot.address)) continue;
      seen.current.add(slot.address);
      const address = slot.address;
      setLeft((n) => n + 1);
      new Contract(address, cipherSaleAbi, reader).eligible(account).then((ok) => {
        if (ok) setHits((prev) => prev.includes(address) ? prev : [...prev, address]);
      }).catch(() => undefined).finally(() => setLeft((n) => Math.max(0, n - 1)));
    }
  }, [account, slots]);

  const mine = hits.flatMap((address) => {
    const slot = slots.find((item) => item.address === address);
    return slot ? [{ ...slot.sale, address }] : [];
  });
  const waiting = Boolean(account) && (state === "loading" || left > 0);

  return (
    <section className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <h1>My purchases</h1>
      </div>
      {!account ? <button className="btn" onClick={connect}>Connect</button> : null}
      {waiting && !mine.length ? <CardBones /> : null}
      {account && !waiting && !mine.length ? <p className="hint">No sales for this wallet yet.</p> : null}
      {mine.length ? (
        <>
          <div className="cards">
            {mine.map((sale) => <SaleCard key={sale.address} sale={sale} />)}
            {waiting ? <CardBone /> : null}
          </div>
          <Link href="/sales" className="hint">Browse all sales</Link>
        </>
      ) : null}
    </section>
  );
}
