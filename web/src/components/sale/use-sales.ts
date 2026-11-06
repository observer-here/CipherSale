"use client";

import { id, JsonRpcProvider } from "ethers";
import { useEffect, useState } from "react";
import { CHAIN_ID, RPC } from "@/lib/chain";
import { listSales } from "@/lib/read";
import type { SaleView } from "@/types/sale";

// One shared reader and a short cache, so moving between pages shows sales instantly instead of re-reading the chain.
const reader = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
const FRESH_MS = 20_000;

type Snapshot = { sales: SaleView[]; proofs: number; at: number };
let cache: Snapshot | null = null;
let inflight: Promise<Snapshot> | null = null;

async function load(): Promise<Snapshot> {
  const sales = await listSales(reader);
  const topic = id("Eligible(address)");
  const batches = await Promise.all(sales.map((sale) => reader.getLogs({
    address: sale.address,
    fromBlock: 0,
    toBlock: "latest",
    topics: [topic],
  }).catch(() => [])));
  const buyers = new Set<string>();
  for (const logs of batches) for (const log of logs) if (log.topics[1]) buyers.add(log.topics[1].toLowerCase());
  return { sales, proofs: buyers.size, at: Date.now() };
}

export function useSales() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(cache);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cache && Date.now() - cache.at < FRESH_MS) return;
    let stop = false;
    inflight ??= load().finally(() => { inflight = null; });
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

  const state = snapshot ? "ready" : failed ? "error" : "loading";
  return { sales: snapshot?.sales ?? [], proofs: snapshot?.proofs ?? 0, state } as const;
}
