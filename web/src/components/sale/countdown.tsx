export function Countdown({ left }: { left: number }) {
  const rest = Math.max(0, left);
  const cells: [number, string][] = [
    [Math.floor(rest / 86400), "Days"],
    [Math.floor((rest % 86400) / 3600), "Hours"],
    [Math.floor((rest % 3600) / 60), "Min"],
    [rest % 60, "Sec"],
  ];
  return (
    <div className="count">
      {cells.map(([value, label]) => (
        <div key={label}><b>{String(value).padStart(2, "0")}</b><span>{label}</span></div>
      ))}
    </div>
  );
}
