"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SaleBoard } from "@/components/sale/sale-board";
import { useSales } from "@/components/sale/use-sales";
import { saleStatus } from "@/lib/read";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d={d} />
    </svg>
  );
}

export function Dashboard() {
  const { sales, proofs, state } = useSales();
  const query = useSearchParams().get("q") ?? "";
  const ready = state === "ready";
  const live = sales.filter((sale) => saleStatus(sale) === "live").length;
  const stats = [
    ["M4 10h16v10H4z M8 10V7h8v3", ready ? String(live) : "—", "Active Sales"],
    ["M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16 10a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z M3 19c.6-2.2 2.4-3.4 5-3.4s4.4 1.2 5 3.4 M14 15.7c1.4-.4 2.8.2 3.8 1.5", ready ? String(proofs) : "—", "Verified Participants"],
    ["M12 3v18 M16.5 7.5H9.2a2.4 2.4 0 0 0 0 4.8h5.2a2.4 2.4 0 0 1 0 4.8H7.5", "Private", "Total Raised"],
    ["M12 3 5 6.2v5.6c0 3.6 2.6 5.8 7 7.2 4.4-1.4 7-3.6 7-7.2V6.2z", "—", "Proof Success Rate"],
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker"><span>PRIVATE TOKEN SALES</span><i /></p>
          <h1>Token Sales with<br /><em>zkTLS Verification</em></h1>
          <p className="lede">Verify real-world eligibility and participate in token sales — without exposing your data.</p>
          <div className="actions">
            <Link className="btn" href="/sales">Explore Sales →</Link>
            <Link className="btn btn-ghost" href="/create-sale">Create a Sale</Link>
          </div>
        </div>
        <img className="hero-photo" src="/hero-rocks.jpg" alt="" />
        <ul className="points">
          <li><Icon d="M8 11V8a4 4 0 0 1 8 0v3 M6 11h12v9H6z" /> Private Participation</li>
          <li><Icon d="M13 3 6 14h5l-1 7 8-11h-5z" /> Verifiable Eligibility</li>
          <li><Icon d="M4 8h16v9H4z M8 8V6h8v2 M8 12h8" /> On-chain Settlement</li>
        </ul>
      </section>
      <section className="stats">
        {stats.map(([icon, value, label]) => (
          <article key={label} className="stat">
            <span className="stat-icon"><Icon d={icon} /></span>
            <b>{value}</b>
            <span>{label}</span>
          </article>
        ))}
      </section>
      <SaleBoard sales={sales} state={state} query={query} limit={3} />
    </div>
  );
}
