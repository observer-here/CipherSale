"use client";

import { Icon, paths } from "@/components/ui/icon";
import { useWallet } from "@/hooks/wallet";
import { short } from "@/lib/format";

export function WalletMenu() {
  const { account, connect } = useWallet();
  return <button className="wallet-btn" onClick={connect}><Icon d={paths.wallet} />{account ? short(account) : "Connect"}</button>;
}
