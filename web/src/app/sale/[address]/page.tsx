"use client";

import { JsonRpcProvider } from "ethers";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BuyPanel } from "@/components/sale/buy-panel";
import { SettlePanel } from "@/components/sale/settle-panel";
import { useWallet } from "@/hooks/wallet";
import { RPC } from "@/lib/chain";
import { eth, short, when } from "@/lib/format";
import { loadSale, saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

export default function SalePage() {
  const params = useParams<{ address: string }>();
  const { provider } = useWallet();
  const [sale, setSale] = useState<SaleView>();
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    loadSale(provider ?? new JsonRpcProvider(RPC), params.address).then(setSale).catch(() => setError("This address is not a sale"));
  }, [provider, params.address]);

  useEffect(reload, [reload]);

  if (!sale) return <p className="hint">{error || "Loading"}</p>;

  const status = saleStatus(sale);
  const rows: [string, string][] = [
    ["Token", `${sale.name} ${sale.symbol}`],
    ["Rate", `${eth(sale.presaleRate)} per 1 cCHT`],
    ["Listing rate", `${eth(sale.listingRate)} per 1 cCHT`],
    ["Soft cap", eth(sale.softCap)],
    ["Hard cap", eth(sale.hardCap)],
    ["Min", eth(sale.minContribution)],
    ["Max", eth(sale.maxContribution)],
    ["Liquidity", `${Number(sale.liquidityBps) / 100}%`],
    ["Window", `${when(sale.start)} – ${when(sale.end)}`],
    ["Confidential token", short(sale.saleToken)],
    ["Sale", short(sale.address)],
  ];

  return (
    <section className="page" style={{ maxWidth: "none" }}>
      <Link href="/sales" className="back">Sales</Link>
      <div className="board-head">
        <div>
          <h1>{sale.name} <span style={{ color: "#888" }}>{sale.symbol}</span></h1>
          <p className="hint">Payment is cCHT. Raised stays hidden until finalize.</p>
        </div>
        <span className={`pill ${status}`}>{status}</span>
      </div>
      <div className="split">
        <dl className="sheet">
          {rows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd className="mono">{value}</dd></div>
          ))}
        </dl>
        <div className="stack">
          <div className="box"><BuyPanel sale={sale} /></div>
          <div className="box"><SettlePanel sale={sale} onDone={reload} /></div>
        </div>
      </div>
    </section>
  );
}
