import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WalletProvider } from "@/hooks/wallet";
import "./globals.css";

export const metadata: Metadata = { title: "CipherSale", description: "Confidential launchpad on Primus" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </WalletProvider>
      </body>
    </html>
  );
}
