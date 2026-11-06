"use client";

import Link from "next/link";
import { cipher, eth, when } from "@/lib/format";
import { saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

export function SaleCard({ sale }: { sale: SaleView }) {
  const status = saleStatus(sale);
  return (
    <Link href={`/sale/${sale.address}`} className="grid grid-cols-[1.5fr_0.7fr_1fr_1.3fr_1.2fr_0.9fr] gap-4 border-b border-white/10 px-6 py-4 text-sm hover:bg-white/[0.03]">
      <span>
        <span className="block">{sale.name}</span>
        <span className="mono text-xs text-white/45">{sale.symbol}</span>
      </span>
      <span className={status === "live" ? "text-[#9ff6ff]" : "text-white/55"}>{status}</span>
      <span className="mono">{eth(sale.presaleRate)}</span>
      <span className="mono">{eth(sale.softCap)} – {eth(sale.hardCap)}</span>
      <span className="text-xs leading-5 text-white/70">{when(sale.start)}<br />{when(sale.end)}</span>
      <span className="mono text-[#9ff6ff]">{cipher(sale.raised)}</span>
    </Link>
  );
}
