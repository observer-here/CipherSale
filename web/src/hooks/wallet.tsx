"use client";

// Reown AppKit (WalletConnect + injected wallets) pinned to BNB testnet.
// https://docs.reown.com/appkit/next/core/installation
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { bscTestnet } from "@reown/appkit/networks";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { CHAIN_ID } from "@/lib/chain";

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bscTestnet],
  defaultNetwork: bscTestnet,
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "",
  metadata: {
    name: "CipherSale",
    description: "Confidential sales on BNB testnet",
    url: "http://localhost:3456",
    icons: [],
  },
  features: { analytics: false, email: false, socials: false },
});

type Wallet = {
  account?: string;
  provider?: BrowserProvider;
  connect: () => void;
  disconnect: () => void;
};

const Ctx = createContext<Wallet | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");

  const value = useMemo<Wallet>(() => ({
    account: address,
    provider: address && walletProvider ? new BrowserProvider(walletProvider, CHAIN_ID) : undefined,
    connect: () => open(),
    disconnect: () => { disconnect(); },
  }), [address, walletProvider, open, disconnect]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Wallet missing");
  return ctx;
}
