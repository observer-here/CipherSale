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
  return formatUnits(value, digits);
}

export function parseEth(value: string) {
  return parseUnits(value.trim() || "0", 18);
}

export function when(unix: number) {
  return new Date(unix * 1000).toLocaleString();
}
