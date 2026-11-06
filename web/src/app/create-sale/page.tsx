import Link from "next/link";
import { SaleForm } from "@/components/sale/sale-form";

export default function CreateSalePage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">LAUNCH</p>
          <h1>Create a sale</h1>
          <p className="lede">Buyers pay cCHT. The rate is project tokens per 1 cCHT. The zkTLS condition must match the Primus template.</p>
          <Link href="/create-token">Create the project token first</Link>
        </div>
      </div>
      <SaleForm />
    </section>
  );
}
