"use client";

import { BrowserProvider } from "ethers";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { CHAIN_HEX, CHAIN_ID, RPC } from "@/lib/chain";

type Wallet = {
  account?: string;
  provider?: BrowserProvider;
  busy: boolean;
  error?: string;
  connect: () => Promise<void>;
};

const Ctx = createContext<Wallet | null>(null);

async function ensureChain() {
  const ethereum = window.ethereum;
  if (!ethereum) throw new Error("Install a browser wallet");
  const chain = await ethereum.request({ method: "eth_chainId" });
  if (chain === CHAIN_HEX) return;
  try {
    await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code !== 4902) throw err;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId: CHAIN_HEX, chainName: "BNB testnet", nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 }, rpcUrls: [RPC] }],
    });
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string>();
  const [provider, setProvider] = useState<BrowserProvider>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const value = useMemo<Wallet>(() => ({
    account,
    provider,
    busy,
    error,
    connect: async () => {
      setBusy(true);
      setError(undefined);
      try {
        await ensureChain();
        const next = new BrowserProvider(window.ethereum as never);
        const accounts = await next.send("eth_requestAccounts", []);
        const network = await next.getNetwork();
        if (Number(network.chainId) !== CHAIN_ID) throw new Error("Switch the wallet to BNB testnet");
        setProvider(next);
        setAccount(accounts[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wallet rejected");
      } finally {
        setBusy(false);
      }
    },
  }), [account, provider, busy, error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Wallet missing");
  return ctx;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<string>;
    };
  }
}
