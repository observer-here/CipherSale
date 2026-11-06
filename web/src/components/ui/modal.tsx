"use client";

import type { ReactNode } from "react";

export function Band({ open, children }: { open: boolean; children: ReactNode }) {
  if (!open) return null;
  return <section className="border-b border-white/15 px-6 py-6">{children}</section>;
}
