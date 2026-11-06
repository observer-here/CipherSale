import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { WalletProvider } from "@/hooks/wallet";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = { title: "CipherSale", description: "Confidential launchpad on Primus" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </WalletProvider>
      </body>
    </html>
  );
}
