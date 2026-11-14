"use client";

import { CardBone, CardBones, SaleCard } from "@/components/sale/sale-card";
import { useSales } from "@/components/sale/use-sales";
import { useWallet } from "@/hooks/wallet";

export default function MySalesPage() {
  const { slots, state } = useSales();
  const { account, connect } = useWallet();
  const mine = account ? slots.filter((slot) => slot.sale.owner?.toLowerCase() === account.toLowerCase()) : [];
  const waiting = Boolean(account) && state === "loading";

  return (
    <section className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <h1>My sales</h1>
      </div>
      {!account ? <button className="btn" onClick={connect}>Connect</button> : null}
      {waiting && !mine.length ? <CardBones /> : null}
      {account && state !== "loading" && !mine.length ? <p className="hint">No sales from this wallet yet.</p> : null}
      {mine.length ? (
        <div className="cards">
          {mine.map((slot) => <SaleCard key={slot.address} sale={{ ...slot.sale, address: slot.address }} />)}
          {waiting ? <CardBone /> : null}
        </div>
      ) : null}
    </section>
  );
}
