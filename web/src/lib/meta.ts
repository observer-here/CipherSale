const KEYS = ["description", "website", "telegram", "twitter", "gate"] as const;

export type SaleMeta = Record<(typeof KEYS)[number], string>;

export function parseMeta(text: string): SaleMeta {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(text);
  } catch {
    /* sales created without metadata */
  }
  return Object.fromEntries(KEYS.map((key) => [key, typeof raw?.[key] === "string" ? raw[key] : ""])) as SaleMeta;
}

export function stringifyMeta(meta: SaleMeta) {
  return JSON.stringify(Object.fromEntries(KEYS.filter((key) => meta[key].trim()).map((key) => [key, meta[key].trim()])));
}

export const isLink = (value: string) => /^https?:\/\//i.test(value);
