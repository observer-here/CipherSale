"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import { reader } from "@/lib/chain";
import { watchSales } from "@/lib/read";
import type { SaleView } from "@/types/sale";

const FRESH_MS = 20_000;

export type SaleSlot = { address: string; sale: Partial<SaleView> };

type Phase = "loading" | "ready" | "error";
let slots: SaleSlot[] = [];
let phase: Phase = "loading";
let at = 0;
let run = 0;
let loading = false;
const listeners = new Set<() => void>();

function publish() {
  for (const hear of listeners) hear();
}

function write(index: number, address: string, patch: Partial<SaleView> = {}) {
  const prev = slots[index];
  slots[index] = { address, sale: { ...prev?.sale, ...patch, address } };
  publish();
}

export function clearSales() {
  run += 1;
  slots = [];
  phase = "loading";
  at = 0;
  loading = false;
  publish();
}

function ensure() {
  if (phase === "ready" && Date.now() - at < FRESH_MS) return;
  if (loading) return;
  loading = true;
  const id = ++run;
  phase = "loading";
  slots = [];
  publish();
  watchSales(reader, (index, address) => {
    if (id === run) write(index, address);
  }, (index, patch) => {
    if (id === run) write(index, slots[index]?.address ?? patch.address ?? "", patch);
  }, () => id === run).then(() => {
    if (id !== run) return;
    phase = "ready";
    at = Date.now();
    loading = false;
    publish();
  }).catch(() => {
    if (id !== run) return;
    phase = "error";
    loading = false;
    toast("Could not read the sale factory.");
    publish();
  });
}

export function useSales() {
  const [snap, setSnap] = useState(() => ({ slots: slots.slice(), state: phase }));
  useEffect(() => {
    const hear = () => setSnap({ slots: slots.slice(), state: phase });
    listeners.add(hear);
    ensure();
    return () => { listeners.delete(hear); };
  }, []);
  return snap;
}
