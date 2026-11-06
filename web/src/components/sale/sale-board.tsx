"use client";

import Link from "next/link";
import { useState } from "react";
import { SaleCard } from "@/components/sale/sale-card";
import { saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

const filters = ["all", "live", "upcoming", "closed"] as const;

function bucket(sale: SaleView) {
  const status = saleStatus(sale);
  return status === "ended" || status === "canceled" ? "closed" : status;
}

export function SaleBoard({
  sales,
  state,
  query,
  limit,
}: {
  sales: SaleView[];
  state: "loading" | "ready" | "error";
  query: string;
  limit?: number;
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const needle = query.trim().toLowerCase();
  const shown = sales.filter((sale) => {
    if (filter !== "all" && bucket(sale) !== filter) return false;
    const hay = `${sale.name} ${sale.symbol} ${sale.address} ${sale.owner}`.toLowerCase();
    return hay.includes(needle);
  });
  const rows = limit ? shown.slice(0, limit) : shown;
  let message = "";
  if (state === "loading") message = "Loading sales";
  else if (state === "error") message = "Could not read the sale factory.";
  else if (!shown.length) message = needle ? "No sales match that search." : "No sales on BNB testnet yet.";

  return (
    <section>
      <div className="board-head">
        <h2>Active Sales</h2>
        <div className="filters">
          {filters.map((item) => (
            <button key={item} className={item === filter ? "on" : ""} onClick={() => setFilter(item)}>
              {item === "closed" ? "Closed" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        {limit ? <Link href="/sales" className="view-all">View all →</Link> : <span />}
      </div>
      {message ? <p className="empty">{message}</p> : null}
      <div className="cards">
        {rows.map((sale) => <SaleCard key={sale.address} sale={sale} />)}
      </div>
    </section>
  );
}
