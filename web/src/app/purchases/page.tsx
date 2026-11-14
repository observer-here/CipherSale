"use client";

import { Contract } from "ethers";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { SaleCard } from "@/components/sale/sale-card";
import { useSales } from "@/components/sale/use-sales";
import { useWallet } from "@/hooks/wallet";
import { reader } from "@/lib/chain";
import type { SaleView } from "@/types/sale";

export default function PurchasesPage() {
  const { sales, state } = useSales();
  const { account, connect } = useWallet();
  const [mine, setMine] = useState<SaleView[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!account || state !== "ready" || !sales.length) {
      setMine([]);
      setChecking(false);
      return;
    }
    let stop = false;
    setChecking(true);
    Promise.all(sales.map(async (sale) => {
      const eligible = await new Contract(sale.address, cipherSaleAbi, reader).eligible(account);
      return eligible ? sale : null;
    })).then((rows) => {
      if (!stop) setMine(rows.filter((sale): sale is SaleView => sale !== null));
    }).catch(() => {
      if (!stop) setMine([]);
    }).finally(() => {
      if (!stop) setChecking(false);
    });
    return () => { stop = true; };
  }, [account, sales, state]);

  return (
    <section className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <h1>My purchases</h1>
      </div>
      {!account ? <button className="btn" onClick={connect}>Connect</button> : null}
      {account && (state === "loading" || checking) ? <p className="hint">Loading</p> : null}
      {account && state === "ready" && !checking && !mine.length ? <p className="hint">No sales for this wallet yet.</p> : null}
      <div className="cards">
        {mine.map((sale) => <SaleCard key={sale.address} sale={sale} />)}
      </div>
      {mine.length ? <Link href="/sales" className="hint">Browse all sales</Link> : null}
    </section>
  );
}
