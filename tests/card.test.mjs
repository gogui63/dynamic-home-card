// Loads the built bundle (dist/) in jsdom and checks rendering, chips, actions, i18n, weather effects.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";

const bundle = readFileSync(new URL("../dist/dynamic-home-card.js", import.meta.url), "utf8");
const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "", last_updated: "" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WINDOWS = [];
// jsdom objects live in another realm: normalise before deep comparison
const same = (a, b, m) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b, m);
after(() => { WINDOWS.forEach((w) => { try { w.document.body.innerHTML = ""; w.close(); } catch (e) { /* ignore */ } }); });

function env() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => { if (!/Not implemented/.test(String(e))) errors.push(String(e)); });
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", { runScripts: "outside-only", pretendToBeVisual: true, url: "http://ha.local/", virtualConsole: vc });
  const w = dom.window;
  WINDOWS.push(w);
  w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} });
  const kinds = [];
  w.HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy({}, { get: (t, k) => (k in t ? t[k] : (typeof k === "string" && /^[a-z]/.test(k) ? () => ({ addColorStop() {} }) : undefined)), set: (t, k, v) => { t[k] = v; return true; } });
  };
  w.console.info = () => {};
  w.eval(bundle);
  return { w, errors, kinds };
}

function hassFor(states, extra = {}) {
  const subs = [];
  return Object.assign({
    states, user: { id: "u1", name: "Gautier Ragueneau" }, locale: { language: "fr", time_format: "24" }, themes: { darkMode: true },
    connection: { subscribeMessage: (cb, msg) => { subs.push({ cb, msg }); return Promise.resolve(() => { subs.splice(subs.indexOf(subs.find((s) => s.cb === cb)), 1); }); } },
    _subs: subs
  }, extra);
}

const STATES = {
  "weather.openweathermap": st("weather.openweathermap", "rainy", { temperature: 11.1, temperature_unit: "°C", friendly_name: "OWM" }),
  "sun.sun": st("sun.sun", "below_horizon", { next_rising: new Date(2026, 9, 24, 8, 15).toISOString(), next_setting: new Date(2026, 9, 24, 18, 38).toISOString() }),
  "sensor.cout_elec_jour": st("sensor.cout_elec_jour", "3.88", { unit_of_measurement: "€", friendly_name: "Coût" }),
  "sensor.lune_phases": st("sensor.lune_phases", "Gibbeuse croissante", { friendly_name: "Lune" }),
  "sensor.pollen": st("sensor.pollen", "1", { "Libellé": "Très faible", Couleur: "#50f0e6" }),
  "light.salon": st("light.salon", "on"),
  "light.cuisine": st("light.cuisine", "off")
};

function mount(w, config, hass, now) {
  const card = w.document.createElement("dynamic-home-card");
  card.setConfig(config);
  if (now) card._now = () => now;
  w.document.body.appendChild(card);
  card.hass = hass;
  return card;
}
const q = (card, s) => card.shadowRoot.querySelector(s);
const qa = (card, s) => [...card.shadowRoot.querySelectorAll(s)];
const chipTexts = (card) => qa(card, ".chip").filter((c) => !c.hidden).map((c) => [c.querySelector(".lbl").textContent, c.querySelector("b").textContent].filter(Boolean).join(" "));

test("registers the custom element and the card picker entry", () => {
  const { w } = env();
  assert.ok(w.customElements.get("dynamic-home-card"));
  assert.ok(w.customCards.some((c) => c.type === "dynamic-home-card"));
});

test("French banner: date, greeting with first name, clock, weather chip", () => {
  const { w, errors } = env();
  const now = new Date(2026, 9, 23, 20, 44);
  const card = mount(w, { weather_entity: "weather.openweathermap" }, hassFor(STATES), now);
  assert.equal(q(card, ".greet").textContent, "Bonsoir, Gautier");
  assert.equal(q(card, ".eyebrow").textContent.toLowerCase(), "vendredi 23 octobre");
  assert.equal(q(card, ".clock").textContent, "20:44");
  same(chipTexts(card), ["Extérieur 11,1 °C"]);
  assert.equal(q(card, ".chip ha-icon").getAttribute("icon"), "mdi:weather-rainy");
  same(errors, []);
});

