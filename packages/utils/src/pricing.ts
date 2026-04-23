/**
 * Easy Brais — Pricing engine
 *
 * Single source of truth for price calculations.
 * Used both client-side (preview) and server-side (authoritative).
 *
 * Camino Portugués por la Costa — 8 etapas.
 * Precio por mochila = etapas × 6 €  (camino completo = 48 €).
 * Excepciones de precio fijo para rutas específicas.
 */

export const PRICING_RULES = {
  /** Price per bag per etapa */
  BASE_PRICE: 6,
  /** Total bags threshold before volume discount kicks in */
  VOLUME_THRESHOLD: 9,
  /** Discount per bag beyond VOLUME_THRESHOLD */
  VOLUME_DISCOUNT: 1,
  /** Extra fee per overweight bag (>20 kg) */
  OVERWEIGHT_FEE: 5,
} as const;

/**
 * Camino pricing zones mapped from external_code prefix → zone index.
 * Full Camino (code 1 → 13) = zone 0 → 8 = 8 etapas.
 *
 *  Zone 0: code 1         A Guarda
 *  Zone 1: code 2         Oia
 *  Zone 2: code 3         Baiona / Nigrán
 *  Zone 3: code 4         Vigo
 *  Zone 4: codes 5–6      Redondela – Pontevedra
 *  Zone 5: codes 7–8      A Portela – Caldas de Reis
 *  Zone 6: codes 9–10     O Cruceiro – Pontecesures
 *  Zone 7: codes 11–12    Padrón – Escravitude
 *  Zone 8: code 13        Santiago
 */
export const PRICING_ZONES: [number, number][] = [
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 6],
  [7, 8],
  [9, 10],
  [11, 12],
  [13, 13],
];

/**
 * Fixed-price overrides for specific code-prefix pairs (per bag).
 * Key format: "min:max" where min < max.
 */
const PRICE_OVERRIDES: Record<string, number> = {
  "5:9": 8,
  "8:12": 8,
};

function overrideKey(p1: number, p2: number): string {
  return p1 <= p2 ? `${p1}:${p2}` : `${p2}:${p1}`;
}

/** Returns a fixed override price per bag, or null if standard pricing applies. */
export function getOverridePrice(pickupPrefix: number, dropoffPrefix: number): number | null {
  return PRICE_OVERRIDES[overrideKey(pickupPrefix, dropoffPrefix)] ?? null;
}

/** Map an external_code integer prefix to its pricing zone index (0-based). Returns -1 if unknown. */
export function getPricingZone(codePrefix: number): number {
  for (let i = 0; i < PRICING_ZONES.length; i++) {
    const [min, max] = PRICING_ZONES[i];
    if (codePrefix >= min && codePrefix <= max) return i;
  }
  return -1;
}

/** Compute the number of real pricing etapas between two external_code prefixes. */
export function getRealEtapas(pickupPrefix: number, dropoffPrefix: number): number {
  const pz = getPricingZone(pickupPrefix);
  const dz = getPricingZone(dropoffPrefix);
  if (pz < 0 || dz < 0) return 1;
  return Math.max(1, Math.abs(dz - pz));
}

/** Price per bag for a given number of real etapas (standard, no overrides). */
export function pricePerBagForEtapas(realEtapas: number): number {
  return PRICING_RULES.BASE_PRICE * Math.max(1, realEtapas);
}

/**
 * Resolve the per-bag price for a leg, applying overrides when code prefixes are known.
 * Falls back to standard etapas × BASE_PRICE when no override matches.
 */
export function resolvePerBagPrice(
  pickupPrefix: number | null,
  dropoffPrefix: number | null,
  etapas: number,
): number {
  if (pickupPrefix != null && dropoffPrefix != null) {
    const override = getOverridePrice(pickupPrefix, dropoffPrefix);
    if (override !== null) return override;
  }
  return pricePerBagForEtapas(etapas);
}

export interface PricingInput {
  bagsCount: number;
  overweightBagsCount: number;
  /** Number of real pricing etapas this leg spans (defaults to 1) */
  stagesCount?: number;
  /** External-code prefix of pickup accommodation (for override lookup) */
  pickupPrefix?: number | null;
  /** External-code prefix of dropoff accommodation (for override lookup) */
  dropoffPrefix?: number | null;
}

export interface PricingBreakdown {
  totalBags: number;
  totalOverweightBags: number;
  totalTransportUnits: number;
  normalBags: number;
  discountedBags: number;
  subtotalAmount: number;
  discountAmount: number;
  extraWeightAmount: number;
  totalAmount: number;
  unitPrice: number;
}

/**
 * Calculate full pricing breakdown for a booking.
 *
 * Standard pricing: etapas × 6 €/bag.
 * Override pricing: fixed price per bag for specific code-prefix routes.
 * Volume discount: bags beyond VOLUME_THRESHOLD get VOLUME_DISCOUNT off each.
 */
export function calculatePricing(legs: PricingInput[]): PricingBreakdown {
  const { BASE_PRICE, VOLUME_THRESHOLD, VOLUME_DISCOUNT, OVERWEIGHT_FEE } = PRICING_RULES;

  const totalBags = legs.reduce((s, l) => s + l.bagsCount, 0);
  const totalOverweightBags = legs.reduce((s, l) => s + l.overweightBagsCount, 0);

  let subtotalAmount = 0;
  for (const leg of legs) {
    const perBag = resolvePerBagPrice(
      leg.pickupPrefix ?? null,
      leg.dropoffPrefix ?? null,
      Math.max(1, leg.stagesCount ?? 1),
    );
    subtotalAmount += leg.bagsCount * perBag;
  }

  const discountedBags = Math.max(0, totalBags - VOLUME_THRESHOLD);
  const normalBags = Math.min(totalBags, VOLUME_THRESHOLD);
  const discountAmount = discountedBags * VOLUME_DISCOUNT;
  const extraWeightAmount = totalOverweightBags * OVERWEIGHT_FEE;
  const totalAmount = subtotalAmount - discountAmount + extraWeightAmount;

  return {
    totalBags,
    totalOverweightBags,
    totalTransportUnits: totalBags,
    normalBags,
    discountedBags,
    subtotalAmount,
    discountAmount,
    extraWeightAmount,
    totalAmount,
    unitPrice: BASE_PRICE,
  };
}

/** Format cents-free euro amount for display */
export function formatEUR(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}
