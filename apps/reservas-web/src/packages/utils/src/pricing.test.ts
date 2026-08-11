import assert from "node:assert/strict";
import test from "node:test";
import {
  getRouteStageLegIssue,
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
const pontevedra = stage(6, "shared", 2, null);
const combarro = stage(20, "spiritual", 1, null);
const armenteira = stage(21, "spiritual", 2, null);
const ribadumia = stage(22, "spiritual", 3, null);
const vilanova = stage(23, "spiritual", 4, null);
const padron = stage(11, "shared", 7, null);

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

test("uses the confirmed Variante Espiritual tariffs", () => {
  assert.equal(resolveRouteStagePrice(redondela, combarro), 14);
  assert.equal(resolveRouteStagePrice(redondela, armenteira), 16);
  assert.equal(resolveRouteStagePrice(redondela, ribadumia), 22);
  assert.equal(resolveRouteStagePrice(redondela, vilanova), 22);
  assert.equal(resolveRouteStagePrice(pontevedra, combarro), 8);
  assert.equal(resolveRouteStagePrice(pontevedra, armenteira), 8);
  assert.equal(resolveRouteStagePrice(pontevedra, ribadumia), 16);
  assert.equal(resolveRouteStagePrice(pontevedra, vilanova), 16);
  assert.equal(resolveRouteStagePrice(combarro, armenteira), 8);
  assert.equal(resolveRouteStagePrice(combarro, ribadumia), 16);
  assert.equal(resolveRouteStagePrice(combarro, vilanova), 16);
  assert.equal(resolveRouteStagePrice(combarro, padron), 32);
  assert.equal(resolveRouteStagePrice(armenteira, ribadumia), 8);
  assert.equal(resolveRouteStagePrice(armenteira, vilanova), 8);
  assert.equal(resolveRouteStagePrice(ribadumia, vilanova), 8);
  assert.equal(resolveRouteStagePrice(armenteira, padron), 24);
  assert.equal(resolveRouteStagePrice(ribadumia, padron), 24);
  assert.equal(resolveRouteStagePrice(vilanova, padron), 16);
  assert.equal(resolveRouteStagePrice(pontevedra, padron), 12);
});

test("marks unpriced Variante Espiritual legs as excess mileage", () => {
  assert.equal(getRouteStageLegIssue(combarro, santiago), "excess_mileage");
  assert.equal(getRouteStageLegIssue(armenteira, pontevedra), "reverse_direction");
});
