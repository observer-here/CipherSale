"use client";

import { Contract } from "ethers";
import { useState } from "react";
import { erc20Abi } from "@/abi/cipher-sale";
import { saleFactoryAbi } from "@/abi/sale-factory";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useWallet } from "@/hooks/wallet";
import { ADDR } from "@/lib/chain";
import { eth, parseEth } from "@/lib/format";
import { fheFee } from "@/primus/fee";
import { openFhe } from "@/primus/sdk";

const ONE = 10n ** 18n;

export function SaleForm() {
  const { provider } = useWallet();
  const [token, setToken] = useState("");
  const [condition, setCondition] = useState("kyc:passed");
  const [rate, setRate] = useState("1000");
  const [listing, setListing] = useState("800");
  const [soft, setSoft] = useState("10");
  const [hard, setHard] = useState("100");
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("20");
  const [liquidity, setLiquidity] = useState("50");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!provider) return setNote("Connect a wallet");
    setBusy(true);
    setNote("");
    try {
      const signer = await provider.getSigner();
      const me = await signer.getAddress();
      const hardCap = parseEth(hard);
      const presaleRate = parseEth(rate);
      const listingRate = parseEth(listing);
      const liquidityBps = BigInt(Math.round(Number(liquidity) * 100));
      const tokenPresale = (hardCap * presaleRate) / ONE;
      const listingPay = (hardCap * liquidityBps) / 10000n;
      const tokenLiquidity = listingPay === 0n ? 0n : (listingPay * listingRate) / ONE;
      const need = tokenPresale + tokenLiquidity;
      const erc20 = new Contract(token, erc20Abi, signer);
      const allowance = await erc20.allowance(me, ADDR.saleFactory);
      if (allowance < need) {
        const approved = await erc20.approve(ADDR.saleFactory, need);
        await approved.wait();
      }
      const opts = {
        tokenPresale,
        tokenLiquidity,
        liquidityBps,
        softCap: parseEth(soft),
        hardCap,
        minContribution: parseEth(min),
        maxContribution: parseEth(max),
        presaleRate,
        listingRate: listingPay === 0n ? 0n : listingRate,
        start: Math.floor(new Date(start).getTime() / 1000),
        end: Math.floor(new Date(end).getTime() / 1000),
      };
      const sdk = await openFhe(provider);
      const fee = await fheFee(sdk, ADDR.ccht, "deposit");
      const factory = new Contract(ADDR.saleFactory, saleFactoryAbi, signer);
      const tx = await factory.createSale(token, condition, Object.values(opts), { value: fee });
      const receipt = await tx.wait();
      const parsed = receipt.logs
        .map((log: { topics: string[]; data: string }) => {
          try { return factory.interface.parseLog(log); } catch { return null; }
        })
        .find((item: { name?: string } | null) => item?.name === "SaleCreated");
      setNote(parsed ? `Sale ${parsed.args.sale}` : "Sale created");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  let pull = "Enter the caps and rates";
  try {
    const hardCap = parseEth(hard);
    const presaleRate = parseEth(rate);
    const listingRate = parseEth(listing);
    const bps = BigInt(Math.round(Number(liquidity) * 100));
    const tokenPresale = (hardCap * presaleRate) / ONE;
    const listingPay = (hardCap * bps) / 10000n;
    const tokenLiquidity = listingPay === 0n ? 0n : (listingPay * listingRate) / ONE;
    pull = `${eth(tokenPresale)} tokens for buyers, ${eth(tokenLiquidity)} for listing`;
  } catch { /* fields still being typed */ }

  return (
    <form className="grid max-w-xl gap-5" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <Field label="Project token" value={token} onChange={setToken} />
      <Field label="zkTLS condition" value={condition} onChange={setCondition} />
      <Field label="Tokens per 1 cCHT" value={rate} onChange={setRate} />
      <Field label="Listing tokens per 1 cCHT" value={listing} onChange={setListing} />
      <Field label="Soft cap, cCHT" value={soft} onChange={setSoft} />
      <Field label="Hard cap, cCHT" value={hard} onChange={setHard} />
      <Field label="Min contribution" value={min} onChange={setMin} />
      <Field label="Max contribution" value={max} onChange={setMax} />
      <Field label="Liquidity percent" value={liquidity} onChange={setLiquidity} />
      <Field label="Start" type="datetime-local" value={start} onChange={setStart} />
      <Field label="End" type="datetime-local" value={end} onChange={setEnd} />
      <p className="text-sm text-white/60">The factory pulls <span className="mono text-[#9ff6ff]">{pull}</span>. Approve that amount, then one transaction deploys the confidential token and the sale.</p>
      <Button disabled={busy} type="submit">{busy ? "Creating" : "Create sale"}</Button>
      {note ? <p className="mono text-sm break-all">{note}</p> : null}
    </form>
  );
}
