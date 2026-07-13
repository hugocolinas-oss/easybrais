import type { Accommodation } from "@/lib/types";

function parseCodeParts(code: string | null): [number, number] | null {
  if (!code) return null;

  const match = code.trim().match(/^(-?\d+)(?:\.(\d+))?$/);
  if (!match) return null;

  const major = Number.parseInt(match[1] ?? "", 10);
  const minor = Number.parseInt(match[2] ?? "0", 10);
  if (Number.isNaN(major) || Number.isNaN(minor)) return null;

  return [major, minor];
}

export function getAccommodationPricingPrefix(acc: Pick<Accommodation, "external_code">): number | null {
  const parts = parseCodeParts(acc.external_code);
  return parts ? parts[0] : null;
}

export function getAccommodationSequence(acc: Pick<Accommodation, "external_code" | "sort_order">): number | null {
  if (Number.isFinite(acc.sort_order) && acc.sort_order !== 0) {
    return acc.sort_order;
  }

  const parts = parseCodeParts(acc.external_code);
  if (!parts) return null;

  const [major, minor] = parts;
  const scale = 1000;
  return major >= 0
    ? major * scale + minor
    : major * scale - minor;
}

export function compareAccommodationsBySequence(
  a: Pick<Accommodation, "external_code" | "sort_order" | "name" | "display_name">,
  b: Pick<Accommodation, "external_code" | "sort_order" | "name" | "display_name">,
): number {
  const aSeq = getAccommodationSequence(a);
  const bSeq = getAccommodationSequence(b);

  if (aSeq !== null && bSeq !== null && aSeq !== bSeq) {
    return aSeq - bSeq;
  }

  if (aSeq !== null) return -1;
  if (bSeq !== null) return 1;

  const aLabel = a.display_name ?? a.name;
  const bLabel = b.display_name ?? b.name;
  return aLabel.localeCompare(bLabel, "es");
}