test("English, 12 h clock, custom name, options to hide time/date/greeting", () => {
  const { w } = env();
  const now = new Date(2026, 9, 23, 8, 5);
  const card = mount(w, { weather_entity: "weather.openweathermap", language: "en", time_format: "12", name: "Alex" }, hassFor(STATES), now);
  assert.equal(q(card, ".greet").textContent, "Good morning, Alex");
  assert.equal(q(card, ".clock").textContent, "8:05AM");
  assert.equal(q(card, ".chip .lbl").textContent, "Outside");
  card.setConfig({ weather_entity: "weather.openweathermap", show_time: false, show_date: false, show_greeting: false });
  assert.equal(q(card, ".clock").hidden, true);
  assert.equal(q(card, ".eyebrow").hidden, true);
  assert.equal(q(card, ".greet").hidden, true);
});

test("chips: entity, decimals, attribute + colour, colors map, shorthand, unavailable, visibility", () => {
  const { w } = env();
  const states = Object.assign({}, STATES, { "sensor.down": st("sensor.down", "unavailable"), "sensor.tempo": st("sensor.tempo", "Rouge") });
  const card = mount(w, {
    weather_entity: "weather.openweathermap",
    chips: [
      "weather",
      { entity: "sensor.cout_elec_jour", name: "ÉLEC", icon: "mdi:currency-eur", decimals: 2 },
      { entity: "sensor.lune_phases", name: "LUNE" },
      { entity: "sensor.pollen", name: "POLLEN", attribute: "Libellé", color_attribute: "Couleur" },
      { entity: "sensor.tempo", name: "TEMPO", colors: { Rouge: "#f38ba8" } },
      "sensor.lune_phases",
      { entity: "sensor.down", name: "DOWN" },
      { entity: "sensor.down", name: "HIDDEN", hide_if_unavailable: true },
      { entity: "sensor.missing", name: "GONE", hide_if_missing: true },
      { entity: "sensor.lune_phases", name: "VIS", visibility: [{ condition: "state", entity: "light.cuisine", state: "on" }] }
    ]
  }, hassFor(states), new Date(2026, 9, 23, 20, 44));
  same(chipTexts(card), ["Extérieur 11,1 °C", "ÉLEC 3,88 €", "LUNE Gibbeuse croissante", "POLLEN Très faible", "TEMPO Rouge", "Lune Gibbeuse croissante", "DOWN —"]);
  const vals = qa(card, ".chip").filter((c) => !c.hidden).map((c) => c.querySelector("b").style.color);
  assert.ok(vals[3] !== "" && vals[4] !== "", "colours applied");
  assert.equal(qa(card, ".chip")[1].querySelector("ha-icon").getAttribute("icon"), "mdi:currency-eur");
});

