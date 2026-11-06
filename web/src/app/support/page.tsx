const app = Boolean(process.env.NEXT_PUBLIC_PRIMUS_APP_ID);
const template = Boolean(process.env.NEXT_PUBLIC_PRIMUS_TEMPLATE_ID);

const needs = [
  ["Wallet", "A wallet on BNB testnet, chain 97. Reown is already configured."],
  ["Primus app id", app ? "Set in this environment." : "Missing. Add NEXT_PUBLIC_PRIMUS_APP_ID."],
  ["Template id", template ? "Set in this environment." : "Missing. Add NEXT_PUBLIC_PRIMUS_TEMPLATE_ID."],
  ["App secret", "PRIMUS_APP_SECRET stays on the server. The sign route refuses to run without it."],
  ["Extension", "The Primus browser extension has to be installed before a proof can start."],
  ["Gas", "FHE calls also need a BNB fee. The app quotes it and sends it with the transaction."],
];

export default function SupportPage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">BEFORE YOU JOIN</p>
          <h1>Support</h1>
          <p className="lede">The interface can list sales without these. Contributing cannot.</p>
        </div>
      </div>
      {needs.map(([title, body]) => (
        <article key={title} className="box">
          <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
          <p className="hint">{body}</p>
        </article>
      ))}
    </section>
  );
}
