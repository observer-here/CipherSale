"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SaleBoard } from "@/components/sale/sale-board";
import { useSales } from "@/components/sale/use-sales";
import { useWallet } from "@/hooks/wallet";
import { saleStatus } from "@/lib/read";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d={d} />
    </svg>
  );
}

export function Dashboard() {
  const { sales, state } = useSales();
  const { account } = useWallet();
  const query = useSearchParams().get("q") ?? "";
  const live = sales.filter((sale) => saleStatus(sale) === "live").length;
  const upcoming = sales.filter((sale) => saleStatus(sale) === "upcoming").length;
  const closed = sales.length - live - upcoming;

  return (
    <div className="home">
      <div>
        <section className="hero">
          <div>
            <p className="kicker">PRIVATE TOKEN SALES</p>
            <h1>Token Sales with zkTLS Verification</h1>
            <p className="lede">Verify real-world eligibility and participate in token sales — without exposing your amount.</p>
            <div className="actions">
              <Link className="btn" href="/sales">Explore Sales</Link>
              <Link className="btn btn-ghost" href="/create-sale">Create a Sale</Link>
            </div>
            <ul className="points">
              <li><Icon d="M7 11V8a5 5 0 0 1 10 0v3 M6 11h12v9H6z" /> Private participation</li>
              <li><Icon d="M13 3 6 13h5l-1 8 8-12h-5z" /> Verifiable eligibility</li>
              <li><Icon d="M4 7h16v10H4z M8 7V5h8v2" /> On-chain settlement</li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden>
            <div className="ring" />
            <div className="lock">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M8 11V8a4 4 0 0 1 8 0v3 M6 11h12v9H6z" />
              </svg>
            </div>
          </div>
        </section>
        <section className="stats">
          <article className="stat"><span>Live now</span><b>{state === "ready" ? live : "—"}</b><em>Active sales</em></article>
          <article className="stat"><span>Not started</span><b>{state === "ready" ? upcoming : "—"}</b><em>Upcoming</em></article>
          <article className="stat"><span>Ended or canceled</span><b>{state === "ready" ? closed : "—"}</b><em>Closed</em></article>
          <article className="stat"><span>Soft cap is private</span><b>Hidden</b><em>Total raised</em></article>
        </section>
        <SaleBoard sales={sales} state={state} query={query} limit={6} />
      </div>
      <aside className="rail">
        <section className="verify">
          <span className="pill">{account ? "Wallet connected" : "Not connected"}</span>
          <h2>{account ? "Ready to prove" : "Connect to join"}</h2>
          <p>zkTLS eligibility is checked per sale. The contribution amount stays a ciphertext.</p>
          <Link className="btn" href={account ? "/sales" : "/verifications"}>{account ? "View sales" : "What you need"}</Link>
        </section>
        <section className="rail-card">
          <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Quick Actions</h2>
          <div className="quick">
            <Link href="/sales">Participate in a sale</Link>
            <Link href="/create-sale">Create token sale</Link>
            <Link href="/verifications">Verify eligibility</Link>
            <Link href="/analytics">View analytics</Link>
          </div>
        </section>
        <section className="rail-card">
          <div className="board-head"><h2 style={{ fontSize: 16 }}>Recent activity</h2></div>
          <div className="activity">
            {sales.length ? sales.slice(0, 4).map((sale) => (
              <div key={sale.address}>
                <span className="dot" />
                <div>
                  <Link href={`/sale/${sale.address}`}>{sale.name} listed</Link>
                  <small>{saleStatus(sale)} · raised hidden</small>
                </div>
              </div>
            )) : <p className="hint">No sales created yet.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}
