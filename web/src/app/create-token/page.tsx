import { TokenForm } from "@/components/token/token-form";

export default function CreateTokenPage() {
  return (
    <section className="page">
      <div className="page-head">
        <h1>Launch token</h1>
      </div>
      <TokenForm />
    </section>
  );
}
