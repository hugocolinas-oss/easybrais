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
  VOLUME_THRESHOLD: 0,
  VOLUME_DISCOUNT: 0,
  /** Extra fee per overweight bag (>20 kg) */
  OVERWEIGHT_FEE: 5,
} as const;

export type RouteSection = "coastal" | "central" | "spiritual" | "shared";

export interface RoutePricingStage {
  code: number;
  routeSection: RouteSection;
  branchSequence: number;
  priceToRedondela: number | null;
}

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
 * Explicit, directed tariffs for the Variante Espiritual.
 *
 * Codes 20–23 are kept outside the legacy 1–19 sequence because this route
 * forks at Pontevedra (6) and rejoins at Padrón (11). Missing pairs are not
 * inferred: they are outside the supported mileage and cannot be booked.
 */
const SPIRITUAL_STAGE_CODES = new Set([20, 21, 22, 23]);
const SPIRITUAL_PAIR_PRICES: Record<string, number> = {
  "5:20": 14,  // Redondela → Combarro
  "5:21": 16,  // Redondela → Armenteira
  "5:22": 22,  // Redondela → Ribadumia
  "5:23": 22,  // Redondela → Vilanova
  "6:20": 8,   // Pontevedra → Combarro
  "6:21": 8,   // Pontevedra → Armenteira
  "6:22": 16,  // Pontevedra → Ribadumia
  "6:23": 16,  // Pontevedra → Vilanova
  "20:21": 8,  // Combarro → Armenteira
  "20:22": 16, // Combarro → Ribadumia
  "20:23": 16, // Combarro → Vilanova
  "20:11": 32, // Combarro → Padrón
  "21:22": 8,  // Armenteira → Ribadumia
  "21:23": 8,  // Armenteira → Vilanova
  "22:23": 8,  // Ribadumia → Vilanova
  "21:11": 24, // Armenteira → Padrón
  "22:11": 24, // Ribadumia → Padrón
  "23:11": 16, // Vilanova → Padrón
};

export type RouteStageLegIssue = "reverse_direction" | "excess_mileage";

function involvesSpiritualRoute(pickup: RoutePricingStage, dropoff: RoutePricingStage): boolean {
  return SPIRITUAL_STAGE_CODES.has(pickup.code) || SPIRITUAL_STAGE_CODES.has(dropoff.code);
}

export function getRouteStageLegIssue(
  pickup: RoutePricingStage,
  dropoff: RoutePricingStage,
): RouteStageLegIssue | null {
  if (pickup.code === dropoff.code) return null;

  if (involvesSpiritualRoute(pickup, dropoff)) {
    const directKey = `${pickup.code}:${dropoff.code}`;
    if (SPIRITUAL_PAIR_PRICES[directKey] != null) return null;
    const reverseKey = `${dropoff.code}:${pickup.code}`;
    return SPIRITUAL_PAIR_PRICES[reverseKey] != null
      ? "reverse_direction"
      : "excess_mileage";
  }

  if (pickup.routeSection === "shared") {
    return dropoff.routeSection === "shared" && dropoff.branchSequence >= pickup.branchSequence
      ? null
      : "reverse_direction";
  }

  if (dropoff.routeSection === "shared") return null;
  return pickup.routeSection === dropoff.routeSection
    && dropoff.branchSequence >= pickup.branchSequence
    ? null
    : "reverse_direction";
}

/**
 * Resolve the price per bag for a pair of external_code prefixes.
 *
 * - Same code: minimum 1 etapa = BASE_PRICE.
 * - Both ≤ 4: linear stages, diff × BASE_PRICE.
 * - Both ≥ 5: direct PAIR_PRICES lookup.
 * - Mixed (one ≤ 4, other ≥ 5): stages to code 5 + lookup from 5.
 */
/** Max valid code in the route (Santiago = 13) */
const MAX_VALID_CODE = 13;
/** Maximum per-bag price (full camino A Guarda→Santiago = 8 etapas) */
const MAX_PER_BAG = 48;

