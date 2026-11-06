"use client";

import Link from "next/link";
import { eth } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

function windowPct(sale: SaleView) {
  const now = Math.floor(Date.now() / 1000);
  if (sale.end <= sale.start || now <= sale.start) return 0;
  if (now >= sale.end) return 100;
  return Math.round(((now - sale.start) / (sale.end - sale.start)) * 100);
}

export function SaleCard({ sale }: { sale: SaleView }) {
  const status = saleStatus(sale);
  const pct = windowPct(sale);
  const label = status === "ended" || status === "canceled" ? "Closed" : status[0].toUpperCase() + status.slice(1);
  return (
    <Link href={`/sale/${sale.address}`} className={`card ${status === "live" ? "live" : ""}`}>
      <div className="card-art">
        <span className={`flag ${status}`}>{label}</span>
      </div>
      <div className="card-body">
        <div className="who">
          <span className="avatar">{sale.symbol.slice(0, 1) || "S"}</span>
          <div>
            <h3>{sale.name}{sale.funded ? <i className="ok" /> : null}</h3>
            <p>{sale.symbol}</p>
          </div>
        </div>
        <div className="tags">
          <span>zkTLS</span>
          <span>cCHT</span>
          <span>{Number(sale.liquidityBps) / 100}% liquidity</span>
        </div>
        <div className="bar-row">
          <div className="bar" title="Time elapsed in the sale window"><i style={{ width: `${pct}%` }} /></div>
          <span>{pct}%</span>
        </div>
        <div className="metrics">
          <div><b>{eth(sale.presaleRate)}</b><span>Token Price</span></div>
          <div><b>{eth(sale.tokenPresale)}</b><span>Allocation</span></div>
          <div><b>Private</b><span>Raised</span></div>
        </div>
      </div>
    </Link>
  );
}
