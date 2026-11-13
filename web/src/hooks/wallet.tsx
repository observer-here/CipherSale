"use client";

// Reown AppKit. createAppKit keeps the existing kit, so a reload does not open a second one.
import { createAppKit, useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { bscTestnet } from "@reown/appkit/networks";
import { StorageUtil } from "@reown/appkit-controllers/utils";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { CHAIN_ID } from "@/lib/chain";

// AppKit drops the saved tBNB balance every 30s and logs it. Keep the saved balance.
StorageUtil.cacheExpiry.nativeBalance = Number.MAX_SAFE_INTEGER;
StorageUtil.cacheExpiry.portfolio = Number.MAX_SAFE_INTEGER;
StorageUtil.getNativeBalanceCacheForCaipAddress = (caipAddress) => {
  try {
    return StorageUtil.getNativeBalanceCache()[caipAddress];
  } catch {
    return undefined;
  }
};
StorageUtil.getBalanceCacheForCaipAddress = (caipAddress) => {
  try {
    return StorageUtil.getBalanceCache()[caipAddress]?.balance;
  } catch {
    return undefined;
  }
};

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [bscTestnet],
  defaultNetwork: bscTestnet,
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "",
  metadata: {
    name: "CipherSale",
    description: "Confidential sales on BNB testnet",
    url: typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
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
  const kept = useRef<{ account?: string; provider?: BrowserProvider }>({});

  if (address && walletProvider && kept.current.account !== address) {
    kept.current = { account: address, provider: new BrowserProvider(walletProvider, CHAIN_ID) };
  }
  const account = address ?? kept.current.account;

  const value = useMemo<Wallet>(() => ({
    account,
    provider: kept.current.provider,
    connect: () => open(),
    disconnect: () => {
      kept.current = {};
      disconnect();
    },
  }), [account, open, disconnect]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Wallet missing");
  return ctx;
}
