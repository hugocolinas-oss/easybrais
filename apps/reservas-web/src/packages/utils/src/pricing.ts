/**
 * Easy Brais — Pricing engine
 *
 * Single source of truth for price calculations.
 * Used both client-side (preview) and server-side (authoritative).
 *
 * Camino Portugués por la Costa — 8 etapas.
 * Precio base por mochila = etapas × 6 €  (camino completo = 48 €).
 *
 * Codes 1–4 son lineales (1 etapa = 1 código de diferencia).
 * Codes 5–13 usan una tabla directa de precios por par de códigos,
 * ya que las distancias entre paradas no son lineales
 * (ej: 7→11 = 3 etapas pero 8→11 = 1 etapa).
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
 * Direct price per bag for each code-prefix pair (codes 5–13).
 * Key: "lo:hi" where lo ≤ hi.
 *
 * Half-etapa routes (1.5, 2.5 etapas) cost floor(etapas)×6 + 2 €.
 *
 *  Code 5 = Redondela       Code 10 = Pontecesures
 *  Code 6 = Pontevedra      Code 11 = Padrón
 *  Code 7 = Portela          Code 12 = Escravitude
 *  Code 8 = Caldas de Reis   Code 13 = Santiago
 *  Code 9 = Valga
 */
const PAIR_PRICES: Record<string, number> = {
  // Desde Redondela (5)
  "5:6": 6,   // 1 etapa
  "5:7": 8,   // 1.5 etapas
  "5:8": 12,  // 2 etapas
  "5:9": 14,  // 2.5 etapas
  "5:10": 18, // 3 etapas
  "5:11": 18, // 3 etapas
  "5:12": 24, // 4 etapas
  "5:13": 24, // 4 etapas
  // Desde Pontevedra (6)
  "6:7": 6,   // 1 etapa
  "6:8": 6,   // 1 etapa
  "6:9": 8,   // 1.5 etapas
  "6:10": 12, // 2 etapas
  "6:11": 12, // 2 etapas
  "6:12": 14, // 2.5 etapas
  "6:13": 18, // 3 etapas
  // Desde Portela (7)
  "7:8": 6,   // 1 etapa
  "7:9": 6,   // 1 etapa
  "7:10": 12, // 2 etapas
  "7:11": 12, // 2 etapas
  "7:12": 18, // 3 etapas
  "7:13": 24, // 4 etapas
  // Desde Caldas (8)
  "8:9": 6,   // 1 etapa
  "8:10": 6,  // 1 etapa
  "8:11": 6,  // 1 etapa
  "8:12": 8,  // 1.5 etapas
  "8:13": 12, // 2 etapas
  // Desde Valga (9)
  "9:10": 6,  // 1 etapa
  "9:11": 6,  // 1 etapa
  "9:12": 6,  // 1 etapa
  "9:13": 12, // 2 etapas
  // Desde Pontecesures (10)
  "10:11": 6, // 1 etapa
  "10:12": 6, // 1 etapa
  "10:13": 6, // 1 etapa
  // Desde Padrón (11)
  "11:12": 6, // 1 etapa
  "11:13": 6, // 1 etapa
  // Desde Escravitude (12)
  "12:13": 6, // 1 etapa
};

/**
 * Resolve the price per bag for a pair of external_code prefixes.
 *
 * - Same code: minimum 1 etapa = BASE_PRICE.
 * - Both ≤ 4: linear stages, diff × BASE_PRICE.
 * - Both ≥ 5: direct PAIR_PRICES lookup.
 * - Mixed (one ≤ 4, other ≥ 5): stages to code 5 + lookup from 5.
 */
function getDirectPrice(a: number, b: number): number {
  const { BASE_PRICE } = PRICING_RULES;

  if (a === b) return BASE_PRICE;

  const [lo, hi] = a <= b ? [a, b] : [b, a];

  if (hi <= 4) return (hi - lo) * BASE_PRICE;

  if (lo >= 5) {
    return PAIR_PRICES[`${lo}:${hi}`] ?? Math.abs(hi - lo) * BASE_PRICE;
  }

  // Mixed: lo ≤ 4, hi ≥ 5 — route goes through code 5
  const toFive = (5 - lo) * BASE_PRICE;
  if (hi === 5) return toFive;
  return toFive + (PAIR_PRICES[`5:${hi}`] ?? (hi - 5) * BASE_PRICE);
}

/** Compute the approximate number of pricing etapas between two codes (for display). */
export function getRealEtapas(pickupPrefix: number, dropoffPrefix: number): number {
  const price = getDirectPrice(pickupPrefix, dropoffPrefix);
  return Math.max(1, Math.round(price / PRICING_RULES.BASE_PRICE));
}

/**
 * Resolve the per-bag price for a leg.
 * When code prefixes are known, uses the direct price table.
 * Falls back to etapas × BASE_PRICE when codes are unavailable.
 */
export function resolvePerBagPrice(
  pickupPrefix: number | null,
  dropoffPrefix: number | null,
  etapas: number = 1,
): number {
  if (pickupPrefix != null && dropoffPrefix != null) {
    return getDirectPrice(pickupPrefix, dropoffPrefix);
  }
  return PRICING_RULES.BASE_PRICE * Math.max(1, etapas);
}

export interface PricingInput {
  bagsCount: number;
  overweightBagsCount: number;
  /** Fallback etapa count when code prefixes are unavailable */
  stagesCount?: number;
  /** External-code prefix of pickup accommodation */
  pickupPrefix?: number | null;
  /** External-code prefix of dropoff accommodation */
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
 * Per-leg pricing uses direct table lookup when code prefixes are available.
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
