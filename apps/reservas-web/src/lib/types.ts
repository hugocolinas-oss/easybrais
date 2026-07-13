export type RouteSection = "coastal" | "central" | "shared";

export interface RouteStage {
  code: number;
  name: string;
  route_section: RouteSection;
  branch_sequence: number;
  price_to_redondela: number | null;
}

export interface Accommodation {
  id: string;
  external_code: string | null;
  name: string;
  display_name: string;
  stage_name: string | null;
  town: string | null;
  address: string | null;
  reservation_notes: string | null;
  sort_order: number;
  route_stage: RouteStage | null;
}

export type BookingType = "single_stage" | "multi_stage" | "full_camino";

export interface StageLeg {
  id: string;
  serviceDate: string;
  departureTown: string;
  pickupAccommodationId: string;
  arrivalTown: string;
  dropoffAccommodationId: string;
  bagsCount: number;
  overweightBagsCount: number;
}

export interface BookingFormData {
  bookingType: BookingType;
  legs: StageLeg[];
  customer: {
    fullName: string;
    email: string;
    phone: string;
    language: string;
    notes: string;
  };
  paymentMethod?: "online" | "cash";
  sourceChannel?: "web" | "phone" | "walk_in" | "other";
}
