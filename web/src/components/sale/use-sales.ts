"use client";

import { JsonRpcProvider } from "ethers";
import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/wallet";
import { RPC } from "@/lib/chain";
import { listSales } from "@/lib/read";
import type { SaleView } from "@/types/sale";

export function useSales() {
  const { provider } = useWallet();
  const [sales, setSales] = useState<SaleView[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const reader = provider ?? new JsonRpcProvider(RPC);
    let stop = false;
    listSales(reader)
      .then((rows) => {
        if (stop) return;
        setSales(rows);
        setState("ready");
      })
      .catch(() => {
        if (!stop) setState("error");
      });
    return () => { stop = true; };
  }, [provider]);

  return { sales, state };
}
