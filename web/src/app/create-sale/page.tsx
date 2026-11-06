import { SaleForm } from "@/components/sale/sale-form";

export default function CreateSalePage() {
  return (
    <section className="grid gap-10 px-6 py-10 lg:grid-cols-[18rem_1fr]">
      <div>
        <p className="text-xs tracking-[0.22em] text-[#9ff6ff]">LAUNCH</p>
        <h1 className="mt-3 text-3xl font-normal">Create sale</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">Buyers pay cCHT. The rate is project tokens per 1 cCHT. The zkTLS condition must match the Primus template, or the proof will not pass.</p>
      </div>
      <SaleForm />
    </section>
  );
}
