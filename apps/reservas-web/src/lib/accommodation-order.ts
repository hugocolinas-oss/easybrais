import type { Accommodation, RouteSection, RouteStage } from "@/lib/types";
import {
  getRouteStageLegIssue,
  isRouteStageLegValid,
  type RoutePricingStage,
  type RouteStageLegIssue,
} from "@easybrais/utils";

function parseCodeParts(code: string | null): [number, number] | null {
  if (!code) return null;

  const match = code.trim().match(/^(-?\d+)(?:[.-](\d+))?/);
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

const SECTION_ORDER: Record<RouteSection, number> = {
  coastal: 0,
  central: 1,
  shared: 2,
  spiritual: 3,
};

export function getAccommodationRouteStage(
  acc: Pick<Accommodation, "external_code" | "route_stage">,
): RouteStage | null {
  if (acc.route_stage) return acc.route_stage;

  const code = getAccommodationPricingPrefix(acc);
  if (code === null) return null;

  if (code >= 1 && code <= 4) {
    return {
      code,
      name: "",
      route_section: "coastal",
      branch_sequence: code,
      price_to_redondela: (5 - code) * 6,
    };
  }
  if (code >= 5 && code <= 13) {
    return {
      code,
      name: "",
      route_section: "shared",
      branch_sequence: code - 4,
      price_to_redondela: code === 5 ? 0 : null,
    };
  }
  return null;
}

export function isValidAccommodationLeg(
  pickup: Pick<Accommodation, "external_code" | "route_stage">,
  dropoff: Pick<Accommodation, "external_code" | "route_stage">,
): boolean {
  const from = getAccommodationRouteStage(pickup);
  const to = getAccommodationRouteStage(dropoff);
  if (!from || !to) return false;
  return isRouteStageLegValid(toPricingStage(from), toPricingStage(to));
}

export function getAccommodationLegIssue(
  pickup: Pick<Accommodation, "external_code" | "route_stage">,
  dropoff: Pick<Accommodation, "external_code" | "route_stage">,
): RouteStageLegIssue | null {
  const from = getAccommodationRouteStage(pickup);
  const to = getAccommodationRouteStage(dropoff);
  if (!from || !to) return "excess_mileage";
  return getRouteStageLegIssue(toPricingStage(from), toPricingStage(to));
}

export function isSpiritualAccommodationLeg(
  pickup: Pick<Accommodation, "external_code" | "route_stage">,
  dropoff: Pick<Accommodation, "external_code" | "route_stage">,
): boolean {
  const from = getAccommodationRouteStage(pickup);
  const to = getAccommodationRouteStage(dropoff);
  return from?.route_section === "spiritual"
    || to?.route_section === "spiritual"
    || (from?.code === 6 && to?.code === 11);
}

function toPricingStage(stage: RouteStage): RoutePricingStage {
  return {
    code: stage.code,
    routeSection: stage.route_section,
    branchSequence: stage.branch_sequence,
    priceToRedondela: stage.price_to_redondela,
  };
}

export function getAccommodationPricingStage(
  acc: Pick<Accommodation, "external_code" | "route_stage">,
): RoutePricingStage | null {
  const stage = getAccommodationRouteStage(acc);
  return stage ? toPricingStage(stage) : null;
}

export function getAccommodationSequence(
  acc: Pick<Accommodation, "external_code" | "sort_order" | "route_stage">,
): number | null {
  const stage = getAccommodationRouteStage(acc);
  if (stage) {
    const minor = parseCodeParts(acc.external_code)?.[1] ?? 0;
    return SECTION_ORDER[stage.route_section] * 100_000 + stage.branch_sequence * 1_000 + minor;
  }

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
  a: Pick<Accommodation, "external_code" | "sort_order" | "name" | "display_name" | "route_stage">,
  b: Pick<Accommodation, "external_code" | "sort_order" | "name" | "display_name" | "route_stage">,
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
