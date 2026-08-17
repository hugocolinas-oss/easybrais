import assert from "node:assert/strict";
import test from "node:test";
import { validateBookingCustomerUpdate } from "./booking-customer-validation";

const validInput = {
  fullName: " Cliente de prueba ",
  email: "CLIENTE@example.com ",
  phone: "+34 600 111 222",
  language: "ES",
  notes: " Observación ",
};

test("normalizes valid customer updates", () => {
  const result = validateBookingCustomerUpdate(validInput);
  assert.deepEqual(result, {
    data: {
      fullName: "Cliente de prueba",
      email: "cliente@example.com",
      phone: "+34600111222",
      language: "es",
      notes: "Observación",
    },
  });
});

test("rejects malformed server-action payloads", () => {
  assert.equal(validateBookingCustomerUpdate(null).error, "Datos personales inválidos.");
  assert.equal(validateBookingCustomerUpdate({ ...validInput, email: { forged: true } }).error, "Datos personales inválidos.");
  assert.equal(validateBookingCustomerUpdate({ ...validInput, language: "xx" }).error, "El idioma no es válido.");
});

test("rejects invalid and oversized personal fields", () => {
  assert.equal(validateBookingCustomerUpdate({ ...validInput, email: "not-an-email" }).error, "El email no es válido.");
  assert.equal(validateBookingCustomerUpdate({ ...validInput, phone: "123" }).error, "El teléfono no es válido.");
  assert.equal(validateBookingCustomerUpdate({ ...validInput, notes: "x".repeat(501) }).error, "Las observaciones son demasiado largas.");
});
