"use client";

export function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs tracking-wide text-white/60">{label}</span>
      <input
        className="border-b border-white/25 bg-transparent py-2 outline-none"
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
