import { SaleList } from "@/components/sale/sale-list";

export default function HomePage() {
  return (
    <>
      <section className="px-6 pb-2 pt-10">
        <p className="text-xs tracking-[0.22em] text-[#9ff6ff]">ZKTLS + ZKFHE</p>
        <h1 className="mt-3 text-4xl font-normal">Confidential sales</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
          Claim CHT, wrap it into cCHT, and pay a sale with that hidden balance. The tape shows who can join. The amount stays a ciphertext.
        </p>
      </section>
      <SaleList />
    </>
  );
}
