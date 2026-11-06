"use client";

import { SaleCard } from "@/components/sale/sale-card";
import { useSales } from "@/components/sale/use-sales";
import { eth } from "@/lib/format";
import { saleStatus } from "@/lib/read";

export default function AnalyticsPage() {
  const { sales, state } = useSales();
  const live = sales.filter((sale) => saleStatus(sale) === "live");
  return (
    <section className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <div>
          <p className="kicker">PUBLIC TERMS</p>
          <h1>Analytics</h1>
          <p className="lede">Caps, rates, and windows are public. Raised totals, contributions, and claimable balances are ciphertexts.</p>
        </div>
      </div>
      <section className="stats">
        <article className="stat"><span>All sales</span><b>{state === "ready" ? sales.length : "—"}</b></article>
        <article className="stat"><span>Live</span><b>{state === "ready" ? live.length : "—"}</b></article>
        <article className="stat"><span>Hard cap, live</span><b>{state === "ready" ? eth(live.reduce((sum, sale) => sum + sale.hardCap, 0n)) : "—"}</b><em>cCHT cap, not raised</em></article>
        <article className="stat"><span>Raised</span><b>Hidden</b></article>
      </section>
      <div className="cards">
        {sales.map((sale) => <SaleCard key={sale.address} sale={sale} />)}
      </div>
    </section>
  );
}
