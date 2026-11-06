"use client";

import { JsonRpcProvider } from "ethers";
import Link from "next/link";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const reader = provider ?? new JsonRpcProvider(RPC);
    loadSale(reader, params.address).then(setSale).catch(() => setError("This address is not a sale"));
  }, [provider, params.address]);

  if (!sale) return <p className="px-6 py-10 text-sm">{error || "Loading"}</p>;

  const rows: [string, string][] = [
    ["Status", saleStatus(sale)],
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
    <section className="px-6 py-10">
      <Link href="/" className="text-xs tracking-wide text-white/50">Sales</Link>
      <h1 className="mt-3 text-3xl font-normal">{sale.name} <span className="text-white/45">{sale.symbol}</span></h1>
      <p className="mt-2 text-sm text-white/60">{saleStatus(sale)} · payment is cCHT · raised is hidden</p>
      <div className="mt-8 grid gap-12 lg:grid-cols-2">
      <dl className="grid content-start gap-0 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[9rem_1fr] border-b border-white/10 py-2">
            <dt className="text-white/50">{label}</dt>
            <dd className="mono">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid content-start gap-8">
        <BuyPanel sale={sale} />
        <SettlePanel sale={sale} />
      </div>
      </div>
    </section>
  );
}
