import { ADDR } from "@/lib/chain";

const rows = [
  ["CHT", ADDR.cht],
  ["cCHT", ADDR.ccht],
  ["Token factory", ADDR.tokenFactory],
  ["Sale factory", ADDR.saleFactory],
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/15 px-6 py-5 text-xs text-white/45">
      <p className="mb-3 tracking-[0.16em]">BNB TESTNET · PRIMUS</p>
      <div className="grid gap-1">
        {rows.map(([label, address]) => (
          <p key={label}><span className="inline-block w-28">{label}</span><span className="mono">{address}</span></p>
        ))}
      </div>
    </footer>
  );
}
