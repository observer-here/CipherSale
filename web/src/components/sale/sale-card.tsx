"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fdv, supplyShare, units } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

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
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const tick = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);
  const status = saleStatus(sale, now);
  const pct = windowPct(sale, now);
  const art = (parseInt(sale.address.slice(2, 4), 16) % 3) + 1;
  const label = status === "refunding" ? "Canceled" : status === "ended" ? "Closed" : status[0].toUpperCase() + status.slice(1);
  return (
    <Link href={`/sale/${sale.address}`} className={`card${status === "live" ? " live" : ""}`}>
      <div className={`card-art art-${art}`}>
        <span className={`flag ${status}`}>{label}</span>
      </div>
      <div className="card-body">
        <div className="who">
          <span className="avatar">{sale.symbol.slice(0, 1) || "S"}</span>
          <div>
            <h3>{sale.name}{sale.state === 4 ? <i className="ok" title="Succeeded" /> : null}</h3>
            <p>{sale.symbol}</p>
          </div>
        </div>
        {sale.meta.description ? <p className="blurb">{sale.meta.description}</p> : null}
        <div className="tags">
          <span>zkTLS</span>
          <span>cUSDT</span>
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
          <div><b>{fdv(sale.totalSupply, sale.presaleRate)}</b><span>FDV</span></div>
          <div><b>{supplyShare(sale.tokenPresale, sale.totalSupply)}</b><span>Supply</span></div>
          <div><b>{sale.state === 3 || sale.state === 4 ? `${units(sale.totalRaised)} cUSDT` : "Private"}</b><span>Raised</span></div>
        </div>
      </div>
    </Link>
  );
}
