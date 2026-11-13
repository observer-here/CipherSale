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
