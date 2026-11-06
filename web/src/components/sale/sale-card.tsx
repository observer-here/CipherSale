"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { eth } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

const star = "M12 4.5 14.3 9.4l5.2.7-3.8 3.7.9 5.2L12 16.4l-4.6 2.6.9-5.2L4.5 10.1l5.2-.7z";

function windowPct(sale: SaleView, now: number) {
  if (sale.end <= sale.start || now <= sale.start) return 0;
  if (now >= sale.end) return 100;
  return Math.round(((now - sale.start) / (sale.end - sale.start)) * 100);
}

function startsIn(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function SaleCard({ sale }: { sale: SaleView }) {
  const now = Math.floor(Date.now() / 1000);
  const status = saleStatus(sale, now);
  const pct = windowPct(sale, now);
  const art = (parseInt(sale.address.slice(2, 4), 16) % 3) + 1;
  const label = status === "ended" || status === "canceled" ? "Closed" : status[0].toUpperCase() + status.slice(1);
  const liquidity = Number(sale.liquidityBps) / 100;
  return (
    <Link href={`/sale/${sale.address}`} className={`card${status === "live" ? " live" : ""}`}>
      <div className={`card-art art-${art}`}>
        <span className={`flag ${status}`}>{label}</span>
        <span className="star"><Icon d={star} size={14} /></span>
      </div>
      <div className="card-body">
        <div className="who">
          <span className="avatar">{sale.symbol.slice(0, 1) || "S"}</span>
          <div>
            <h3>{sale.name}{sale.funded ? <i className="ok" title="Funded" /> : null}</h3>
            <p>{sale.symbol}</p>
          </div>
        </div>
        <div className="tags">
          <span>zkTLS</span>
          <span>cCHT</span>
          {liquidity ? <span>{liquidity}% liquidity</span> : null}
        </div>
        {status === "upcoming" ? (
          <p className="starts">Starts in {startsIn(sale.start - now)}</p>
        ) : (
          <div className="bar-row" title="Time elapsed in the sale window">
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
            <span>{pct}%</span>
          </div>
        )}
        <div className="metrics">
          <div><b>{eth(sale.presaleRate)}</b><span>Per cCHT</span></div>
          <div><b>{eth(sale.tokenPresale)}</b><span>Allocation</span></div>
          <div><b>Private</b><span>Raised</span></div>
        </div>
      </div>
    </Link>
  );
}
