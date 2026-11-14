import { formatUnits, parseUnits } from "ethers";

export function short(value: string, head = 6, tail = 4) {
  if (!value || value.length <= head + tail + 1) return value || "";
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function cipher(handle: string) {
  if (!handle || BigInt(handle) === 0n) return "0x0";
  return short(handle, 6, 4);
}

export function eth(value: bigint, digits = 18) {
  const text = formatUnits(value, digits);
  if (!text.includes(".")) return text;
  return text.replace(/0+$/, "").replace(/\.$/, "") || "0";
}

export function usd(rate: bigint) {
  if (rate <= 0n) return "0$";
  return `${eth((10n ** 36n) / rate)}$`;
}

export function units(value: bigint) {
  const n = Number(value / 10n ** 18n);
  const [size, suffix] = n >= 1e9 ? [1e9, "B"] : n >= 1e6 ? [1e6, "M"] : n >= 1e3 ? [1e3, "k"] : [0, ""];
  if (!size) return eth(value);
  const scaled = n / Number(size);
  return `${scaled.toFixed(scaled >= 100 ? 0 : 1).replace(/\.0$/, "")}${suffix}`;
}

export function compact(value: bigint) {
  return `$${units(value)}`;
}

export function fdv(supply: bigint, rate: bigint) {
  if (supply <= 0n || rate <= 0n) return "$0";
  return compact((supply * 10n ** 18n) / rate);
}

export function parseEth(value: string) {
  return parseUnits(value.trim() || "0", 18);
}

export function when(unix: number) {
  return new Date(unix * 1000).toLocaleString();
}

// Primus throws ZkAttestationError, which has a message but is not an Error.
export function txError(err: unknown, fallback: string) {
  if (typeof err !== "object" || !err) return fallback;
  const row = err as { shortMessage?: unknown; message?: unknown };
  if (typeof row.shortMessage === "string" && row.shortMessage) return row.shortMessage;
  if (typeof row.message === "string" && row.message) return row.message;
  return fallback;
}
