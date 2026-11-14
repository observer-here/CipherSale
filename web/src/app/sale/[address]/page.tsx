"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Actions } from "@/components/sale/actions";
import { BuyPanel } from "@/components/sale/buy-panel";
import { Contribution } from "@/components/sale/contribution";
import { Countdown } from "@/components/sale/countdown";
import { Copy } from "@/components/ui/copy";
import { reader } from "@/lib/chain";
import { eth, short, units, usd, when } from "@/lib/format";
import { isLink } from "@/lib/meta";
import { loadSale, saleStatus } from "@/lib/read";
import type { SaleView } from "@/types/sale";

const LINKS = [["website", "Website"], ["telegram", "Telegram"], ["twitter", "X"]] as const;

function Address({ value }: { value: string }) {
  return <span className="mono">{short(value, 10, 8)}<Copy text={value} /></span>;
}

export default function SalePage() {
  const params = useParams<{ address: string }>();
  const [sale, setSale] = useState<SaleView>();
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  const reload = useCallback(() => {
    loadSale(reader, params.address).then(setSale).catch(() => setError("This address is not a sale"));
  }, [params.address]);

  useEffect(reload, [reload]);
  useEffect(() => {
    const tick = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  if (!sale) return <p className="hint">{error || "Loading"}</p>;

  const status = saleStatus(sale, now);
  const symbol = sale.symbol;
  const links = LINKS.filter(([key]) => isLink(sale.meta[key]));
  const tokenRows: [string, React.ReactNode][] = [
    ["Address", <Address key="a" value={sale.token} />],
    ["Name", sale.name],
    ["Symbol", symbol],
    ["Decimals", String(sale.decimals)],
    ["Total supply", `${eth(sale.totalSupply, sale.decimals)} ${symbol}`],
  ];
  const saleRows: [string, React.ReactNode][] = [
    ["Sale address", <Address key="s" value={sale.address} />],
    ["Tokens for sale", `${eth(sale.tokenPresale)} ${symbol}`],
    ["Price", usd(sale.presaleRate)],
    ["Soft cap", `${eth(sale.softCap)} cUSDT`],
    ["Hard cap", `${eth(sale.hardCap)} cUSDT`],
    ["Contribution", `${eth(sale.minContribution)} to ${eth(sale.maxContribution)} cUSDT`],
    ["Start time", when(sale.start)],
    ["End time", when(sale.end)],
    ["Buyer gate", sale.meta.gate || "Spotify account ownership"],
    ["Verified buyers", String(sale.buyers)],
  ];
  const raisedPct = sale.hardCap > 0n ? Number((sale.totalRaised * 10000n) / sale.hardCap) / 100 : 0;
  const clock = status === "upcoming" ? ["Starts in", sale.start] : status === "live" ? ["Ends in", sale.end] : null;

  return (
    <section className="page" style={{ maxWidth: "none" }}>
      <Link href="/sales" className="back">Sales</Link>
      <div className="sale-head">
        <span className="avatar">{symbol.slice(0, 1) || "S"}</span>
        <div>
          <h1>{sale.name} <span>{symbol}</span></h1>
          <div className="tags">
            <span>zkTLS</span>
            <span>cUSDT</span>
            {links.map(([key, label]) => <a key={key} href={sale.meta[key]} target="_blank" rel="noreferrer noopener"><span>{label}</span></a>)}
          </div>
        </div>
        <span className={`pill ${status}`}>{status}</span>
      </div>
      <div className="sale">
        <div className="stack">
          {sale.meta.description ? <div className="box"><h2>About</h2><p className="about">{sale.meta.description}</p></div> : null}
          <div className="box">
            <h2>Token details</h2>
            <dl className="sheet">{tokenRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </div>
          <div className="box">
            <h2>Sale terms</h2>
            <dl className="sheet">{saleRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          </div>
        </div>
        <div className="stack">
          <div className="box">
            {clock ? <><p className="hint">{clock[0]}</p><Countdown left={Number(clock[1]) - now} /></> : null}
            <dl className="sheet">
              <div><dt>Raised</dt><dd className="mono">{sale.state === 3 || sale.state === 4 ? `${units(sale.totalRaised)} cUSDT (${raisedPct}%)` : "Hidden until finalize"}</dd></div>
            </dl>
            <BuyPanel sale={sale} onDone={reload} />
          </div>
          <Contribution sale={sale} />
          <Actions sale={sale} onDone={reload} />
        </div>
      </div>
    </section>
  );
}
