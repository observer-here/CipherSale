"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { tokenFactoryAbi } from "@/abi/token-factory";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useWallet } from "@/hooks/wallet";
import { ADDR } from "@/lib/chain";
import { parseEth, txError } from "@/lib/format";

export function TokenForm() {
  const { provider } = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!provider) return setNote("Connect a wallet");
    setBusy(true);
    setNote("");
    try {
      if (!name.trim() || !symbol.trim() || parseEth(supply) <= 0n) return setNote("Enter a name, symbol, and supply");
      const signer = await provider.getSigner();
      const factory = new Contract(ADDR.tokenFactory, tokenFactoryAbi, signer);
      const tx = await factory.createToken(name, symbol, parseEth(supply));
      const receipt = await tx.wait();
      const parsed = receipt.logs
        .map((log: { topics: string[]; data: string }) => {
          try { return factory.interface.parseLog(log); } catch { return null; }
        })
        .find((item: { name?: string } | null) => item?.name === "TokenCreated");
      setNote(parsed ? `Token ${parsed.args.token}` : "Token created");
    } catch (err) {
      setNote(txError(err, "Create failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <Field label="Name" value={name} onChange={setName} />
      <Field label="Symbol" value={symbol} onChange={setSymbol} />
      <Field label="Supply" value={supply} onChange={setSupply} />
      <Button disabled={busy} type="submit">{busy ? "Creating" : "Create token"}</Button>
      {note ? <p className="note mono">{note}</p> : null}
    </form>
  );
}
