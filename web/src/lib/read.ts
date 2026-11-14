import { Contract, type Provider } from "ethers";
import { cipherSaleAbi, bep20Abi } from "@/abi/cipher-sale";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { saleFactoryAbi } from "@/abi/sale-factory";
import { ADDR } from "@/lib/chain";
import { parseMeta } from "@/lib/meta";
import type { SaleView } from "@/types/sale";

async function untilRevert(read: (index: number) => Promise<string>) {
  const out: string[] = [];
  for (let i = 0; i < 50; i++) {
    try {
      out.push(await read(i));
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
      if (code === "CALL_EXCEPTION" || code === "BAD_DATA") break;
      throw err;
    }
  }
  return out;
}

export async function listSales(provider: Provider): Promise<SaleView[]> {
  const factory = new Contract(ADDR.saleFactory, saleFactoryAbi, provider);
  const addresses = await untilRevert((i) => factory.allSales(i));
  return Promise.all(addresses.map((address) => loadSale(provider, address)));
}

export async function loadSale(provider: Provider, address: string): Promise<SaleView> {
  const sale = new Contract(address, cipherSaleAbi, provider);
  const [owner, token, state, totalRaised, totalSold, buyers, raised, tokensSold, options, metadata] = await Promise.all([
    sale.owner(),
    sale.token(),
    sale.state(),
    sale.totalRaised(),
    sale.totalSold(),
    sale.buyers(),
    sale.raised(),
    sale.tokensSold(),
    sale.options(),
    sale.metadata(),
  ]);
  const bep20 = new Contract(token, bep20Abi, provider);
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    bep20.name().catch(() => "Token"),
    bep20.symbol().catch(() => ""),
    bep20.decimals().catch(() => 18n),
    bep20.totalSupply().catch(() => 0n),
  ]);
  return {
    address,
    owner,
    token,
    state: Number(state),
    totalRaised,
    totalSold,
    buyers: Number(buyers),
    raised,
    tokensSold,
    name,
    symbol,
    decimals: Number(decimals),
    totalSupply,
    meta: parseMeta(metadata),
    tokenPresale: options[0],
    softCap: options[1],
    hardCap: options[2],
    minContribution: options[3],
    maxContribution: options[4],
    presaleRate: options[5],
    start: Number(options[6]),
    end: Number(options[7]),
  };
}

export function saleStatus(sale: SaleView, now = Math.floor(Date.now() / 1000)) {
  if (sale.state === 2) return "finalizing";
  if (sale.state === 3) return "refunding";
  if (sale.state === 4) return "succeeded";
  if (now < sale.start) return "upcoming";
  if (now <= sale.end) return "live";
  return "ended";
}

export function isClosed(status: ReturnType<typeof saleStatus>) {
  return status !== "live" && status !== "upcoming";
}

export async function confidentialBalance(provider: Provider, token: string, account: string) {
  const c = new Contract(token, cipherTokenAbi, provider);
  return (await c.balanceOf(account)) as string;
}
