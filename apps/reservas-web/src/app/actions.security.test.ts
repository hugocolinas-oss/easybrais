import assert from "node:assert/strict";
import test from "node:test";
import type { BookingFormData } from "@/lib/types";
import { validateBookingRequest, validatePublicBookingRequest } from "@/lib/booking-validation";

const PICKUP_ID = "11111111-1111-4111-8111-111111111111";
const DROPOFF_ID = "22222222-2222-4222-8222-222222222222";
const IDEMPOTENCY_KEY = "33333333-3333-4333-8333-333333333333";

function futureDate(years = 1): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function validBooking(): BookingFormData {
  return {
    bookingType: "single_stage",
    sourceChannel: "web",
    accommodationPolicyAccepted: true,
    paymentMethod: "cash",
    customer: {
      fullName: "Cliente de prueba",
      email: "security-test@example.com",
      phone: "+34600111222",
      language: "es",
      notes: "",
    },
    legs: [{
      id: "test-leg",
      serviceDate: futureDate(),
      departureTown: "Origen",
      pickupAccommodationId: PICKUP_ID,
      arrivalTown: "Destino",
      dropoffAccommodationId: DROPOFF_ID,
      bagsCount: 1,
      overweightBagsCount: 0,
    }],
  };
}

function rejects(
  mutate: (booking: BookingFormData) => void,
  expectedMessage: string | RegExp,
  idempotencyKey = IDEMPOTENCY_KEY,
) {
  const booking = validBooking();
  mutate(booking);
  const error = validateBookingRequest(booking, idempotencyKey);
  assert.notEqual(error, null);
  if (typeof expectedMessage === "string") assert.equal(error, expectedMessage);
  else assert.match(error ?? "", expectedMessage);
}

test("rejects malformed identity and contact fields before database access", () => {
  rejects((booking) => { booking.customer.fullName = "x".repeat(121); }, "El nombre es demasiado largo.");
  rejects((booking) => { booking.customer.email = "attacker@example.com' OR 1=1 --"; }, "El email no es válido.");
  rejects((booking) => { booking.customer.phone = "123"; }, "El teléfono no es válido.");
  rejects((booking) => { booking.customer.notes = "<script>alert(1)</script>".repeat(30); }, "Las observaciones son demasiado largas.");
});

test("rejects oversized and malformed itinerary payloads before database access", () => {
  rejects((booking) => { booking.legs = Array.from({ length: 11 }, () => ({ ...booking.legs[0]! })); }, /No se permiten más de 10 tramos/);
  rejects((booking) => { booking.legs[0]!.serviceDate = "2026-02-30"; }, /fecha de servicio no es válida/);
  rejects((booking) => { booking.legs[0]!.pickupAccommodationId = "../../etc/passwd"; }, /falta el alojamiento de recogida/);
  rejects((booking) => { booking.legs[0]!.dropoffAccommodationId = PICKUP_ID; }, /recogida y entrega deben ser distintos/);
  rejects((booking) => { booking.legs[0]!.bagsCount = 51; }, /número de mochilas no es válido/);
  rejects((booking) => { booking.legs[0]!.bagsCount = 1.5; }, /número de mochilas no es válido/);
  rejects((booking) => { booking.legs[0]!.overweightBagsCount = 2; }, /mochilas con sobrepeso no es válido/);
});

test("rejects forged request controls before database access", () => {
  rejects(() => {}, "Solicitud inválida.", "not-a-uuid");

  const missingPolicy = validBooking();
  missingPolicy.accommodationPolicyAccepted = false;
  assert.match(validatePublicBookingRequest(missingPolicy) ?? "", /Debes confirmar/);

  const distantBooking = validBooking();
  distantBooking.legs[0]!.serviceDate = futureDate(3);
  assert.match(validatePublicBookingRequest(distantBooking) ?? "", /próximos dos años/);
});
