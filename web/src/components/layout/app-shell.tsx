"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WalletMenu } from "@/components/layout/wallet-menu";

const platform = [
  ["/", "Home", "M4 10.5 12 4l8 6.5V20H4z"],
  ["/sales", "Explore Sales", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"],
  ["/create-sale", "Create Sale", "M12 5v14M5 12h14"],
  ["/verifications", "Verifications", "M12 3 5 6v6c0 4.2 2.8 6.8 7 8 4.2-1.2 7-3.8 7-8V6z"],
  ["/purchases", "My Purchases", "M6 7h12l-1 13H7z M9 7V5a3 3 0 0 1 6 0v2"],
  ["/analytics", "Analytics", "M5 19V9M12 19V5M19 19v-7"],
];

const resources = [
  ["/docs", "Docs", "M7 3h8l4 4v14H7z M15 3v4h4"],
  ["/integrations", "Integrations", "M8 8h8v8H8z M4 12h4M16 12h4M12 4v4M12 16v4"],
  ["/support", "Support", "M12 21a9 9 0 1 0-9-9c0 2 .8 3.2 2 4.2V19l2.2-1.2c1.4.8 3 .12 4.8.12z"],
];

function on(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/sales") return path === "/sales" || path.startsWith("/sale/");
  if (href === "/create-sale") return path === "/create-sale" || path === "/create-token";
  return path === href || path.startsWith(`${href}/`);
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d={d} />
    </svg>
  );
}

function SearchBox() {
  const params = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (event.key !== "/" || tag === "INPUT" || tag === "TEXTAREA") return;
      event.preventDefault();
      ref.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <label className="search">
      <Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-3.5-3.5" />
      <input
        ref={ref}
        value={q}
        placeholder="Search sales, projects, organizers..."
        onChange={(event) => {
          const next = event.target.value;
          const base = path === "/" || path === "/sales" ? path : "/sales";
          router.replace(next ? `${base}?q=${encodeURIComponent(next)}` : base);
        }}
      />
      <kbd>/</kbd>
    </label>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [bell, setBell] = useState(false);

  return (
    <div className="app">
      <aside className="side">
        <Link href="/" className="brand">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 15 10 3M8 15l6-12" />
          </svg>
          CipherSale
        </Link>
        <div>
          <p className="nav-label">PLATFORM</p>
          <nav className="nav">
            {platform.map(([href, label, d]) => (
              <Link key={href} href={href} className={on(path, href) ? "active" : ""}>
                <Icon d={d} /> {label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <p className="nav-label">RESOURCES</p>
          <nav className="nav">
            {resources.map(([href, label, d]) => (
              <Link key={href} href={href} className={on(path, href) ? "active" : ""}>
                <Icon d={d} /> {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="side-foot">
          <div className="net"><span className="dot" /> BNB Testnet</div>
        </div>
      </aside>
      <div className="workspace">
        <header className="top">
          <SearchBox />
          <button className="icon-btn" aria-label="Notices" onClick={() => setBell((open) => !open)}>
            <Icon d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z M10 19a2 2 0 0 0 4 0" />
          </button>
          <WalletMenu />
          {bell ? (
            <div className="menu">
              <p className="hint">Notices stay on chain. Open a sale to see who was marked eligible. Raised amounts are not published.</p>
              <Link href="/sales" onClick={() => setBell(false)}>Explore sales</Link>
            </div>
          ) : null}
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
