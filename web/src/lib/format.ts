import { AbiCoder, formatUnits, parseUnits } from "ethers";

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

export function supplyShare(allocated: bigint, supply: bigint) {
  if (supply <= 0n || allocated <= 0n) return "0%";
  const bps = (allocated * 10000n) / supply;
  const whole = bps / 100n;
  const tenth = (bps % 100n) / 10n;
  return tenth === 0n ? `${whole}%` : `${whole}.${tenth}%`;
}

export function parseEth(value: string) {
  return parseUnits(value.trim() || "0", 18);
}

export function when(unix: number) {
  return new Date(unix * 1000).toLocaleString();
}

export function clock(seconds: number) {
  const span = Math.max(0, Math.floor(seconds));
  const days = Math.floor(span / 86400);
  const hours = Math.floor((span % 86400) / 3600);
  const minutes = Math.floor((span % 3600) / 60);
  const secs = span % 60;
  const rest = [hours, minutes, secs].map((n) => String(n).padStart(2, "0")).join(":");
  return days ? `${days}d ${rest}` : rest;
}

function revertData(value: unknown, depth = 0): string | undefined {
  if (depth > 6 || value == null) return;
  if (typeof value === "string") {
    if (!value.startsWith("0x08c379a0") || value.length < 138) return;
    try {
      const text = AbiCoder.defaultAbiCoder().decode(["string"], `0x${value.slice(10)}`)[0];
      return typeof text === "string" && text ? text : undefined;
    } catch {
      return;
    }
  }
  if (typeof value !== "object") return;
  const row = value as Record<string, unknown>;
  if (typeof row.reason === "string" && row.reason) return row.reason;
  for (const key of ["data", "error", "info", "cause"]) {
    const found = revertData(row[key], depth + 1);
    if (found) return found;
  }
}

// Primus throws ZkAttestationError, which has a message but is not an Error.
export function txError(err: unknown, fallback: string) {
  const reason = revertData(err);
  if (reason) return reason;
  if (typeof err !== "object" || !err) return fallback;
  const row = err as { shortMessage?: unknown; message?: unknown };
  const generic = (text: string) => /internal json-rpc error|could not coalesce error/i.test(text);
  if (typeof row.shortMessage === "string" && row.shortMessage && !generic(row.shortMessage)) return row.shortMessage;
  if (typeof row.message === "string" && row.message && !generic(row.message) && row.message.length < 180) return row.message;
  return fallback;
}
