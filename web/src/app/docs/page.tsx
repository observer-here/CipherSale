import Link from "next/link";

const steps = [
  ["Create token", "The institution mints a plain 18-decimal token to their wallet.", "/create-token"],
  ["Create sale", "One transaction deploys the confidential token and the sale, then wraps the presale allocation.", "/create-sale"],
  ["Fund a buyer", "Claim CHT from the faucet in the wallet menu, then wrap it into cCHT.", "/"],
  ["Join", "The Primus extension proves the sale condition. The amount is encrypted before the sale takes it.", "/sales"],
  ["Settle", "After the window, settle pays confidential tokens if the hidden total cleared the soft cap. Otherwise it returns cCHT.", "/sales"],
];

export default function DocsPage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">HOW IT WORKS</p>
          <h1>Docs</h1>
          <p className="lede">CipherSale is a confidential sale on BNB testnet. Payment is cCHT. Eligibility is zkTLS. Settlement stays on encrypted values.</p>
        </div>
      </div>
      {steps.map(([title, body, href]) => (
        <article key={title} className="box">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p className="hint">{body}</p>
          <Link href={href}>Open</Link>
        </article>
      ))}
    </section>
  );
}
