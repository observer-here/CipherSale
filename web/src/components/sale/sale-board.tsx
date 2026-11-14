"use client";

import Link from "next/link";
import { useState } from "react";
import { CardBones, SaleCard } from "@/components/sale/sale-card";
import type { SaleSlot } from "@/components/sale/use-sales";
import { isClosed, saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

const filters = ["all", "live", "upcoming", "closed"] as const;

function bucket(sale: SaleView) {
  const status = saleStatus(sale);
  return isClosed(status) ? "closed" : status;
}

function timed(sale: Partial<SaleView>) {
  return sale.state !== undefined && sale.start !== undefined && sale.end !== undefined;
}

export function SaleBoard({
  slots,
  state,
  query,
  limit,
  title,
}: {
  slots: SaleSlot[];
  state: "loading" | "ready" | "error";
  query: string;
  limit?: number;
  title?: string;
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const needle = query.trim().toLowerCase();
  const shown = slots.filter(({ sale }) => {
    if (!needle && filter === "all") return true;
    if (!timed(sale)) return false;
    if (filter !== "all" && bucket(sale as SaleView) !== filter) return false;
    const hay = `${sale.name ?? ""} ${sale.symbol ?? ""} ${sale.address ?? ""} ${sale.owner ?? ""}`.toLowerCase();
    return hay.includes(needle);
  });
  const rows = limit ? shown.slice(0, limit) : shown;
  const message = state === "error"
    ? "Could not read the sale factory."
    : state === "ready" && !rows.length
      ? needle ? "No sales match that search." : "No sales on BNB testnet yet."
      : "";

  return (
    <section>
      <div className="board-head">
        {title ? <h2>{title}</h2> : null}
        <div className="filters">
          {filters.map((item) => (
            <button key={item} className={item === filter ? "on" : ""} onClick={() => setFilter(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        {limit ? <Link href="/sales" className="view-all">View All →</Link> : null}
      </div>
      {state === "loading" && !rows.length ? <CardBones count={limit ?? 3} /> : null}
      {message ? <p className="empty">{message}</p> : null}
      {rows.length ? (
        <div className="cards">
          {rows.map(({ address, sale }) => <SaleCard key={address} sale={{ ...sale, address }} />)}
        </div>
      ) : null}
    </section>
  );
}
