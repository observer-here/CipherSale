export function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function Spotify({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill="currentColor" fillRule="evenodd" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export const paths = {
  layers: "M12 3 3 8l9 5 9-5-9-5z M3 12.5l9 5 9-5 M3 16.5l9 5 9-5",
  shield: "M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6z",
  wallet: "M3 7a2 2 0 0 1 2-2h12v3 M3 7v11a2 2 0 0 0 2 2h14V8H5 M16 14h2",
  lock: "M8 11V8a4 4 0 0 1 8 0v3 M6 11h12v9H6z M12 15v2",
  chevron: "m6 9 6 6 6-6",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M14.6 9.6c-.4-.8-1.4-1.3-2.6-1.3-1.4 0-2.5.8-2.5 1.9s1 1.7 2.5 1.9 2.5.8 2.5 1.9-1.1 1.9-2.5 1.9c-1.2 0-2.2-.5-2.6-1.4 M12 6.5v1.8 M12 15.7v1.8",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
};
