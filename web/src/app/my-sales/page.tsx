"use client";

import { SaleCard } from "@/components/sale/sale-card";
import { useSales } from "@/components/sale/use-sales";
import { useWallet } from "@/hooks/wallet";

export default function MySalesPage() {
  const { sales, state } = useSales();
  const { account, connect } = useWallet();
  const mine = account ? sales.filter((sale) => sale.owner.toLowerCase() === account.toLowerCase()) : [];

  return (
    <section className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <h1>My sales</h1>
      </div>
      {!account ? <button className="btn" onClick={connect}>Connect</button> : null}
      {account && state === "loading" ? <p className="hint">Loading</p> : null}
      {account && state === "ready" && !mine.length ? <p className="hint">No sales from this wallet yet.</p> : null}
      <div className="cards">
        {mine.map((sale) => <SaleCard key={sale.address} sale={sale} />)}
      </div>
    </section>
  );
}
