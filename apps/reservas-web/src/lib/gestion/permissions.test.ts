import assert from "node:assert/strict";
import test from "node:test";
import { canDeleteBookings, canEditBookingPricing } from "./permissions";

test("operators can edit booking pricing", () => {
  assert.equal(canEditBookingPricing("operator"), true);
});

test("booking pricing remains editable for managers and admins", () => {
  assert.equal(canEditBookingPricing("manager"), true);
  assert.equal(canEditBookingPricing("admin"), true);
});

test("drivers cannot edit booking pricing", () => {
  assert.equal(canEditBookingPricing("chofer"), false);
});

test("booking staff can delete bookings", () => {
  assert.equal(canDeleteBookings("admin"), true);
  assert.equal(canDeleteBookings("operator"), true);
  assert.equal(canDeleteBookings("manager"), true);
  assert.equal(canDeleteBookings("chofer"), false);
});
