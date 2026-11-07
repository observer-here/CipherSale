"use client";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  options?: { value: string; label: string }[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      ) : multiline ? (
        <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} type={type} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}
