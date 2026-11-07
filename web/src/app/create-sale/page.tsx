import Link from "next/link";
import { SaleForm } from "@/components/sale/sale-form";

export default function CreateSalePage() {
  return (
    <section className="page" style={{ maxWidth: "1080px" }}>
      <div className="page-head">
        <div>
          <h1>Create a sale</h1>
          <p className="lede">Buyers pay cCHT and prove Spotify account ownership. The factory locks the buyer allocation and the listing allocation.</p>
          <Link href="/create-token">Create the project token first</Link>
        </div>
      </div>
      <SaleForm />
    </section>
  );
}
