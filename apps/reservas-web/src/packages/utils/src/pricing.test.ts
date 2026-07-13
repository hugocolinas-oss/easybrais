import assert from "node:assert/strict";
import test from "node:test";
import {
  isRouteStageLegValid,
  resolveRouteStagePrice,
  type RoutePricingStage,
} from "./pricing";

const stage = (
  code: number,
  routeSection: RoutePricingStage["routeSection"],
  branchSequence: number,
  priceToRedondela: number | null,
): RoutePricingStage => ({ code, routeSection, branchSequence, priceToRedondela });

const aGuarda = stage(1, "coastal", 1, 24);
const baiona = stage(3, "coastal", 3, 12);
const redondela = stage(5, "shared", 1, 0);
const santiago = stage(13, "shared", 9, null);
const valenca = stage(19, "central", 1, 12);
const tui = stage(18, "central", 2, 12);
const porrinno = stage(17, "central", 3, 6);

test("preserves current coastal and shared prices", () => {
  assert.equal(resolveRouteStagePrice(aGuarda, santiago), 48);
  assert.equal(resolveRouteStagePrice(redondela, santiago), 24);
});

test("prices the Camino Central through the Redondela merge", () => {
  assert.equal(resolveRouteStagePrice(valenca, tui), 6);
  assert.equal(resolveRouteStagePrice(valenca, porrinno), 6);
  assert.equal(resolveRouteStagePrice(tui, porrinno), 6);
  assert.equal(resolveRouteStagePrice(porrinno, redondela), 6);
  assert.equal(resolveRouteStagePrice(valenca, redondela), 12);
  assert.equal(resolveRouteStagePrice(valenca, santiago), 36);
});

test("rejects reverse travel and crossings before Redondela", () => {
  assert.equal(isRouteStageLegValid(tui, valenca), false);
  assert.equal(isRouteStageLegValid(porrinno, tui), false);
  assert.equal(isRouteStageLegValid(tui, baiona), false);
  assert.equal(isRouteStageLegValid(redondela, porrinno), false);
  assert.equal(isRouteStageLegValid(valenca, santiago), true);
});
