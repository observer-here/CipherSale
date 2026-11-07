import { TokenForm } from "@/components/token/token-form";

export default function CreateTokenPage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Launch token</h1>
          <p className="lede">Deploy a normal BEP-20. The supply is minted to the connected wallet.</p>
        </div>
      </div>
      <TokenForm />
    </section>
  );
}
