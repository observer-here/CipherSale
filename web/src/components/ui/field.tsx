"use client";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  max?: number;
}) {
  const write = (next: string) => onChange(max ? next.slice(0, max) : next);
  return (
    <label className="field">
      <span>{label}{max ? ` ${value.length}/${max}` : ""}</span>
      {multiline ? (
        <textarea rows={4} value={value} maxLength={max} onChange={(event) => write(event.target.value)} />
      ) : (
        <input value={value} type={type} maxLength={max} onChange={(event) => write(event.target.value)} />
      )}
    </label>
  );
}
