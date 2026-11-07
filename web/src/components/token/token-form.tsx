"use client";

import { Contract } from "ethers";
import Link from "next/link";
import { useState } from "react";
import { tokenFactoryAbi } from "@/abi/token-factory";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useWallet } from "@/hooks/wallet";
import { ADDR } from "@/lib/chain";
import { parseEth, short, txError } from "@/lib/format";

function supplyText(value: string) {
  try {
    return parseEth(value) > 0n ? value.trim() : "0";
  } catch {
    return "0";
  }
}

export function TokenForm() {
  const { provider } = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000");
  const [token, setToken] = useState("");
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const mark = (symbol.trim() || "?").slice(0, 1).toUpperCase();

  async function submit() {
    if (!provider) return setNote("Connect a wallet");
    setBusy(true);
    setNote("");
    setBad(false);
    setToken("");
    try {
      if (!name.trim() || !symbol.trim() || parseEth(supply) <= 0n) return setNote("Enter a name, symbol, and supply");
      const signer = await provider.getSigner();
      const factory = new Contract(ADDR.tokenFactory, tokenFactoryAbi, signer);
      const tx = await factory.createToken(name.trim(), symbol.trim(), parseEth(supply));
      const receipt = await tx.wait();
      const parsed = receipt.logs
        .map((log: { topics: string[]; data: string }) => {
          try { return factory.interface.parseLog(log); } catch { return null; }
        })
        .find((item: { name?: string } | null) => item?.name === "TokenCreated");
      const address = parsed ? String(parsed.args.token) : "";
      setToken(address);
      setNote(address ? "Token deployed" : "Token created");
    } catch (err) {
      setBad(true);
      setNote(txError(err, "Deploy failed"));
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, string][] = [
    ["Total supply", supplyText(supply)],
    ["Decimals", "18"],
    ["Standard", "BEP-20"],
    ["Network", "BNB testnet"],
  ];

  return (
    <div className="split">
      <form className="form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Symbol" value={symbol} onChange={setSymbol} />
        <div className="wide"><Field label="Total supply" value={supply} onChange={setSupply} /></div>
        <p className="hint">This is a normal BEP-20. The full supply is minted to the connected wallet. A sale locks part of it later.</p>
        <Button disabled={busy} type="submit">{busy ? "Deploying" : "Deploy token"}</Button>
        {note ? <p className={bad ? "note bad" : "note"}>{note}</p> : null}
        {token ? <p className="mono">{short(token)} · <Link href="/create-sale">Create a sale</Link></p> : null}
      </form>
      <div className="box">
        <h2>Preview</h2>
        <div className="who">
          <span className="avatar">{mark}</span>
          <div>
            <b>{name.trim() || "Token name"}</b>
            <p className="hint">{symbol.trim() || "SYMBOL"}</p>
          </div>
        </div>
        <dl className="sheet">
          {rows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd className="mono">{value}</dd></div>
          ))}
          {token ? <div><dt>Address</dt><dd className="mono">{short(token)}</dd></div> : null}
        </dl>
      </div>
    </div>
  );
}
