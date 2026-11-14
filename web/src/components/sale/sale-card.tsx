"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, Spotify, paths } from "@/components/ui/icon";
import { clock, fdv, supplyShare, units } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

function windowPct(sale: SaleView, now: number) {
  if (sale.end <= sale.start || now <= sale.start) return 0;
  if (now >= sale.end) return 100;
  return Math.round(((now - sale.start) / (sale.end - sale.start)) * 100);
}

export function CardBone() {
  return (
    <div className="card still" aria-hidden="true">
      <div className="bone art" />
      <div className="card-body">
        <div className="who">
          <span className="bone round" />
          <div>
            <span className="bone name" />
            <span className="bone sub" />
          </div>
        </div>
        <span className="bone line" />
        <div className="tags"><span><Spotify size={14} className="spotify" /> Spotify</span><span className="bone timer" style={{ width: 72, height: 16 }} /></div>
        <div className="bar-row">
          <div className="bar" />
          <span className="bone" style={{ width: 28 }} />
        </div>
        <div className="metrics">
          <div><b><span className="bone" /></b><span>FDV</span></div>
          <div><b><span className="bone" /></b><span>Supply</span></div>
          <div><b><span className="bone" /></b><span>Raised</span></div>
        </div>
      </div>
    </div>
  );
}

export function CardBones({ count = 3 }: { count?: number }) {
  return (
    <div className="cards">
      {Array.from({ length: count }, (_, n) => <CardBone key={n} />)}
    </div>
  );
}

export function SaleCard({ sale }: { sale: Partial<SaleView> & { address: string } }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const tick = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);
  const has = (key: keyof SaleView) => sale[key] !== undefined;
  const timed = has("state") && has("start") && has("end");
  const status = timed ? saleStatus(sale as SaleView, now) : "";
  const pct = timed ? windowPct(sale as SaleView, now) : 0;
  const art = (parseInt(sale.address.slice(2, 4), 16) % 3) + 1;
  const label = status === "refunding" ? "Canceled" : status === "ended" ? "Closed" : status ? status[0].toUpperCase() + status.slice(1) : "";
  const fdvText = has("totalSupply") && has("presaleRate") ? fdv(sale.totalSupply!, sale.presaleRate!) : null;
  const supplyText = has("tokenPresale") && has("totalSupply") ? supplyShare(sale.tokenPresale!, sale.totalSupply!) : null;
  const raisedText = has("state") && has("totalRaised") ? (sale.state === 3 || sale.state === 4 ? `${units(sale.totalRaised!)} cUSDT` : "Private") : null;
  const timer = status === "upcoming" ? `STARTS: ${clock(sale.start! - now)}` : status === "live" ? `ENDS: ${clock(sale.end! - now)}` : "";
  return (
    <Link href={`/sale/${sale.address}`} className={`card${status === "live" ? " live" : ""}`}>
      <div className={`card-art art-${art}`}>
        {status ? <span className={`flag ${status}`}>{label}</span> : <span className="bone" style={{ position: "absolute", top: 12, left: 12, width: 64, height: 18 }} />}
      </div>
      <div className="card-body">
        <div className="who">
          {has("symbol") ? <span className="avatar">{sale.symbol!.slice(0, 1) || "S"}</span> : <span className="bone round" />}
          <div>
            {has("name") ? <h3>{sale.name}{sale.state === 4 ? <i className="ok" title="Succeeded" /> : null}</h3> : <span className="bone name" />}
            {has("symbol") ? <p>{sale.symbol}</p> : <span className="bone sub" />}
          </div>
        </div>
        {has("meta") ? (sale.meta!.description ? <p className="blurb">{sale.meta!.description}</p> : null) : <span className="bone line" />}
        <div className="tags">
          <span><Spotify size={14} className="spotify" /> Spotify</span>
          {timer ? <span className="timer"><Icon d={paths.clock} size={14} />{timer}</span> : !timed ? <span className="bone timer" style={{ width: 72, height: 16 }} /> : null}
        </div>
        <div className="bar-row" title="Time elapsed in the sale window">
          <div className="bar">{timed ? <i style={{ width: `${pct}%` }} /> : null}</div>
          {timed ? <span>{pct}%</span> : <span className="bone" style={{ width: 28 }} />}
        </div>
        <div className="metrics">
          <div><b>{fdvText ?? <span className="bone" />}</b><span>FDV</span></div>
          <div><b>{supplyText ?? <span className="bone" />}</b><span>Supply</span></div>
          <div><b>{raisedText ?? <span className="bone" />}</b><span>Raised</span></div>
        </div>
      </div>
    </Link>
  );
}
