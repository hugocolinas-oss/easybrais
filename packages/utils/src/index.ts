export { cn } from "./cn";
export { formatDate, fmtDateShort, formatTime } from "./format";
export {
  PRICING_RULES,
  getRealEtapas,
  getRealEtapasForStages,
  resolvePerBagPrice,
  resolveRouteStagePrice,
  isRouteStageLegValid,
  calculatePricing,
  formatEUR,
  type PricingInput,
  type PricingBreakdown,
  type RoutePricingStage,
  type RouteSection,
} from "./pricing";

export {
  createBrowserClient,
  createServerClient,
  createAdminClient,
  createMiddlewareClient,
} from "./supabase";

export { signIn, signUp, signOut, getUser, getSession } from "./auth";

// Email module excluded from barrel — uses Node.js-only deps (nodemailer).
// Import server-side via: import { ... } from "@easybrais/utils/email";
