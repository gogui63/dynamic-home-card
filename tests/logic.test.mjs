import test from "node:test";
import assert from "node:assert/strict";
import { resolveWorld, resolveEffect, weatherScene, modelHour, greetingKey, checkVisibility, chipValue, normalizeChip, applyOvercast, WEATHER_DEFAULTS, WORLDS, EFFECTS, resolveLayout, MOBILE_QUERY } from "../src/logic.js";
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

import { normalizeForecast, forecastItems, forecastRange, rangeBar } from "../src/logic.js";

test("forecast options: off by default, shorthand, defaults, validation", () => {
  assert.equal(normalizeForecast(undefined), null);
  assert.equal(normalizeForecast(false), null);
  assert.deepEqual(normalizeForecast(true), { type: "daily", position: "right", count: 5, decimals: 0, range_bar: true });
  assert.deepEqual(normalizeForecast({ type: "hourly", count: "8", position: "below", decimals: 1, range_bar: false }),
    { type: "hourly", position: "below", count: 8, decimals: 1, range_bar: false });
  assert.throws(() => normalizeForecast({ type: "weekly" }), /forecast.type/);
  assert.throws(() => normalizeForecast({ position: "left" }), /forecast.position/);
  assert.throws(() => normalizeForecast({ count: 0 }), /forecast.count/);
  assert.throws(() => normalizeForecast({ decimals: 5 }), /forecast.decimals/);
  assert.throws(() => normalizeForecast("yes"), /forecast must be/);
});

test("forecast items: skips the past, keeps count, max/min, today flag", () => {
  const now = new Date(2026, 9, 23, 22, 30);
  const day = (d, hi, lo, cond = "rainy") => ({ datetime: new Date(2026, 9, d, 13, 0).toISOString(), temperature: hi, templow: lo, condition: cond });
  const list = [day(22, 9, 3), day(23, 13.5, 10.1), day(24, 12.3, 7), day(25, 15.2, 5.8), { datetime: "nope" }, day(26, 15.3, 4.1, "partlycloudy")];
  const items = forecastItems(list, normalizeForecast({ count: 3 }), now);
  assert.equal(items.length, 3);
  assert.equal(items[0].today, true);
  assert.equal(items[0].hi, 13.5);
  assert.equal(items[0].lo, 10.1);
  assert.equal(items[2].date.getDate(), 25);
  assert.deepEqual(forecastItems(null, normalizeForecast(true), now), []);
  const hourly = forecastItems([{ datetime: new Date(2026, 9, 23, 20).toISOString(), temperature: 12 }, { datetime: new Date(2026, 9, 23, 23).toISOString(), temperature: 11, templow: 3 }], normalizeForecast({ type: "hourly" }), now);
  assert.equal(hourly.length, 1, "past hours skipped");
  assert.equal(hourly[0].lo, null, "no min for hourly");
});

test("forecast min/max bars stay inside the range and are always visible", () => {
  const items = [{ lo: 4, hi: 14 }, { lo: 10, hi: 20 }, { lo: 12, hi: 12 }, { lo: null, hi: 9 }];
  const r = forecastRange(items);
  assert.deepEqual(r, { min: 4, max: 20 });
  assert.deepEqual(rangeBar(items[0], r), { from: 0, to: 63 });
  assert.deepEqual(rangeBar(items[1], r), { from: 38, to: 100 });
  const flat = rangeBar(items[2], r);
  assert.ok(flat.to - flat.from >= 6 && flat.to <= 100);
  assert.equal(rangeBar(items[3], r), null);
  assert.equal(forecastRange([{ lo: null, hi: null }]), null);
  assert.deepEqual(rangeBar({ lo: 5, hi: 5 }, { min: 5, max: 5 }), { from: 0, to: 100 });
});

test("forecast: show_forecast switch from the visual editor", () => {
  assert.deepEqual(normalizeForecast(undefined, true), { type: "daily", position: "right", count: 5, decimals: 0, range_bar: true });
  assert.equal(normalizeForecast({ count: 3 }, false), null, "switch off wins over the options");
  assert.equal(normalizeForecast({ count: 3 }, true).count, 3);
  assert.equal(normalizeForecast({ count: 3 }, undefined).count, 3, "YAML without the switch still works");
});

test("layout: auto is compact on phones, full otherwise; explicit values win", () => {
  assert.equal(resolveLayout("auto", true), "compact");
  assert.equal(resolveLayout("auto", false), "full");
  assert.equal(resolveLayout(undefined, true), "compact");
  assert.equal(resolveLayout("compact", false), "compact");
  assert.equal(resolveLayout("full", true), "full");
  // same breakpoint as Home Assistant's "mobile" screen condition
  assert.equal(MOBILE_QUERY, "(max-width: 767px)");
});
