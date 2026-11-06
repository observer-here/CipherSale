export function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const paths = {
  layers: "M12 3 3 8l9 5 9-5-9-5z M3 12.5l9 5 9-5 M3 16.5l9 5 9-5",
  shield: "M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6z",
  wallet: "M3 7a2 2 0 0 1 2-2h12v3 M3 7v11a2 2 0 0 0 2 2h14V8H5 M16 14h2",
  lock: "M8 11V8a4 4 0 0 1 8 0v3 M6 11h12v9H6z M12 15v2",
  chevron: "m6 9 6 6 6-6",
};
