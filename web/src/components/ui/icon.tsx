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
      <path fill="currentColor" d="M12 0a12 12 0 1 0 .01 24A12 12 0 0 0 12 0zm5.5 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.26 9.72-.66 13.38 1.56.42.24.54.78.36 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z" />
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
};
