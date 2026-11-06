"use client";

import { id, JsonRpcProvider } from "ethers";
import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/wallet";
import { RPC } from "@/lib/chain";
import { listSales } from "@/lib/read";
import type { SaleView } from "@/types/sale";

export function useSales() {
  const { provider } = useWallet();
  const [sales, setSales] = useState<SaleView[]>([]);
  const [proofs, setProofs] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const reader = provider ?? new JsonRpcProvider(RPC);
    let stop = false;
    listSales(reader)
      .then(async (rows) => {
        if (stop) return;
        setSales(rows);
        setState("ready");
        if (!rows.length) {
          setProofs(0);
          return;
        }
        const topic = id("Eligible(address)");
        const batches = await Promise.all(rows.map((sale) => reader.getLogs({
          address: sale.address,
          fromBlock: 0,
          toBlock: "latest",
          topics: [topic],
        }).catch(() => [])));
        if (stop) return;
        const buyers = new Set<string>();
        for (const logs of batches) for (const log of logs) if (log.topics[1]) buyers.add(log.topics[1].toLowerCase());
        setProofs(buyers.size);
      })
      .catch(() => {
        if (!stop) setState("error");
      });
    return () => { stop = true; };
  }, [provider]);

  return { sales, proofs, state };
}