test("actions: chip tap = more-info by default, custom tap/hold/double-tap, none, card action", async () => {
  const { w } = env();
  const card = mount(w, {
    weather_entity: "weather.openweathermap",
    tap_action: { action: "navigate", navigation_path: "/dashboard-maison/meteo" },
    chips: [
      "weather",
      { entity: "sensor.cout_elec_jour", hold_action: { action: "navigate", navigation_path: "/energy" } },
      { entity: "sensor.lune_phases", double_tap_action: { action: "toggle" } },
      { entity: "sensor.pollen", tap_action: { action: "none" } }
    ]
  }, hassFor(STATES));
  const got = [];
  card.addEventListener("hass-action", (e) => got.push(e.detail));
  const chips = qa(card, ".chip");
  chips[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  assert.equal(got[0].action, "tap");
  assert.equal(got[0].config.entity, "weather.openweathermap");
  same(got[0].config.tap_action, { action: "more-info" });
  assert.equal(got.length, 1, "chip click does not trigger the card action");

  chips[1].dispatchEvent(new w.MouseEvent("pointerdown", { bubbles: true, button: 0 }));
  await sleep(560);
  chips[1].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  assert.equal(got[1].action, "hold");
  assert.equal(got.length, 2, "click after hold is swallowed");

  chips[2].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  chips[2].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await sleep(300);
  assert.equal(got[2].action, "double_tap");
  assert.equal(got.length, 3);

  assert.equal(chips[3].getAttribute("role"), null, "tap_action none: not a button");
  chips[3].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  q(card, "ha-card").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  assert.equal(got[3].action, "tap");
  same(got[3].config.tap_action, { action: "navigate", navigation_path: "/dashboard-maison/meteo" });
});

test("weather drives the effect automatically; overrides and fixed effects", () => {
  const { w } = env();
  const hass = hassFor(STATES);
  const card = mount(w, { weather_entity: "weather.openweathermap" }, hass);
  assert.equal(card._fx.kind, "pioggia", "rainy -> rain");
  const snow = Object.assign({}, STATES, { "weather.openweathermap": st("weather.openweathermap", "snowy", { temperature: -2 }) });
  card.hass = hassFor(snow);
  assert.equal(card._fx.kind, "neve", "state change -> snow");
  card.hass = hassFor(Object.assign({}, STATES, { "weather.openweathermap": st("weather.openweathermap", "sunny", { temperature: 20 }) }));
  assert.equal(card._fx.kind, "none", "sunny -> no effect");
  card.setConfig({ weather_entity: "weather.openweathermap", weather_effects: { sunny: "fireflies" } });
  assert.equal(card._fx.kind, "lucciole", "override per condition");
  card.setConfig({ weather_entity: "weather.openweathermap", effect: "fireworks" });
  assert.equal(card._fx.kind, "fuochi", "fixed effect ignores weather");
  card.setConfig({ weather_entity: "weather.openweathermap", effect: "none" });
  assert.equal(card._fx.kind, "none");
});

test("every world renders and every effect runs", async () => {
  const { w, errors } = env();
  const worlds = ["house", "city", "mountain", "lighthouse", "magic_forest", "space", "japan", "cyberpunk", "christmas", "ocean"];
  const effects = ["rain", "storm", "snow", "fog", "leaves", "petals", "fireflies", "shooting_stars", "fireworks", "bubbles", "confetti"];
  const card = mount(w, { weather_entity: "weather.openweathermap", world: "house" }, hassFor(STATES));
  for (let i = 0; i < worlds.length; i++) {
    card.setConfig({ world: worlds[i], effect: effects[i] });
    const src = qa(card, ".hero-art img").map((x) => x.getAttribute("src") || "").find((s) => s.startsWith("data:image/svg+xml"));
    assert.ok(src && decodeURIComponent(src).includes("<svg"), worlds[i]);
  }
  card.setConfig({ world: "house", effect: "confetti" });
  await sleep(80);
  same(errors, []);
});

test("windows: auto at night, entity list per slot, off", () => {
  const { w } = env();
  const card = mount(w, { world: "house", preview_hour: 23 }, hassFor(STATES));
  assert.ok(qa(card, ".wglow").every((n) => n.classList.contains("on")), "auto: lit at night");
  card.setConfig({ world: "house", preview_hour: 13 });
  assert.ok(qa(card, ".wglow").every((n) => !n.classList.contains("on")), "auto: dark by day");
  card.setConfig({ world: "house", preview_hour: 13, windows: ["light.salon", "light.cuisine"] });
  same(qa(card, ".wglow").map((n) => n.classList.contains("on")), [true, false, false, false, false]);
  card.setConfig({ world: "house", preview_hour: 23, windows: "off" });
  assert.ok(qa(card, ".wglow").every((n) => !n.classList.contains("on")));
});

test("template content via render_template subscription", async () => {
  const { w } = env();
  const hass = hassFor(STATES);
  const card = mount(w, { chips: [{ name: "T", icon: "mdi:test-tube", content: "{{ states('sensor.lune_phases') }}" }] }, hass);
  await sleep(5);
  assert.equal(hass._subs.length, 1);
  assert.equal(hass._subs[0].msg.type, "render_template");
  hass._subs[0].cb({ result: "Gibbeuse croissante" });
  same(chipTexts(card), ["T Gibbeuse croissante"]);
  card.remove();
  await sleep(5);
  assert.equal(hass._subs.length, 0, "unsubscribed on disconnect");
});

test("entity text is never interpreted as HTML", () => {
  const { w } = env();
  const states = Object.assign({}, STATES, { "sensor.x": st("sensor.x", "<img src=x onerror=alert(1)>") });
  const card = mount(w, { chips: [{ entity: "sensor.x", name: "<b>x</b>" }] }, hassFor(states));
  assert.equal(q(card, ".chip img"), null);
  assert.equal(q(card, ".chip .lbl").textContent, "<b>x</b>");
});

test("config validation gives readable errors", () => {
  const { w } = env();
  const card = w.document.createElement("dynamic-home-card");
  assert.throws(() => card.setConfig({ world: "mars" }), /Unknown world "mars"/);
  assert.throws(() => card.setConfig({ effect: "hail" }), /Unknown effect "hail"/);
  assert.throws(() => card.setConfig({ weather_effects: { drizzle: "rain" } }), /unknown condition "drizzle"/);
  assert.throws(() => card.setConfig({ chips: ["oops"] }), /chips\[0\]/);
  assert.doesNotThrow(() => card.setConfig({ world: "giappone", effect: "neve" }));
});

test("stub config and grid options", () => {
  const { w } = env();
  const C = w.customElements.get("dynamic-home-card");
  same(C.getStubConfig({ states: STATES }), { world: "house", chips: ["weather"], weather_entity: "weather.openweathermap" });
  assert.equal(new C().getGridOptions().columns, 12);
  assert.ok(Array.isArray(C.getConfigForm().schema));
});

const FC = [
  { datetime: new Date(2026, 9, 23, 13).toISOString(), condition: "rainy", temperature: 13.5, templow: 10.1 },
  { datetime: new Date(2026, 9, 24, 13).toISOString(), condition: "rainy", temperature: 12.3, templow: 7 },
  { datetime: new Date(2026, 9, 25, 13).toISOString(), condition: "rainy", temperature: 15.2, templow: 5.8 },
  { datetime: new Date(2026, 9, 26, 13).toISOString(), condition: "partlycloudy", temperature: 15.3, templow: 4.1 },
  { datetime: new Date(2026, 9, 27, 13).toISOString(), condition: "partlycloudy", temperature: 21.1, templow: 8 },
  { datetime: new Date(2026, 9, 28, 13).toISOString(), condition: "sunny", temperature: 12.3, templow: 6.7 }
];
const fcTexts = (card) => qa(card, ".fc-day").map((d) => [d.querySelector(".fc-name").textContent, d.querySelector(".fc-hi").textContent, (d.querySelector(".fc-lo") || {}).textContent].join(" "));

test("forecast: off by default, no subscription", async () => {
  const { w } = env();
  const hass = hassFor(STATES);
  const card = mount(w, { weather_entity: "weather.openweathermap" }, hass);
  await sleep(5);
  assert.equal(hass._subs.length, 0);
  assert.equal(q(card, ".forecast").hidden, true);
});

test("forecast: subscribes, renders days with max/min and bars, French labels", async () => {
  const { w, errors } = env();
  const hass = hassFor(STATES);
  const now = new Date(2026, 9, 23, 22, 30);
  const card = mount(w, { weather_entity: "weather.openweathermap", forecast: true }, hass, now);
  await sleep(5);
  assert.equal(hass._subs.length, 1);
  same(hass._subs[0].msg, { type: "weather/subscribe_forecast", forecast_type: "daily", entity_id: "weather.openweathermap" });
  assert.equal(q(card, ".forecast").hidden, true, "hidden until data arrives");
  hass._subs[0].cb({ type: "daily", forecast: FC });
  const days = fcTexts(card);
  assert.equal(days.length, 5);
  assert.equal(days[0], "Auj. 14° 10°");
  assert.match(days[1], /^sam 12° 7°$/);
  assert.equal(qa(card, ".fc-day")[0].classList.contains("today"), true);
  assert.equal(qa(card, ".fc-day ha-icon")[3].getAttribute("icon"), "mdi:weather-partly-cloudy");
  assert.equal(qa(card, ".fc-bar").length, 5);
  assert.equal(qa(card, ".fc-day")[0].getAttribute("aria-label"), "Auj., max 14°, min 10°");
  assert.equal(q(card, ".forecast").parentNode, q(card, ".hero-body"), "narrow (jsdom has no layout): under the chips");
  same(errors, []);
});

test("forecast: options (count, decimals, no bar, hourly) and unsubscribe", async () => {
  const { w } = env();
  const hass = hassFor(STATES, { locale: { language: "en", time_format: "24" } });
  const now = new Date(2026, 9, 23, 22, 30);
  const card = mount(w, { weather_entity: "weather.openweathermap", language: "en", forecast: { count: 3, decimals: 1, range_bar: false } }, hass, now);
  await sleep(5);
  hass._subs[0].cb({ type: "daily", forecast: FC });
  same(fcTexts(card), ["Today 13.5° 10.1°", "Sat 12.3° 7.0°", "Sun 15.2° 5.8°"]);
  assert.equal(qa(card, ".fc-bar").length, 0);
  card.setConfig({ weather_entity: "weather.openweathermap", language: "en", forecast: { type: "hourly", count: 2 } });
  await sleep(5);
  assert.equal(hass._subs.length, 1, "old subscription replaced");
  assert.equal(hass._subs[0].msg.forecast_type, "hourly");
  hass._subs[0].cb({ type: "hourly", forecast: [{ datetime: new Date(2026, 9, 23, 23).toISOString(), condition: "cloudy", temperature: 11 }, { datetime: new Date(2026, 9, 24, 0).toISOString(), condition: "cloudy", temperature: 10.6 }] });
  same(fcTexts(card), ["23:00 11° ", "00:00 11° "]);
  card.remove();
  await sleep(5);
  assert.equal(hass._subs.length, 0, "unsubscribed on disconnect");
});

test("forecast: falls back to the legacy forecast attribute, rejects bad options", async () => {
  const { w } = env();
  const states = Object.assign({}, STATES, { "weather.openweathermap": st("weather.openweathermap", "rainy", { temperature: 11, forecast: FC }) });
  const hass = hassFor(states, { connection: undefined });
  const card = mount(w, { weather_entity: "weather.openweathermap", forecast: { count: 2 } }, hass, new Date(2026, 9, 23, 22, 30));
  assert.equal(fcTexts(card).length, 2);
  assert.throws(() => card.setConfig({ forecast: { type: "weekly" } }), /forecast.type/);
});

test("visual editor: forecast switch and expandable options, French labels", () => {
  const { w } = env();
  const C = w.customElements.get("dynamic-home-card");
  const form = C.getConfigForm();
  const flat = JSON.stringify(form.schema);
  assert.ok(flat.includes('"show_forecast"'));
  const exp = form.schema.find((x) => x.type === "expandable" && x.name === "forecast");
  assert.ok(exp, "forecast section");
  const names = exp.schema[0].schema.map((x) => x.name);
  same(names, ["type", "position", "count", "decimals", "range_bar"]);
  const ha = w.document.createElement("home-assistant"); ha.hass = { locale: { language: "fr" } }; w.document.body.appendChild(ha);
  assert.equal(form.computeLabel({ name: "show_forecast" }), "Afficher les prévisions");
  assert.equal(form.computeLabel({ name: "forecast" }), "Prévisions");
});

test("show_forecast: false hides it, true shows defaults", async () => {
  const { w } = env();
  const hass = hassFor(STATES);
  const card = mount(w, { weather_entity: "weather.openweathermap", show_forecast: false, forecast: { count: 3 } }, hass, new Date(2026, 9, 23, 22, 30));
  await sleep(5);
  assert.equal(hass._subs.length, 0);
  card.setConfig({ weather_entity: "weather.openweathermap", show_forecast: true });
  await sleep(5);
  assert.equal(hass._subs.length, 1);
  hass._subs[0].cb({ forecast: FC });
  assert.equal(qa(card, ".fc-day").length, 5);
});
