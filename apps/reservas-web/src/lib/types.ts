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
}
