/**
 * Easy Brais — Pricing engine (beta)
 *
 * Single source of truth for price calculations.
 * Used both client-side (preview) and server-side (authoritative).
 * Change rules here → changes propagate everywhere.
 */

export const PRICING_RULES = {
  /** Price per bag per stage */
  BASE_PRICE: 6,
  /** Number of transport-units that fit in the normal tier (inclusive) */
  VOLUME_THRESHOLD: 9,
  /** Price per transport-unit from VOLUME_THRESHOLD+1 onwards */
  REDUCED_PRICE: 5,
  /** Extra fee per overweight bag (>20 kg) */
  OVERWEIGHT_FEE: 5,
} as const;

export interface PricingInput {
  bagsCount: number;
  overweightBagsCount: number;
  /** Number of stages this leg spans (defaults to 1) */
  stagesCount?: number;
}

export interface PricingBreakdown {
  totalBags: number;
  totalOverweightBags: number;
  /** Effective transport units (bags × stages per leg) */
  totalTransportUnits: number;
  /** Transport units charged at BASE_PRICE */
  normalBags: number;
  /** Transport units charged at REDUCED_PRICE */
  discountedBags: number;
  /** totalTransportUnits × BASE_PRICE (before volume discount) */
  subtotalAmount: number;
  /** Volume savings: discountedBags × (BASE_PRICE − REDUCED_PRICE) */
  discountAmount: number;
  /** totalOverweightBags × OVERWEIGHT_FEE */
  extraWeightAmount: number;
  /** subtotalAmount − discountAmount + extraWeightAmount */
  totalAmount: number;
  /** BASE_PRICE — for persisting on line items */
  unitPrice: number;
}

/**
 * Calculate full pricing breakdown for a booking.
 * Accepts an array of legs (one per booking_item).
 * Each leg's cost = bagsCount × stagesCount × pricePerUnit.
 */
export function calculatePricing(legs: PricingInput[]): PricingBreakdown {
  const totalBags = legs.reduce((s, l) => s + l.bagsCount, 0);
  const totalOverweightBags = legs.reduce((s, l) => s + l.overweightBagsCount, 0);

  const totalTransportUnits = legs.reduce(
    (s, l) => s + l.bagsCount * Math.max(1, l.stagesCount ?? 1),
    0,
  );

  const { BASE_PRICE, VOLUME_THRESHOLD, REDUCED_PRICE, OVERWEIGHT_FEE } = PRICING_RULES;

  const normalBags = Math.min(totalTransportUnits, VOLUME_THRESHOLD);
  const discountedBags = Math.max(totalTransportUnits - VOLUME_THRESHOLD, 0);

  const subtotalAmount = totalTransportUnits * BASE_PRICE;
  const discountAmount = discountedBags * (BASE_PRICE - REDUCED_PRICE);
  const extraWeightAmount = totalOverweightBags * OVERWEIGHT_FEE;
  const totalAmount = subtotalAmount - discountAmount + extraWeightAmount;

  return {
    totalBags,
    totalOverweightBags,
    totalTransportUnits,
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
