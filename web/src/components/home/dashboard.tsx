"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SaleBoard } from "@/components/sale/sale-board";
import { useSales } from "@/components/sale/use-sales";
import { Icon, paths } from "@/components/ui/icon";
import { eth } from "@/lib/format";
import { saleStatus } from "@/lib/read";

const people = "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M3 19c.6-2.4 2.5-3.6 5-3.6s4.4 1.2 5 3.6 M14.5 15.6c1.5-.4 3 .2 4 1.6";
const bolt = "M13 3 6 14h5l-1 7 8-11h-5z";

export function Dashboard() {
  const { sales, proofs, state } = useSales();
  const query = useSearchParams().get("q") ?? "";
  const ready = state === "ready";
  const live = sales.filter((sale) => saleStatus(sale) === "live").length;
  const revealed = sales.reduce((sum, sale) => sum + sale.totalRaised, 0n);
  const stats = [
    [paths.layers, ready ? String(live) : "—", "Active Sales"],
    [people, ready ? String(proofs) : "—", "Verified Participants"],
    [paths.coin, revealed > 0n ? `${eth(revealed)} cCHT` : "Private", "Total Raised"],
    [paths.shield, ready ? String(sales.length) : "—", "Total Sales"],
  ];

  return (
    <>
      <section className="hero">
        <img className="hero-photo" src="/hero.jpg" alt="" />
        <div className="hero-copy">
          <h1>Token Sales with<br /><em>zkTLS</em> Verification</h1>
          <p className="lede">Verify real-world eligibility and participate in token sales — without exposing your data.</p>
          <div className="actions">
            <Link className="btn" href="/sales">Explore Sales →</Link>
            <Link className="btn btn-ghost" href="/create-sale">Create a Sale</Link>
          </div>
        </div>
        <ul className="points">
          <li><Icon d={paths.lock} size={17} /> Private Participation</li>
          <li><Icon d={bolt} size={17} /> Verifiable Eligibility</li>
          <li><Icon d={paths.layers} size={17} /> On-chain Settlement</li>
        </ul>
      </section>
      <section className="stats">
        {stats.map(([icon, value, label]) => (
          <article key={label} className="stat">
            <Icon d={icon} size={26} />
            <div>
              <b>{value}</b>
              <small>{label}</small>
            </div>
          </article>
        ))}
      </section>
      <SaleBoard sales={sales} state={state} query={query} limit={3} />
    </>
  );
}
