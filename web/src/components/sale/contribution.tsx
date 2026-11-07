"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { cipherSaleAbi } from "@/abi/cipher-sale";
import { useWallet } from "@/hooks/wallet";
import { reader } from "@/lib/chain";
import { eth, txError } from "@/lib/format";
import { decryptHandle } from "@/primus/decrypt";
import { openFhe } from "@/primus/sdk";
import type { SaleView } from "@/types/sale";

export function Contribution({ sale }: { sale: SaleView }) {
  const { account, provider } = useWallet();
  const [data, setData] = useState<{ paid: bigint; tokens: bigint } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (data) return setData(null);
    if (!provider || !account) return setNote("Connect a wallet");
    setBusy(true);
    setNote("");
    try {
      const contract = new Contract(sale.address, cipherSaleAbi, reader);
      const sdk = await openFhe(provider);
      const paid = await decryptHandle(sdk, await contract.contributions(account), sale.address);
      const tokens = await decryptHandle(sdk, await contract.claimable(account), sale.address);
      setData({ paid, tokens });
    } catch (err) {
      setNote(txError(err, "Cannot decrypt"));
    } finally {
      setBusy(false);
    }
  }

  const share = data && sale.hardCap > 0n ? (Number(data.paid * 10000n / sale.hardCap) / 100).toFixed(2) : "0.00";
  return (
    <div className="box">
      <div className="swap-top">
        <h2 style={{ margin: 0 }}>Your contribution</h2>
        <button type="button" className="eye" disabled={busy} onClick={toggle}>{busy ? "Decrypting" : data ? "Hide" : "Show"}</button>
      </div>
      {data ? (
        <dl className="sheet">
          <div><dt>Contributed</dt><dd className="mono">{eth(data.paid)} cCHT</dd></div>
          <div><dt>Claimable</dt><dd className="mono">{eth(data.tokens)} {sale.symbol}</dd></div>
          <div><dt>Share of hard cap</dt><dd className="mono">{share}%</dd></div>
        </dl>
      ) : (
        <p className="hint">Encrypted on chain. Show decrypts it for this wallet only.</p>
      )}
      {note ? <p className="note bad">{note}</p> : null}
    </div>
  );
}
