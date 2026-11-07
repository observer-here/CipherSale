"use client";

import { Contract, isAddress } from "ethers";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bep20Abi } from "@/abi/cipher-sale";
import { saleFactoryAbi } from "@/abi/sale-factory";
import { tokenFactoryAbi } from "@/abi/token-factory";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { clearSales } from "@/components/sale/use-sales";
import { useWallet } from "@/hooks/wallet";
import { ADDR, reader } from "@/lib/chain";
import { eth, parseEth, txError } from "@/lib/format";

const ONE = 10n ** 18n;

function localInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Opts = {
  tokenPresale: bigint;
  tokenLiquidity: bigint;
  liquidityBps: bigint;
  softCap: bigint;
  hardCap: bigint;
  minContribution: bigint;
  maxContribution: bigint;
  presaleRate: bigint;
  listingRate: bigint;
  start: number;
  end: number;
};

function buildOpts(input: {
  rate: string;
  listing: string;
  soft: string;
  hard: string;
  min: string;
  max: string;
  liquidity: string;
  start: string;
  end: string;
}): { opts: Opts; listingPay: bigint } | { error: string } {
  let hardCap: bigint;
  let softCap: bigint;
  let minContribution: bigint;
  let maxContribution: bigint;
  let presaleRate: bigint;
  let listingRate: bigint;
  try {
    hardCap = parseEth(input.hard);
    softCap = parseEth(input.soft);
    minContribution = parseEth(input.min);
    maxContribution = parseEth(input.max);
    presaleRate = parseEth(input.rate);
    listingRate = parseEth(input.listing);
  } catch {
    return { error: "Rates and caps must be numbers" };
  }
  const liquidityPct = Number(input.liquidity);
  if (!Number.isFinite(liquidityPct) || liquidityPct < 0 || liquidityPct > 100) return { error: "Liquidity percent must be from 0 to 100" };
  const liquidityBps = BigInt(Math.round(liquidityPct * 100));
  if (softCap <= 0n || softCap > hardCap) return { error: "Soft cap must be above 0 and at most the hard cap" };
  if (minContribution <= 0n || minContribution > maxContribution || maxContribution > hardCap) {
    return { error: "Min must be above 0, at most the max, and the max at most the hard cap" };
  }
  if (presaleRate <= 0n) return { error: "Presale rate must be above 0" };
  const start = Math.floor(new Date(input.start).getTime() / 1000);
  const end = Math.floor(new Date(input.end).getTime() / 1000);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return { error: "Start must be before the end" };
  const listingPay = (hardCap * liquidityBps) / 10000n;
  if (listingPay > 0n && listingRate <= 0n) return { error: "Listing rate must be above 0 when liquidity is set" };
  return {
    listingPay,
    opts: {
      tokenPresale: (hardCap * presaleRate) / ONE,
      tokenLiquidity: listingPay === 0n ? 0n : (listingPay * listingRate) / ONE,
      liquidityBps,
      softCap,
      hardCap,
      minContribution,
      maxContribution,
      presaleRate,
      listingRate: listingPay === 0n ? 0n : listingRate,
      start,
      end,
    },
  };
}

