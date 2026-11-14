"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SaleBoard } from "@/components/sale/sale-board";
import { useSales } from "@/components/sale/use-sales";
import { Icon, paths } from "@/components/ui/icon";
import { units } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

const people = "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M3 19c.6-2.4 2.5-3.6 5-3.6s4.4 1.2 5 3.6 M14.5 15.6c1.5-.4 3 .2 4 1.6";
const bolt = "M13 3 6 14h5l-1 7 8-11h-5z";

const statMeta = [
  [paths.layers, "Sales"],
  [people, "Verified Participants"],
  [paths.coin, "Total Raised"],
  [paths.shield, "Total Sales"],
] as const;

function Stats({ values }: { values: (string | undefined)[] }) {
  return (
    <section className="stats">
      {statMeta.map(([icon, label], index) => (
        <article key={label} className="stat">
          <Icon d={icon} size={26} />
          <div>
            <b>{values[index] ?? <span className="bone" />}</b>
            <small>{label}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

function HomeBody() {
  const { slots, state } = useSales();
  const query = useSearchParams().get("q") ?? "";
  const sales = slots.map((slot) => slot.sale);
  const liveKnown = state !== "loading" || sales.some((sale) => sale.state !== undefined && sale.start !== undefined && sale.end !== undefined);
  const live = sales.filter((sale) => sale.state !== undefined && sale.start !== undefined && sale.end !== undefined && saleStatus(sale as SaleView) === "live").length;
  const buyersKnown = state !== "loading" || sales.some((sale) => sale.buyers !== undefined);
  const proofs = sales.reduce((sum, sale) => sum + (sale.buyers ?? 0), 0);
  const revealed = sales.reduce((sum, sale) => sum + (sale.totalRaised ?? 0n), 0n);
  const published = slots.length > 0 && sales.every((sale) => sale.state === 3 || sale.state === 4);
  const raised = revealed > 0n || (state === "ready" && published) ? `${units(revealed)} cUSDT` : state === "ready" ? "Private" : undefined;

  return (
    <>
      <Stats values={[
        liveKnown ? String(live) : undefined,
        buyersKnown ? String(proofs) : undefined,
        raised,
        slots.length || state !== "loading" ? String(slots.length) : undefined,
      ]} />
      <SaleBoard slots={slots} state={state} query={query} limit={3} title="Sales" />
    </>
  );
}

export function Dashboard() {
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
      <Suspense fallback={<Stats values={[]} />}>
        <HomeBody />
      </Suspense>
    </>
  );
}
