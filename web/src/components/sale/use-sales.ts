"use client";

import { useEffect, useState } from "react";
import { reader } from "@/lib/chain";
import { listSales } from "@/lib/read";
import type { SaleView } from "@/types/sale";

// A short shared cache, so moving between pages shows sales instantly instead of re-reading the chain.
const FRESH_MS = 20_000;

type Snapshot = { sales: SaleView[]; at: number };
const empty: SaleView[] = [];
let cache: Snapshot | null = null;
let inflight: Promise<Snapshot> | null = null;

export function clearSales() {
  cache = null;
}

export function useSales() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(cache);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cache && Date.now() - cache.at < FRESH_MS) return;
    let stop = false;
    inflight ??= listSales(reader).then((sales) => ({ sales, at: Date.now() })).finally(() => { inflight = null; });
    inflight
      .then((next) => {
        cache = next;
        if (!stop) setSnapshot(next);
      })
      .catch(() => {
        if (!stop) setFailed(true);
      });
    return () => { stop = true; };
  }, []);

  const sales = snapshot?.sales ?? empty;
  const state = snapshot ? "ready" : failed ? "error" : "loading";
  return { sales, proofs: sales.reduce((sum, sale) => sum + sale.buyers, 0), state } as const;
}
