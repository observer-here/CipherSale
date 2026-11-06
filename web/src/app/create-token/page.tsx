import { TokenForm } from "@/components/token/token-form";

export default function CreateTokenPage() {
  return (
    <section className="grid gap-10 px-6 py-10 lg:grid-cols-[18rem_1fr]">
      <div>
        <p className="text-xs tracking-[0.22em] text-[#9ff6ff]">PUBLIC TOKEN</p>
        <h1 className="mt-3 text-3xl font-normal">Create token</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">This is the institution’s plain ERC-20. The supply is minted to the connected wallet. The sale wraps part of it later.</p>
      </div>
      <TokenForm />
    </section>
  );
}
