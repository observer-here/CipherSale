import { TokenForm } from "@/components/token/token-form";

export default function CreateTokenPage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">PUBLIC TOKEN</p>
          <h1>Create token</h1>
          <p className="lede">This is the institution’s plain token. Supply is minted to the connected wallet. The sale wraps part of it later.</p>
        </div>
      </div>
      <TokenForm />
    </section>
  );
}
