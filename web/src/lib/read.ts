import { Contract, type Provider } from "ethers";
import { cipherSaleAbi, bep20Abi } from "@/abi/cipher-sale";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { saleFactoryAbi } from "@/abi/sale-factory";
import { ADDR } from "@/lib/chain";
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
  const [owner, token, saleToken, state, totalRaised, totalSold, listingId, listed, buyers, raised, tokensSold, options] = await Promise.all([
    sale.owner(),
    sale.token(),
    sale.saleToken(),
    sale.state(),
    sale.totalRaised(),
    sale.totalSold(),
    sale.listingId(),
    sale.listed(),
    sale.buyers(),
    sale.raised(),
    sale.tokensSold(),
    sale.options(),
  ]);
  const bep20 = new Contract(token, bep20Abi, provider);
  const [name, symbol] = await Promise.all([
    bep20.name().catch(() => "Token"),
    bep20.symbol().catch(() => ""),
  ]);
  return {
    address,
    owner,
    token,
    saleToken,
    state: Number(state),
    totalRaised,
    totalSold,
    listingId,
    listed,
    buyers: Number(buyers),
    raised,
    tokensSold,
    name,
    symbol,
    tokenPresale: options[0],
    tokenLiquidity: options[1],
    liquidityBps: options[2],
    softCap: options[3],
    hardCap: options[4],
    minContribution: options[5],
    maxContribution: options[6],
    presaleRate: options[7],
    listingRate: options[8],
    start: Number(options[9]),
    end: Number(options[10]),
  };
}

// Contract states: 1 active, 2 finalizing, 3 refunding (soft cap missed or canceled), 4 succeeded.
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
