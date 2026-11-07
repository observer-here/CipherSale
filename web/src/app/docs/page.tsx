import Link from "next/link";

const steps = [
  ["Create token", "The institution mints a plain 18-decimal token to their wallet.", "/create-token"],
  ["Create sale", "One transaction deploys the confidential token and the sale, then moves the presale and listing tokens in.", "/create-sale"],
  ["Fund a buyer", "Claim CHT from the faucet in the wallet menu, then wrap it into cCHT.", "/"],
  ["Join", "The Primus extension proves the sale condition with zkTLS. The amount is encrypted before the sale takes it.", "/sales"],
  ["Finalize", "After the window, anyone reveals the raised total and tokens sold. The contract checks the KMS proof on chain.", "/sales"],
  ["Claim or refund", "Above the soft cap buyers claim confidential tokens and the owner is paid. Below it buyers get their cCHT back.", "/sales"],
  ["List", "The owner unwraps the liquidity share and pairs it with the project token on PancakeSwap. LP stays locked in the sale.", "/sales"],
];

export default function DocsPage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">HOW IT WORKS</p>
          <h1>Docs</h1>
          <p className="lede">CipherSale is a confidential sale on BNB testnet. Payment is cCHT. Eligibility is zkTLS. Contributions stay encrypted. Only the final totals are revealed.</p>
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
