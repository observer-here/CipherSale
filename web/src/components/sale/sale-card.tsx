"use client";

import Link from "next/link";
import { eth, short } from "@/lib/format";
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
  const hue = parseInt(sale.address.slice(2, 8), 16) % 40;
  return (
    <Link href={`/sale/${sale.address}`} className={`card ${status === "live" ? "live" : ""}`}>
      <div className="card-art" style={{ background: `linear-gradient(145deg, hsl(${hue} 8% 18%), #111 46%, hsl(${hue + 20} 6% 32%))` }} />
      <div className="card-body">
        <div className="card-top">
          <span className={`pill ${status}`}>{status}</span>
          <span className="mono" style={{ color: "#999", fontSize: 11 }}>{short(sale.address)}</span>
        </div>
        <div>
          <h3>{sale.name}</h3>
          <p>{sale.symbol} · pays with cCHT</p>
        </div>
        <div className="tags">
          <span>zkTLS</span>
          <span>{Number(sale.liquidityBps) / 100}% liquidity</span>
        </div>
        <div className="bar" title="Time through the sale window"><i style={{ width: `${pct}%` }} /></div>
        <div className="metrics">
          <div><b>{eth(sale.presaleRate)}</b><span>Per 1 cCHT</span></div>
          <div><b>{eth(sale.hardCap)}</b><span>Hard cap</span></div>
          <div><b>Hidden</b><span>Raised</span></div>
        </div>
      </div>
    </Link>
  );
}
