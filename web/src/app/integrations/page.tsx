import { ADDR } from "@/lib/chain";

const rows = [
  ["CHT", ADDR.cht],
  ["cCHT", ADDR.ccht],
  ["Token factory", ADDR.tokenFactory],
  ["Sale factory", ADDR.saleFactory],
];

export default function IntegrationsPage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">BNB TESTNET</p>
          <h1>Integrations</h1>
          <p className="lede">Primus zkTLS proves eligibility. Primus FHE encrypts the payment. These contracts are the ones this app calls.</p>
        </div>
      </div>
      <dl className="sheet">
        {rows.map(([label, address]) => (
          <div key={label}><dt>{label}</dt><dd className="mono">{address}</dd></div>
        ))}
      </dl>
    </section>
  );
}
