"use client";

import { JsonRpcProvider } from "ethers";
import { useEffect, useState } from "react";
import { SaleCard } from "@/components/sale/sale-card";
import { useWallet } from "@/hooks/wallet";
import { RPC } from "@/lib/chain";
import { listSales } from "@/lib/read";
import type { SaleView } from "@/types/sale";

export function SaleList() {
  const { provider } = useWallet();
  const [sales, setSales] = useState<SaleView[]>([]);
  const [state, setState] = useState("Loading sales");

  useEffect(() => {
    const reader = provider ?? new JsonRpcProvider(RPC);
    listSales(reader)
      .then((rows) => {
        setSales(rows);
        setState(rows.length ? "" : "No sales yet. An institution creates one from Create sale.");
      })
      .catch(() => setState("Could not read the sale factory."));
  }, [provider]);

  return (
    <section className="mt-8">
      <div className="grid grid-cols-[1.5fr_0.7fr_1fr_1.3fr_1.2fr_0.9fr] gap-4 border-y border-white/15 px-6 py-2 text-xs tracking-wide text-white/45">
        <span>Token</span><span>Status</span><span>Rate</span><span>Soft – hard</span><span>Window</span><span>Raised</span>
      </div>
      {state ? <p className="px-6 py-8 text-sm text-white/60">{state}</p> : null}
      {sales.map((sale) => <SaleCard key={sale.address} sale={sale} />)}
    </section>
  );
}
