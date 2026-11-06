"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WalletMenu } from "@/components/layout/wallet-menu";
import { Icon, paths } from "@/components/ui/icon";

const platform = [
  ["/", "Home", "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"],
  ["/sales", "Explore Sales", paths.layers],
  ["/create-sale", "Create Sale", "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M12 8v8 M8 12h8"],
  ["/verifications", "Verifications", paths.shield],
  ["/purchases", "My Purchases", paths.wallet],
  ["/assets", "Assets", "M7 8h12l-3-3 M17 16H5l3 3"],
];

const resources = [
  ["/docs", "Docs", "M4 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8-.5V19c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5z M12 6v13.5"],
  ["/integrations", "Integrations", "M10 4a2 2 0 1 1 4 0v1h4v4h-1a2 2 0 1 0 0 4h1v4h-4v-1a2 2 0 1 0-4 0v1H6v-4h1a2 2 0 1 0 0-4H6V5h4z"],
  ["/support", "Support", "M4 14v-2a8 8 0 0 1 16 0v2 M4 14h3v5H5a1 1 0 0 1-1-1z M20 14h-3v5h2a1 1 0 0 0 1-1z M18 19c0 1.5-2 2-5 2"],
];

function on(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/sales") return path === "/sales" || path.startsWith("/sale/");
  if (href === "/create-sale") return path === "/create-sale" || path === "/create-token";
  return path === href || path.startsWith(`${href}/`);
}

function NavGroup({ label, items, path, tight }: { label?: string; items: string[][]; path: string; tight?: boolean }) {
  return (
    <div className="nav-group">
      {label ? <p className="nav-label">{label}</p> : null}
      <nav className={tight ? "nav tight" : "nav"}>
        {items.map(([href, text, d]) => (
          <Link key={href} href={href} className={on(path, href) ? "active" : ""}>
            <Icon d={d} size={18} /> {text}
          </Link>
        ))}
      </nav>
    </div>
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
      <Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-3.5-3.5" size={16} />
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
          <svg width="28" height="16" viewBox="0 0 28 16" fill="currentColor" aria-hidden>
            <path d="M9.5 0H17l-6 16H3.5z M20 0h7.5l-6 16H14z" />
          </svg>
          CipherSale
        </Link>
        <NavGroup items={platform} path={path} />
        <NavGroup label="RESOURCES" items={resources} path={path} tight />
        <div className="side-foot">
          <div className="net" title="CipherSale runs on BNB testnet only">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M8 1 14 8 8 15 2 8z" fill="#f0b90b" /></svg>
            <span>BNB Testnet</span>
            <i className="dot" />
            <Icon d={paths.chevron} size={14} />
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="top">
          <SearchBox />
          <button className="icon-btn" aria-label="Notices" onClick={() => setBell((open) => !open)}>
            <Icon d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z M10 19a2 2 0 0 0 4 0" size={20} />
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