export function SaleForm() {
  const { account, provider } = useWallet();
  const [token, setToken] = useState("");
  const [condition, setCondition] = useState("spotify:account");
  const [rate, setRate] = useState("1000");
  const [listing, setListing] = useState("800");
  const [soft, setSoft] = useState("10");
  const [hard, setHard] = useState("100");
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("20");
  const [liquidity, setLiquidity] = useState("50");
  const [start, setStart] = useState(() => localInput(new Date(Date.now() + 60_000)));
  const [end, setEnd] = useState(() => localInput(new Date(Date.now() + 7 * 86_400_000)));
  const [mine, setMine] = useState<{ address: string; symbol: string }[]>([]);
  const [meta, setMeta] = useState<{ name: string; symbol: string; balance: bigint } | null>(null);
  const [sale, setSale] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!account || !ADDR.tokenFactory) return setMine([]);
    let stop = false;
    const factory = new Contract(ADDR.tokenFactory, tokenFactoryAbi, reader);
    factory.getTokensByCreator(account).then(async (list: string[]) => {
      const rows = await Promise.all(list.map(async (address) => {
        const symbol = await new Contract(address, bep20Abi, reader).symbol().catch(() => "Token");
        return { address, symbol: String(symbol) };
      }));
      if (!stop) setMine(rows);
    }).catch(() => { if (!stop) setMine([]); });
    return () => { stop = true; };
  }, [account]);

  useEffect(() => {
    const address = token.trim();
    if (!isAddress(address)) return setMeta(null);
    let stop = false;
    const erc20 = new Contract(address, bep20Abi, reader);
    Promise.all([
      erc20.name(),
      erc20.symbol(),
      account ? erc20.balanceOf(account) : Promise.resolve(0n),
    ]).then(([name, symbol, balance]) => {
      if (!stop) setMeta({ name: String(name), symbol: String(symbol), balance });
    }).catch(() => { if (!stop) setMeta(null); });
    return () => { stop = true; };
  }, [token, account]);

  const built = buildOpts({ rate, listing, soft, hard, min, max, liquidity, start, end });
  const problem = "error" in built ? built.error : !condition.trim() ? "Enter the Spotify proof condition" : "";

  async function submit() {
    if (!provider) return setNote("Connect a wallet");
    if (!isAddress(token.trim())) return setNote("Enter the project token address");
    if (problem || !("opts" in built)) return setNote(problem || "Check the sale terms");
    setBusy(true);
    setNote("");
    setSale("");
    try {
      const signer = await provider.getSigner();
      const me = await signer.getAddress();
      const need = built.opts.tokenPresale + built.opts.tokenLiquidity;
      const erc20 = new Contract(token.trim(), bep20Abi, signer);
      const balance = await erc20.balanceOf(me);
      if (balance < need) return setNote(`This sale needs ${eth(need)} tokens. This wallet holds ${eth(balance)}.`);
      const allowance = await erc20.allowance(me, ADDR.saleFactory);
      if (allowance < need) {
        setNote("Approving tokens");
        await (await erc20.approve(ADDR.saleFactory, need)).wait();
      }
      const factory = new Contract(ADDR.saleFactory, saleFactoryAbi, signer);
      const tx = await factory.createSale(token.trim(), condition.trim(), built.opts);
      const receipt = await tx.wait();
      const parsed = receipt.logs
        .map((log: { topics: string[]; data: string }) => {
          try { return factory.interface.parseLog(log); } catch { return null; }
        })
        .find((item: { name?: string } | null) => item?.name === "SaleCreated");
      clearSales();
      const address = parsed ? String(parsed.args.sale) : "";
      setSale(address);
      setNote(address ? `Sale ${address}` : "Sale created");
    } catch (err) {
      setNote(txError(err, "Create failed"));
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, string][] = "opts" in built ? [
    ["Buyer allocation", `${eth(built.opts.tokenPresale)} tokens`],
    ["Listing allocation", `${eth(built.opts.tokenLiquidity)} tokens`],
    ["Factory pulls", `${eth(built.opts.tokenPresale + built.opts.tokenLiquidity)} tokens`],
    ["Wallet balance", meta && account ? `${eth(meta.balance)} ${meta.symbol}` : "Connect a wallet"],
    ["Liquidity at hard cap", `${eth(built.listingPay)} cCHT`],
    ["Spotify condition", condition.trim() || "Missing"],
  ] : [];

  return (
    <form className="form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <p className="kicker">Token</p>
      {mine.length ? (
        <div className="row wide">
          {mine.map((item) => (
            <button className="btn btn-ghost" key={item.address} type="button" onClick={() => setToken(item.address)}>{item.symbol}</button>
          ))}
        </div>
      ) : null}
      <div className="wide"><Field label="Project token address" value={token} onChange={setToken} /></div>
      {meta ? <p className="hint">{meta.name} · {meta.symbol}{account ? ` · ${eth(meta.balance)} in this wallet` : ""}</p> : null}

      <p className="kicker">Rate</p>
      <Field label="Tokens per 1 cCHT" value={rate} onChange={setRate} />
      <Field label="Listing tokens per 1 cCHT" value={listing} onChange={setListing} />

      <p className="kicker">Caps</p>
      <Field label="Soft cap, cCHT" value={soft} onChange={setSoft} />
      <Field label="Hard cap, cCHT" value={hard} onChange={setHard} />
      <Field label="Min contribution, cCHT" value={min} onChange={setMin} />
      <Field label="Max contribution, cCHT" value={max} onChange={setMax} />

      <p className="kicker">Liquidity and proof</p>
      <Field label="Liquidity percent" value={liquidity} onChange={setLiquidity} />
      <Field label="Spotify proof condition" value={condition} onChange={setCondition} />

      <p className="kicker">Window</p>
      <Field label="Start" type="datetime-local" value={start} onChange={setStart} />
      <Field label="End" type="datetime-local" value={end} onChange={setEnd} />

      {rows.length ? (
        <dl className="sheet wide">
          {rows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd className="mono">{value}</dd></div>
          ))}
        </dl>
      ) : null}
      <p className="hint">{problem || "Unsold buyer tokens return at finalize. Listing tokens stay for PancakeSwap."}</p>
      <Button disabled={busy || !!problem} type="submit">{busy ? "Creating" : "Create sale"}</Button>
      {note ? <p className="note mono">{note}</p> : null}
      {sale ? <Link href={`/sale/${sale}`}>Open sale</Link> : null}
    </form>
  );
}
