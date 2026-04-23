/**
 * Easy Brais — Pricing engine
 *
 * Single source of truth for price calculations.
 * Used both client-side (preview) and server-side (authoritative).
 *
 * Camino Portugués por la Costa — 8 etapas.
 * Precio por mochila = 6 € (1 etapa) + 2 € por cada etapa adicional.
 */

export const PRICING_RULES = {
  /** Base price per bag for a single etapa */
  BASE_PRICE: 6,
  /** Extra per bag for each additional etapa beyond the first */
  STAGE_SURCHARGE: 2,
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

/** Price per bag for a given number of real etapas. */
export function pricePerBagForEtapas(realEtapas: number): number {
  const { BASE_PRICE, STAGE_SURCHARGE } = PRICING_RULES;
  return BASE_PRICE + Math.max(0, realEtapas - 1) * STAGE_SURCHARGE;
}

export interface PricingInput {
  bagsCount: number;
  overweightBagsCount: number;
  /** Number of real pricing etapas this leg spans (defaults to 1) */
  stagesCount?: number;
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
 * Pricing per bag = BASE_PRICE + (etapas − 1) × STAGE_SURCHARGE
 *   1 etapa → 6 €   |   2 etapas → 8 €   |   3 etapas → 10 €
 *
 * Volume discount: bags beyond VOLUME_THRESHOLD get VOLUME_DISCOUNT off each.
 */
export function calculatePricing(legs: PricingInput[]): PricingBreakdown {
  const { BASE_PRICE, VOLUME_THRESHOLD, VOLUME_DISCOUNT, OVERWEIGHT_FEE } = PRICING_RULES;

  const totalBags = legs.reduce((s, l) => s + l.bagsCount, 0);
  const totalOverweightBags = legs.reduce((s, l) => s + l.overweightBagsCount, 0);

  let subtotalAmount = 0;
  for (const leg of legs) {
    const perBag = pricePerBagForEtapas(Math.max(1, leg.stagesCount ?? 1));
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
