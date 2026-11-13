"use client";

// Four-step sale form. Preview numbers are the same terms the factory locks in.
import { Contract, isAddress } from "ethers";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bep20Abi } from "@/abi/cipher-sale";
import { saleFactoryAbi } from "@/abi/sale-factory";
import { tokenFactoryAbi } from "@/abi/token-factory";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon, Spotify, paths } from "@/components/ui/icon";
import { clearSales } from "@/components/sale/use-sales";
import { useWallet } from "@/hooks/wallet";
import { ADDR, reader } from "@/lib/chain";
import { eth, parseEth, txError } from "@/lib/format";
import { isLink, stringifyMeta, type SaleMeta } from "@/lib/meta";
import { GATES } from "@/primus/gates";
import type { SaleTerms } from "@/types/sale";

const STEPS = [
  ["Details", "Sale Details"],
  ["Pricing", "Token & Pricing"],
  ["Access", "Access & Verification"],
  ["Review", "Review & Create"],
] as const;
const NEXT = ["Continue to Pricing", "Continue to Access", "Continue to Review"] as const;
const ONE = 10n ** 18n;
const info = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8h.01";

function localInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function commas(value: string) {
  const [whole, frac] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${grouped}.${frac}` : grouped;
}

function pretty(value: bigint) {
  return commas(eth(value));
}

function when(unix: number) {
  const date = new Date(unix * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hour = date.getHours();
  return `${months[date.getMonth()]} ${date.getDate()}, ${hour % 12 || 12}:${pad(date.getMinutes())} ${hour >= 12 ? "PM" : "AM"}`;
}

function ahead(unix: number) {
  const left = unix - Math.floor(Date.now() / 1000);
  if (left <= 0) return "Window open";
  const days = Math.floor(left / 86400);
  const hours = Math.floor((left % 86400) / 3600);
  const minutes = Math.floor((left % 3600) / 60);
  if (days) return `Starts in ${days}d ${hours}h`;
  if (hours) return `Starts in ${hours}h ${minutes}m`;
  return `Starts in ${minutes || 1}m`;
}

function Mark({ d }: { d: string }) {
  return <span className="mark"><Icon d={d} size={18} /></span>;
}

function Rows({ items }: { items: [string, string, string][] }) {
  return (
    <dl className="prows">
      {items.map(([icon, label, value]) => (
        <div key={label}>
          <dt><Icon d={icon} size={15} />{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

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
}): { opts: SaleTerms; listingPay: bigint } | { error: string } {
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
  if (!Number.isFinite(liquidityPct) || liquidityPct < 50 || liquidityPct > 100) return { error: "Liquidity percent must be from 50 to 100" };
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
  const [step, setStep] = useState(0);
  const [token, setToken] = useState("");
  const [about, setAbout] = useState<SaleMeta>({ description: "", website: "", telegram: "", twitter: "", gate: "" });
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
  const [reading, setReading] = useState(false);
  const [missing, setMissing] = useState(false);
  const [sale, setSale] = useState("");
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);
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
    if (!isAddress(address)) {
      setMeta(null);
      setReading(false);
      setMissing(false);
      return;
    }
    let stop = false;
    setMissing(false);
    setReading(true);
    const erc20 = new Contract(address, bep20Abi, reader);
    Promise.all([
      erc20.name(),
      erc20.symbol(),
      account ? erc20.balanceOf(account) : Promise.resolve(0n),
    ]).then(([name, symbol, balance]) => {
      if (!stop) setMeta({ name: String(name), symbol: String(symbol), balance });
    }).catch(() => { if (!stop) { setMeta(null); setMissing(true); } }).finally(() => { if (!stop) setReading(false); });
    return () => { stop = true; };
  }, [token, account]);

  const built = buildOpts({ rate, listing, soft, hard, min, max, liquidity, start, end });
  const badLink = (["website", "telegram", "twitter"] as const).some((key) => about[key].trim() && !isLink(about[key].trim()));
  const problem = "error" in built ? built.error : badLink ? "Links must start with https://" : "";
  const chosen = GATES[0];
  const symbol = meta?.symbol || "tokens";
  const ok = "opts" in built ? built : null;

  function stepIssue(n: number) {
    if (n === 0) {
      if (!token.trim()) return "Enter the project token address";
      if (!isAddress(token.trim())) return "That is not a token address";
      if (!meta) return missing && !reading ? "That address is not a token yet" : "Reading the token";
      if (badLink) return "Links must start with https://";
      if ("error" in built && /start/i.test(built.error)) return built.error;
      return "";
    }
    if (n === 1) return "error" in built ? built.error : "";
    return "";
  }

  function go(next: number) {
    if (next > step) {
      for (let i = step; i < next; i++) {
        const issue = stepIssue(i);
        if (!issue) continue;
        setBad(true);
        setNote(issue);
        return;
      }
    }
    setNote("");
    setBad(false);
    setStep(next);
  }

  async function submit() {
    if (step !== 3) return;
    if (!provider) { setBad(true); return setNote("Connect a wallet"); }
    if (!isAddress(token.trim())) { setBad(true); return setNote("Enter the project token address"); }
    if (problem || !ok) { setBad(true); return setNote(problem || "Check the sale terms"); }
    setBusy(true);
    setBad(false);
    setNote("");
    setSale("");
    try {
      const signer = await provider.getSigner();
      const me = await signer.getAddress();
      const need = ok.opts.tokenPresale + ok.opts.tokenLiquidity;
      const erc20 = new Contract(token.trim(), bep20Abi, signer);
      const balance = await erc20.balanceOf(me);
      if (balance < need) {
        setBad(true);
        return setNote(`This sale needs ${eth(need)} tokens. This wallet holds ${eth(balance)}.`);
      }
      const allowance = await erc20.allowance(me, ADDR.saleFactory);
      if (allowance < need) {
        setNote("Approving tokens");
        await (await erc20.approve(ADDR.saleFactory, need)).wait();
      }
      const factory = new Contract(ADDR.saleFactory, saleFactoryAbi, signer);
      const tx = await factory.createSale(token.trim(), chosen.condition, stringifyMeta({ ...about, gate: chosen.label }), ok.opts);
      const receipt = await tx.wait();
      const parsed = receipt.logs
        .map((log: { topics: string[]; data: string }) => {
          try { return factory.interface.parseLog(log); } catch { return null; }
        })
        .find((item: { name?: string } | null) => item?.name === "SaleCreated");
      clearSales();
      const address = parsed ? String(parsed.args.sale) : "";
      setSale(address);
      setNote(address ? "Sale created" : "Sale created, but the receipt had no sale address");
    } catch (err) {
      setBad(true);
      setNote(txError(err, "Create failed"));
    } finally {
      setBusy(false);
    }
  }

  const need = ok ? ok.opts.tokenPresale + ok.opts.tokenLiquidity : 0n;
  const warn = ok && meta && account && meta.balance < need
    ? `This wallet holds ${pretty(meta.balance)} ${symbol}. The sale needs ${pretty(need)}.`
    : "";
  const preview: [string, string, string][] = ok ? [
    [paths.layers, "Token", meta ? `${meta.name} · ${symbol}` : "Not set"],
    [paths.coin, "Price", `${pretty(ok.opts.presaleRate)} ${symbol} / cCHT`],
    [paths.coin, "Caps", `${pretty(ok.opts.softCap)} – ${pretty(ok.opts.hardCap)} cCHT`],
    [paths.wallet, "Contribution", `${pretty(ok.opts.minContribution)} – ${pretty(ok.opts.maxContribution)} cCHT`],
    [paths.layers, "Liquidity", `${liquidity}% · ${pretty(ok.listingPay)} cCHT`],
    [paths.shield, "Verification", chosen.label],
    [paths.wallet, "Window", `${when(ok.opts.start)} – ${when(ok.opts.end)}`],
    [paths.wallet, "You deposit", `${pretty(need)} ${symbol}`],
  ] : [];

  const summary: [string, string][] = ok ? [
    ["Token", symbol],
    ["Project", meta?.name || "—"],
    ["Price", `${pretty(ok.opts.presaleRate)} ${symbol} per cCHT`],
    ["Listing", `${pretty(ok.opts.listingRate)} ${symbol} per cCHT`],
    ["Soft cap", `${pretty(ok.opts.softCap)} cCHT`],
    ["Hard cap", `${pretty(ok.opts.hardCap)} cCHT`],
    ["Contribution", `${pretty(ok.opts.minContribution)} – ${pretty(ok.opts.maxContribution)} cCHT`],
    ["Buyer verification", chosen.label],
    ["Liquidity at hard cap", `${pretty(ok.listingPay)} cCHT`],
    ["Buyer allocation", `${pretty(ok.opts.tokenPresale)} ${symbol}`],
    ["Listing allocation", `${pretty(ok.opts.tokenLiquidity)} ${symbol}`],
    ["You deposit", `${pretty(ok.opts.tokenPresale + ok.opts.tokenLiquidity)} ${symbol}`],
    ["Start", when(ok.opts.start)],
    ["End", when(ok.opts.end)],
  ] : [];

  const actions = (
    <>
      {note ? <p className={bad ? "note bad" : "note"}>{note}</p> : null}
      <div className="wizard-nav">
        {step > 0 ? <button className="btn btn-ghost" type="button" onClick={() => go(step - 1)}>Back</button> : null}
        {sale ? <Link className="btn" href={`/sale/${sale}`}>Open sale</Link> : step < 3 ? (
          <button className="btn" type="button" onClick={() => go(step + 1)}>{NEXT[step]}</button>
        ) : (
          <Button disabled={busy || !!problem} type="submit">{busy ? "Creating" : "Create Sale"}</Button>
        )}
      </div>
    </>
  );

  return (
    <form className="wizard" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <header className="wizard-head">
        <p className="kicker"><i />Create a token sale</p>
        <h1>Create a Token Sale</h1>
        <p className="deck">Launch a private token sale with zkTLS verification and confidential payments.</p>
      </header>
      <nav className="wizard-steps" aria-label="Create sale steps">
        {STEPS.map(([short, title], n) => (
          <button key={short} type="button" title={title} className={n === step ? "on" : n < step ? "done" : ""} aria-current={n === step ? "step" : undefined} onClick={() => go(n)}>
            <b>{n + 1}</b>{short}
          </button>
        ))}
      </nav>

      {step === 0 ? (
        <div className="wizard-grid">
          <div className="box">
            <div className="panel-h">
              <Mark d={paths.layers} />
              <div>
                <h2>Sale Details</h2>
                <p>Choose the token, describe the sale, and set the window.</p>
              </div>
            </div>
            <div className="form">
              <h2>Token</h2>
              {mine.length ? (
                <div className="row wide">
                  {mine.map((item) => (
                    <button className={token === item.address ? "btn" : "btn btn-ghost"} key={item.address} type="button" onClick={() => setToken(item.address)}>{item.symbol}</button>
                  ))}
                </div>
              ) : meta ? null : (
                <p className="hint">{account ? "No tokens from this wallet yet. " : "Paste a token address, or "}<Link href="/create-token">launch a token</Link></p>
              )}
              <div className="wide"><Field label="Project token address" value={token} onChange={setToken} /></div>
              {meta ? <p className="hint">{meta.name} · {symbol}{account ? ` · ${pretty(meta.balance)} in this wallet` : ""}</p> : null}
              <h2>About</h2>
              <div className="wide"><Field multiline label="Description" value={about.description} onChange={(description) => setAbout({ ...about, description })} /></div>
              <div className="links wide">
                <Field label="Website" value={about.website} onChange={(website) => setAbout({ ...about, website })} />
                <Field label="Telegram" value={about.telegram} onChange={(telegram) => setAbout({ ...about, telegram })} />
                <Field label="X" value={about.twitter} onChange={(twitter) => setAbout({ ...about, twitter })} />
              </div>
              <h2>Schedule</h2>
              <Field label="Start" type="datetime-local" value={start} onChange={setStart} />
              <Field label="End" type="datetime-local" value={end} onChange={setEnd} />
            </div>
          </div>
          <div className="side-col">
            <Preview rows={preview} warn={warn} />
            {actions}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="wizard-grid">
          <div className="box">
            <div className="panel-h">
              <Mark d={paths.coin} />
              <div>
                <h2>Token & Pricing</h2>
                <p>Set the token price, listing ratio, and sale configuration.</p>
              </div>
            </div>
            <div className="form">
              <h2>Pricing</h2>
              <Field label="Tokens per 1 cCHT" value={rate} onChange={setRate} />
              <Field label="Listing tokens per 1 cCHT" value={listing} onChange={setListing} />
              <h2>Sale limits</h2>
              <Field label="Soft cap (cCHT)" value={soft} onChange={setSoft} />
              <Field label="Hard cap (cCHT)" value={hard} onChange={setHard} />
              <Field label="Min contribution (cCHT)" value={min} onChange={setMin} />
              <Field label="Max contribution (cCHT)" value={max} onChange={setMax} />
              <h2>Liquidity</h2>
              <Field label="Liquidity percent (50–100)" value={liquidity} onChange={setLiquidity} />
            </div>
          </div>
          <div className="side-col">
            <Preview rows={preview} warn={warn} />
            {actions}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-grid">
          <div className="box">
            <div className="panel-h">
              <Mark d={paths.shield} />
              <div>
                <h2>Access & Verification</h2>
                <p>Buyers prove this once, then pay an encrypted cCHT amount.</p>
              </div>
            </div>
            <h3 className="block-title">Buyer verification</h3>
            <div className="pick">
              <Spotify size={18} className="spotify" />
              <span>{chosen.label}</span>
            </div>
          </div>
          <div className="side-col">
            <Preview rows={preview} warn={warn} />
            {actions}
          </div>
        </div>
      ) : null}

      {step === 3 && ok ? (
        <div className="wizard-grid">
          <div className="box">
            <div className="panel-h">
              <Mark d={paths.layers} />
              <div>
                <h2>Sale summary</h2>
                <p>These terms are locked when you create the sale.</p>
              </div>
            </div>
            <dl className="prows">
              {summary.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </div>
          <div className="side-col">
            <div className="buyer">
              <h2 className="side-title">Buyer view</h2>
              <p className="hint">The card on Explore Sales.</p>
              <BuyerCard
                name={meta?.name || "Your project"}
                symbol={meta?.symbol || "—"}
                about={about.description.trim()}
                price={pretty(ok.opts.presaleRate)}
                allocation={pretty(ok.opts.tokenPresale)}
                liquidity={liquidity}
                start={ok.opts.start}
              />
            </div>
            {actions}
          </div>
        </div>
      ) : null}
    </form>
  );
}

function Preview({ rows, warn }: { rows: [string, string, string][]; warn: string }) {
  return (
    <div className="box accent">
      <div className="panel-h">
        <Mark d={paths.layers} />
        <div>
          <h2>Sale terms</h2>
          <p>Locked in when the sale is created.</p>
        </div>
      </div>
      {rows.length ? <Rows items={rows} /> : <p className="hint">Fix the numbers to see the terms.</p>}
      {warn ? <p className="note bad">{warn}</p> : null}
      <p className="callout"><Icon d={info} size={15} />Unsold buyer tokens return at finalize. Listing tokens stay for PancakeSwap.</p>
    </div>
  );
}

function BuyerCard({ name, symbol, about, price, allocation, liquidity, start }: {
  name: string;
  symbol: string;
  about: string;
  price: string;
  allocation: string;
  liquidity: string;
  start: number;
}) {
  return (
    <div className="card still">
      <div className="card-art art-1"><span className="flag">Preview</span></div>
      <div className="card-body">
        <div className="who">
          <span className="avatar">{symbol.slice(0, 1) || "?"}</span>
          <div>
            <h3>{name}</h3>
            <p>{symbol}</p>
          </div>
        </div>
        {about ? <p className="blurb">{about}</p> : null}
        <div className="tags">
          <span>zkTLS</span>
          <span>cCHT</span>
          <span>{liquidity}% liquidity</span>
        </div>
        <p className="starts">{ahead(start)}</p>
        <div className="metrics">
          <div><b>{price}</b><span>Per cCHT</span></div>
          <div><b>{allocation}</b><span>Allocation</span></div>
          <div><b>Private</b><span>Raised</span></div>
        </div>
      </div>
    </div>
  );
}
