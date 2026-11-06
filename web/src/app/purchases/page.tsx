"use client";

import { Contract } from "ethers";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { SaleCard } from "@/components/sale/sale-card";
import { useSales } from "@/components/sale/use-sales";
import { useWallet } from "@/hooks/wallet";
import type { SaleView } from "@/types/sale";

export default function PurchasesPage() {
  const { sales, state } = useSales();
  const { account, provider, connect } = useWallet();
  const [mine, setMine] = useState<SaleView[]>([]);

  useEffect(() => {
    if (!account || !provider || !sales.length) {
      setMine([]);
      return;
    }
    let stop = false;
    Promise.all(sales.map(async (sale) => {
      if (sale.owner.toLowerCase() === account.toLowerCase()) return sale;
      const eligible = await new Contract(sale.address, cipherSaleAbi, provider).eligible(account);
      return eligible ? sale : null;
    })).then((rows) => {
      if (!stop) setMine(rows.filter((sale): sale is SaleView => sale !== null));
    }).catch(() => {
      if (!stop) setMine([]);
    });
    return () => { stop = true; };
  }, [account, provider, sales]);

  return (
    <section className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <div>
          <p className="kicker">WALLET</p>
          <h1>My purchases</h1>
          <p className="lede">Sales you created, or where this wallet was marked eligible. Contribution sizes stay encrypted.</p>
        </div>
      </div>
      {!account ? <button className="btn" onClick={connect}>Connect</button> : null}
      {account && state === "ready" && !mine.length ? <p className="hint">No sales for this wallet yet.</p> : null}
      <div className="cards">
        {mine.map((sale) => <SaleCard key={sale.address} sale={sale} />)}
      </div>
      {mine.length ? <Link href="/sales" className="hint">Browse all sales</Link> : null}
    </section>
  );
}
