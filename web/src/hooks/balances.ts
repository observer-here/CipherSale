"use client";

import { Contract } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { chtAbi } from "@/abi/cht";
import { useWallet } from "@/hooks/wallet";
import { ADDR } from "@/lib/chain";
import { cipher, eth } from "@/lib/format";
import { confidentialBalance } from "@/lib/read";
import { decryptHandle } from "@/primus/decrypt";
import { openFhe } from "@/primus/sdk";

// Decrypting cCHT starts the FHE SDK, so callers pass enabled=false until the balances are on screen.
export function useBalances(enabled = true) {
  const { account, provider } = useWallet();
  const [cht, setCht] = useState("—");
  const [ccht, setCcht] = useState("—");

  const refresh = useCallback(async () => {
    if (!provider || !account) return;
    setCht(eth(await new Contract(ADDR.cht, chtAbi, provider).balanceOf(account)));
    const handle = await confidentialBalance(provider, ADDR.ccht, account);
    setCcht(cipher(handle));
    try {
      const sdk = await openFhe(provider);
      setCcht(eth(await decryptHandle(sdk, handle, ADDR.ccht)));
    } catch {
      setCcht(cipher(handle));
    }
  }, [provider, account]);

  useEffect(() => {
    if (enabled) refresh().catch(() => undefined);
  }, [enabled, refresh]);

  return { cht, ccht, refresh };
}
