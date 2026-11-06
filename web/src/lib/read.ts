import { Contract, type Provider } from "ethers";
import { cipherSaleAbi, erc20Abi } from "@/abi/cipher-sale";
import { cipherTokenAbi } from "@/abi/cipher-token";
import { saleFactoryAbi } from "@/abi/sale-factory";
import { ADDR } from "@/lib/chain";
import type { SaleView } from "@/types/sale";

async function untilRevert(read: (index: number) => Promise<string>) {
  const out: string[] = [];
  for (let i = 0; i < 50; i++) {
    try {
      out.push(await read(i));
    } catch {
      break;
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
  const [owner, token, saleToken, funded, canceled, raised, options] = await Promise.all([
    sale.owner(),
    sale.token(),
    sale.saleToken(),
    sale.funded(),
    sale.canceled(),
    sale.raised(),
    sale.options(),
  ]);
  const erc20 = new Contract(token, erc20Abi, provider);
  const [name, symbol] = await Promise.all([
    erc20.name().catch(() => "Token"),
    erc20.symbol().catch(() => ""),
  ]);
  return {
    address,
    owner,
    token,
    saleToken,
    funded,
    canceled,
    raised,
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

export function saleStatus(sale: SaleView, now = Math.floor(Date.now() / 1000)) {
  if (sale.canceled) return "canceled";
  if (now < sale.start) return "upcoming";
  if (now <= sale.end) return "live";
  return "ended";
}

export async function confidentialBalance(provider: Provider, token: string, account: string) {
  const c = new Contract(token, cipherTokenAbi, provider);
  return (await c.balanceOf(account)) as string;
}
