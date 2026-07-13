import assert from "node:assert/strict";
import test from "node:test";
import {
  isPhoneValueValid,
  normalizePhoneValue,
  splitPhoneNumber,
} from "./phone";

test("preserves the selected country for national numbers", () => {
  const parsed = splitPhoneNumber("912 345 678", "PT");

  assert.equal(parsed.country.code, "PT");
  assert.equal(normalizePhoneValue(parsed.nationalNumber, parsed.country.code), "+351912345678");
});

test("keeps the preferred country for shared calling codes", () => {
  assert.equal(splitPhoneNumber("+1 416 555 0100", "CA").country.code, "CA");
  assert.equal(splitPhoneNumber("+1 787 555 0100", "PR").country.code, "PR");
});

test("normalizes pasted international prefixes", () => {
  assert.equal(normalizePhoneValue("00351 912 345 678"), "+351912345678");
  assert.equal(normalizePhoneValue("+44 (7700) 900-123"), "+447700900123");
});

test("rejects incomplete and oversized phone values", () => {
  assert.equal(isPhoneValueValid("+351 912 345 678"), true);
  assert.equal(isPhoneValueValid("123"), false);
  assert.equal(isPhoneValueValid("+1234567890123456"), false);
});
