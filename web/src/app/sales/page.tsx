"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SaleBoard } from "@/components/sale/sale-board";
import { useSales } from "@/components/sale/use-sales";

function Explore() {
  const { sales, state } = useSales();
  const query = useSearchParams().get("q") ?? "";
  return (
    <div className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <div>
          <p className="kicker">EXPLORE</p>
          <h1>Sales</h1>
          <p className="lede">Public terms are listed here. The amount raised stays encrypted.</p>
        </div>
      </div>
      <SaleBoard sales={sales} state={state} query={query} />
    </div>
  );
}

export default function SalesPage() {
  return <Suspense fallback={<p className="hint">Loading</p>}><Explore /></Suspense>;
}
