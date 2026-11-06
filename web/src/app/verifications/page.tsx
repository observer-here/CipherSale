import Link from "next/link";

const ready = Boolean(process.env.NEXT_PUBLIC_PRIMUS_APP_ID && process.env.NEXT_PUBLIC_PRIMUS_TEMPLATE_ID);

export default function VerificationsPage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">ZKTLS</p>
          <h1>Verifications</h1>
          <p className="lede">A sale stores a hash of its condition. The Primus extension proves that condition for your wallet. It does not reveal the amount you pay.</p>
        </div>
      </div>
      <article className="box">
        <span className={`pill ${ready ? "live" : ""}`}>{ready ? "App id set" : "App id missing"}</span>
        <p className="hint">Joining a sale needs the Primus browser extension, a template id, and the server secret. The condition typed on Create sale must match that template.</p>
        <ol className="hint">
          <li>Connect a wallet on BNB testnet.</li>
          <li>Open a live sale and contribute.</li>
          <li>The extension returns an attestation. The sale marks you eligible once.</li>
        </ol>
        <Link className="btn" href="/sales">Choose a sale</Link>
      </article>
    </section>
  );
}
