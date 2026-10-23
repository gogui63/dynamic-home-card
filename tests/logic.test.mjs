import test from "node:test";
import assert from "node:assert/strict";
import { resolveWorld, resolveEffect, weatherScene, modelHour, greetingKey, checkVisibility, chipValue, normalizeChip, applyOvercast, WEATHER_DEFAULTS, WORLDS, EFFECTS } from "../src/logic.js";
import { ENGINE } from "../src/engine/aurora-engine.js";

test("worlds: English ids, Aurora ids, default, unknown", () => {
  assert.equal(resolveWorld(undefined), "house");
  assert.equal(resolveWorld("Japan"), "japan");
  assert.equal(resolveWorld("casetta"), "house");
  assert.equal(resolveWorld("mars"), null);
  for (const [pub, eng] of Object.entries(WORLDS)) assert.ok(ENGINE.AMB.W[eng], `engine world ${eng} for ${pub}`);
});

test("effects: English ids, Aurora ids, auto/none, unknown", () => {
  assert.equal(resolveEffect(undefined), "auto");
  assert.equal(resolveEffect("none"), "none");
  assert.equal(resolveEffect("pioggia"), "rain");
  assert.equal(resolveEffect("hail"), null);
  for (const [pub, eng] of Object.entries(EFFECTS)) assert.ok(ENGINE.FX.E[eng], `engine effect ${eng} for ${pub}`);
});

test("weather mapping covers every HA condition and only uses known effects", () => {
  const conds = ["clear-night", "cloudy", "exceptional", "fog", "hail", "lightning", "lightning-rainy", "partlycloudy", "pouring", "rainy", "snowy", "snowy-rainy", "sunny", "windy", "windy-variant"];
  assert.deepEqual(Object.keys(WEATHER_DEFAULTS).sort(), conds.sort());
  for (const c of conds) { const s = weatherScene(c, {}); assert.ok(s.effect === null || EFFECTS[s.effect], c); }
  assert.deepEqual(weatherScene("rainy", {}), { effect: "rain", intensity: 1, overcast: 0.7 });
  assert.equal(weatherScene("sunny", {}).effect, null);
  assert.equal(weatherScene("unknown-state", {}).effect, null);
  assert.equal(weatherScene(null, {}).overcast, 0);
});

test("weather mapping overrides, intensity multiplier, weather_sky off", () => {
  assert.equal(weatherScene("rainy", { weather_effects: { rainy: "petals" } }).effect, "petals");
  assert.equal(weatherScene("rainy", { weather_effects: { rainy: "none" } }).effect, null);
  const o = weatherScene("sunny", { weather_effects: { sunny: { effect: "fireflies", intensity: 2, overcast: 0.1 } } });
  assert.deepEqual(o, { effect: "fireflies", intensity: 2, overcast: 0.1 });
  assert.equal(weatherScene("pouring", { effect_intensity: 0.5 }).intensity, 0.9);
  assert.equal(weatherScene("cloudy", { weather_sky: false }).overcast, 0);
});

test("model hour follows the real sun", () => {
  const at = (h, m) => new Date(2026, 9, 23, h, m);
  const sun = { attributes: { next_rising: new Date(2026, 9, 24, 8, 15).toISOString(), next_setting: new Date(2026, 9, 23, 18, 40).toISOString() } };
  assert.ok(Math.abs(modelHour(at(8, 15), sun) - 6.5) < 0.01, "real sunrise -> dawn colours");
  assert.ok(Math.abs(modelHour(at(18, 40), sun) - 18.5) < 0.01, "real sunset -> dusk colours");
  assert.equal(modelHour(at(0, 0), sun), 0);
  assert.ok(Math.abs(modelHour(at(13, 0), null) - 13) < 1e-9, "no sun entity -> clock");
  const polar = { attributes: { next_rising: new Date(2026, 9, 24, 0, 10).toISOString(), next_setting: new Date(2026, 9, 23, 23, 55).toISOString() } };
  assert.ok(Math.abs(modelHour(at(10, 0), polar) - 10) < 1e-9, "unusable values -> clock");
});

test("greetings", () => {
  assert.equal(greetingKey(3), "night");
  assert.equal(greetingKey(9), "morning");
  assert.equal(greetingKey(15), "afternoon");
  assert.equal(greetingKey(20.7), "evening");
  assert.equal(greetingKey(22), "night");
});

test("visibility conditions", () => {
  const hass = { states: { "a.b": { state: "on" }, "s.n": { state: "12" } }, user: { id: "u1" } };
  assert.equal(checkVisibility([{ condition: "state", entity: "a.b", state: "on" }], hass), true);
  assert.equal(checkVisibility([{ condition: "state", entity: "a.b", state_not: ["on", "x"] }], hass), false);
  assert.equal(checkVisibility([{ condition: "numeric_state", entity: "s.n", above: 10, below: 20 }], hass), true);
  assert.equal(checkVisibility([{ condition: "numeric_state", entity: "s.n", above: 15 }], hass), false);
  assert.equal(checkVisibility([{ condition: "user", users: ["u2"] }], hass), false);
  assert.equal(checkVisibility([{ condition: "or", conditions: [{ condition: "state", entity: "a.b", state: "off" }, { condition: "user", users: ["u1"] }] }], hass), true);
  assert.equal(checkVisibility([{ condition: "not", conditions: [{ condition: "state", entity: "a.b", state: "on" }] }], hass), false);
  assert.equal(checkVisibility(undefined, hass), true);
});

test("chip values", () => {
  const s = { state: "4.2", attributes: { unit_of_measurement: "€", "Libellé": "Très faible" } };
  assert.equal(chipValue({ decimals: 2 }, s, null, "fr-FR"), "4,20 €");
  assert.equal(chipValue({ attribute: "Libellé" }, s, null, "fr-FR"), "Très faible");
  assert.equal(chipValue({}, { state: "Gibbeuse croissante", attributes: {} }, null, "fr"), "Gibbeuse croissante");
  const hass = { formatEntityState: () => "4,2 €" };
  assert.equal(chipValue({}, s, hass, "fr"), "4,2 €", "uses HA formatter when available");
});

test("chip normalisation", () => {
  assert.deepEqual(normalizeChip("weather"), { type: "weather" });
  assert.deepEqual(normalizeChip("sensor.x"), { type: "entity", entity: "sensor.x" });
  assert.equal(normalizeChip("nonsense"), null);
  assert.equal(normalizeChip({ name: "x" }), null);
  assert.equal(normalizeChip({ content: "{{ 1 }}" }).type, "entity");
});

test("overcast greys the sky without mutating the engine palette", () => {
  const K = ENGINE.AMB.palette(12), B = ENGINE.AMB.body(12);
  const r = applyOvercast(K, B, 0.8, ENGINE.AMB.mix);
  assert.notEqual(r.K.s1, K.s1);
  assert.ok(r.K.cl > K.cl);
  assert.ok(r.B.sun.vis < B.sun.vis);
  assert.equal(ENGINE.AMB.palette(12).s1, K.s1);
});
