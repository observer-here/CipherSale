"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SaleBoard } from "@/components/sale/sale-board";
import { CardBones } from "@/components/sale/sale-card";
import { useSales } from "@/components/sale/use-sales";

function Explore() {
  const { slots, state } = useSales();
  const query = useSearchParams().get("q") ?? "";
  return (
    <div className="page explore" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <h1>Sales</h1>
      </div>
      <SaleBoard slots={slots} state={state} query={query} />
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="page explore" style={{ maxWidth: "none" }}><div className="page-head"><h1>Sales</h1></div><CardBones count={6} /></div>}>
      <Explore />
    </Suspense>
  );
}
