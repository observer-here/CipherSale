"use client";

import { Contract } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { usdtAbi } from "@/abi/usdt";
import { useWallet } from "@/hooks/wallet";
import { ADDR, reader } from "@/lib/chain";
import { cipher, eth } from "@/lib/format";
import { confidentialBalance } from "@/lib/read";
import { decryptHandle } from "@/primus/decrypt";
import { openFhe } from "@/primus/sdk";

export function useBalances(enabled = true, decrypt = true) {
  const { account, provider } = useWallet();
  const [cht, setCht] = useState("—");
  const [ccht, setCcht] = useState("—");
  const [chtRaw, setChtRaw] = useState(0n);
  const [cchtRaw, setCchtRaw] = useState(0n);

  const reveal = useCallback(async () => {
    if (!provider || !account) return 0n;
    const handle = await confidentialBalance(reader, ADDR.ccht, account);
    try {
      const sdk = await openFhe(provider);
      const value = await decryptHandle(sdk, handle, ADDR.ccht);
      setCchtRaw(value);
      setCcht(eth(value));
      return value;
    } catch {
      setCcht(cipher(handle));
      return 0n;
    }
  }, [provider, account]);

  const refresh = useCallback(async () => {
    if (!account) return;
    const raw = await new Contract(ADDR.cht, usdtAbi, reader).balanceOf(account);
    setChtRaw(raw);
    setCht(eth(raw));
    if (decrypt) await reveal();
  }, [account, decrypt, reveal]);

  useEffect(() => {
    if (enabled) refresh().catch(() => undefined);
  }, [enabled, refresh]);

  return { cht, ccht, chtRaw, cchtRaw, refresh, reveal };
}
