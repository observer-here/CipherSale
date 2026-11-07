import Link from "next/link";
import { SaleForm } from "@/components/sale/sale-form";

export default function CreateSalePage() {
  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="kicker">LAUNCH</p>
          <h1>Create a sale</h1>
          <p className="lede">Buyers pay cCHT and prove a Spotify account. The factory locks the buyer allocation and the listing allocation. The condition must match that proof.</p>
          <Link href="/create-token">Create the project token first</Link>
        </div>
      </div>
      <SaleForm />
    </section>
  );
}