function getDirectPrice(a: number, b: number): number {
  const { BASE_PRICE } = PRICING_RULES;

  // Guard against invalid codes (e.g. 9999 from data bugs)
  if (a > MAX_VALID_CODE || b > MAX_VALID_CODE || a < 1 || b < 1) {
    return BASE_PRICE;
  }

  if (a === b) return BASE_PRICE;

  const [lo, hi] = a <= b ? [a, b] : [b, a];

  if (hi <= 4) return Math.min((hi - lo) * BASE_PRICE, MAX_PER_BAG);

  if (lo >= 5) {
    return PAIR_PRICES[`${lo}:${hi}`] ?? Math.min(Math.abs(hi - lo) * BASE_PRICE, MAX_PER_BAG);
  }

  // Mixed: lo ≤ 4, hi ≥ 5 — route goes through code 5
  const toFive = (5 - lo) * BASE_PRICE;
  if (hi === 5) return Math.min(toFive, MAX_PER_BAG);
  return Math.min(toFive + (PAIR_PRICES[`5:${hi}`] ?? (hi - 5) * BASE_PRICE), MAX_PER_BAG);
}

export function isRouteStageLegValid(
  pickup: RoutePricingStage,
  dropoff: RoutePricingStage,
): boolean {
  return getRouteStageLegIssue(pickup, dropoff) === null;
}

export function resolveRouteStagePrice(
  pickup: RoutePricingStage,
  dropoff: RoutePricingStage,
): number {
  const { BASE_PRICE } = PRICING_RULES;
  if (!isRouteStageLegValid(pickup, dropoff)) return BASE_PRICE;

  if (involvesSpiritualRoute(pickup, dropoff)) {
    if (pickup.code === dropoff.code) return BASE_PRICE;
    return SPIRITUAL_PAIR_PRICES[`${pickup.code}:${dropoff.code}`] ?? BASE_PRICE;
  }

  if (pickup.routeSection === "shared" && dropoff.routeSection === "shared") {
    return getDirectPrice(pickup.code, dropoff.code);
  }

  if (dropoff.routeSection === "shared") {
    const toRedondela = pickup.priceToRedondela ?? BASE_PRICE;
    const afterRedondela = dropoff.code === 5 ? 0 : getDirectPrice(5, dropoff.code);
    return Math.max(BASE_PRICE, toRedondela + afterRedondela);
  }

  const pickupToMerge = pickup.priceToRedondela ?? 0;
  const dropoffToMerge = dropoff.priceToRedondela ?? 0;
  return Math.max(BASE_PRICE, Math.abs(pickupToMerge - dropoffToMerge));
}

/** Compute the approximate number of pricing etapas between two codes (for display). */
export function getRealEtapas(pickupPrefix: number, dropoffPrefix: number): number {
  const price = getDirectPrice(pickupPrefix, dropoffPrefix);
  return Math.max(1, Math.round(price / PRICING_RULES.BASE_PRICE));
}

export function getRealEtapasForStages(
  pickup: RoutePricingStage,
  dropoff: RoutePricingStage,
): number {
  return Math.max(1, Math.round(resolveRouteStagePrice(pickup, dropoff) / PRICING_RULES.BASE_PRICE));
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
  pickupStage?: RoutePricingStage | null;
  dropoffStage?: RoutePricingStage | null;
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
    const perBag = leg.pickupStage && leg.dropoffStage
      ? resolveRouteStagePrice(leg.pickupStage, leg.dropoffStage)
      : resolvePerBagPrice(
          leg.pickupPrefix ?? null,
          leg.dropoffPrefix ?? null,
          Math.max(1, leg.stagesCount ?? 1),
        );
    subtotalAmount += leg.bagsCount * perBag;
  }

  const discountedBags = Math.max(0, totalBags - VOLUME_THRESHOLD);
  const normalBags = Math.min(totalBags, VOLUME_THRESHOLD);
  const discountAmount = discountedBags * VOLUME_DISCOUNT;

  let extraWeightAmount = 0;
  for (const leg of legs) {
    const etapas = leg.pickupStage && leg.dropoffStage
      ? getRealEtapasForStages(leg.pickupStage, leg.dropoffStage)
      : (leg.pickupPrefix != null && leg.dropoffPrefix != null)
        ? getRealEtapas(leg.pickupPrefix, leg.dropoffPrefix)
        : Math.max(1, leg.stagesCount ?? 1);
    extraWeightAmount += leg.overweightBagsCount * OVERWEIGHT_FEE * etapas;
  }

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
