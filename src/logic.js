/* Dynamic Home Card — pure helpers (no DOM). Covered by tests/logic.test.mjs. */

/* World ids exposed in YAML (English) -> engine ids (Italian, from Aurora Glass). */
export const WORLDS = {
  house: "casetta", city: "citta", mountain: "montagna", lighthouse: "mare", magic_forest: "foresta",
  space: "spazio", japan: "giappone", cyberpunk: "cyberpunk", christmas: "natale", ocean: "oceano"
};

/* Effect ids exposed in YAML (English) -> engine ids. */
export const EFFECTS = {
  rain: "pioggia", storm: "temporale", snow: "neve", fog: "nebbia", leaves: "foglie", petals: "petali",
  fireflies: "lucciole", shooting_stars: "stelle", fireworks: "fuochi", bubbles: "bolle", confetti: "coriandoli"
};

/* Home Assistant weather conditions (https://www.home-assistant.io/integrations/weather/)
   -> [effect, intensity, overcast 0..1]. Overridable per condition with `weather_effects`. */
export const WEATHER_DEFAULTS = {
  "clear-night": [null, 1, 0],
  sunny: [null, 1, 0],
  partlycloudy: [null, 1, 0.35],
  cloudy: [null, 1, 0.8],
  fog: ["fog", 1, 0.6],
  rainy: ["rain", 1, 0.7],
  pouring: ["rain", 1.8, 0.85],
  lightning: ["storm", 0.6, 0.85],
  "lightning-rainy": ["storm", 1, 0.9],
  snowy: ["snow", 1, 0.6],
  "snowy-rainy": ["snow", 1, 0.7],
  hail: ["storm", 1, 0.85],
  windy: ["leaves", 1, 0.2],
  "windy-variant": ["leaves", 1, 0.5],
  exceptional: ["storm", 1, 0.9]
};

const reverse = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const WORLD_BY_ENGINE = reverse(WORLDS);
const EFFECT_BY_ENGINE = reverse(EFFECTS);

/** Accepts the English id or the original Aurora (Italian) id. Returns the public id or null. */
export function resolveWorld(id) {
  if (id === undefined || id === null || id === "") return "house";
  const k = String(id).toLowerCase();
  if (WORLDS[k]) return k;
  if (WORLD_BY_ENGINE[k]) return WORLD_BY_ENGINE[k];
  return null;
}

/** "auto" | "none" | effect id (English or Italian). Returns the public id, "auto", "none" or null if unknown. */
export function resolveEffect(id) {
  if (id === undefined || id === null || id === "") return "auto";
  const k = String(id).toLowerCase();
  if (k === "auto" || k === "none") return k;
  if (EFFECTS[k]) return k;
  if (EFFECT_BY_ENGINE[k]) return EFFECT_BY_ENGINE[k];
  return null;
}

/**
 * Decides what to draw for the current weather.
 * @returns {{effect: string|null, intensity: number, overcast: number}} effect = public id or null
 */
export function weatherScene(condition, config) {
  const cfg = config || {};
  const base = WEATHER_DEFAULTS[condition] || [null, 1, 0];
  let [effect, intensity, overcast] = base;
  const over = cfg.weather_effects && cfg.weather_effects[condition];
  if (over !== undefined) {
    if (over === null || over === "none") effect = null;
    else if (typeof over === "string") effect = resolveEffect(over) || effect;
    else if (typeof over === "object") {
      if (over.effect !== undefined) effect = over.effect === "none" || over.effect === null ? null : (resolveEffect(over.effect) || effect);
      if (typeof over.intensity === "number") intensity = over.intensity;
      if (typeof over.overcast === "number") overcast = over.overcast;
    }
  }
  if (cfg.weather_sky === false) overcast = 0;
  const mult = typeof cfg.effect_intensity === "number" ? cfg.effect_intensity : 1;
  return { effect: effect === "auto" ? null : effect, intensity: clamp(intensity * mult, 0.1, 4), overcast: clamp(overcast, 0, 1) };
}

export function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

/** Hours of the day (0..24, fractional) of a Date, local time. */
export function hoursOf(d) { return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }

/**
 * The worlds were drawn for a fixed day: sunrise colours at 6:30 and sunset colours at 18:30.
 * This maps the real local time onto that model so dawn and dusk follow the real sun
 * (sun.sun next_rising / next_setting). Falls back to the clock when the sun entity is missing
 * or the values are unusable (polar day/night).
 */
export function modelHour(now, sunState) {
  const h = hoursOf(now);
  if (!sunState || !sunState.attributes) return h;
  const r = sunState.attributes.next_rising, s = sunState.attributes.next_setting;
  if (!r || !s) return h;
  const rd = new Date(r), sd = new Date(s);
  if (isNaN(rd) || isNaN(sd)) return h;
  const rise = hoursOf(rd), set = hoursOf(sd);
  if (!(rise > 0.5 && rise < 12 && set > 12 && set < 23.5 && set - rise > 2)) return h;
  const pts = [[0, 0], [rise, 6.5], [set, 18.5], [24, 24]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (h >= x0 && h <= x1) return y0 + (y1 - y0) * ((h - x0) / (x1 - x0));
  }
  return h;
}

/** Greeting slot from the real clock hour. */
export function greetingKey(h) {
  if (h >= 22 || h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

/** Uses the engine colour mixer to grey the sky and thicken clouds for bad weather. */
export function applyOvercast(K, B, f, mix) {
  if (!f) return { K, B };
  const k = Object.assign({}, K);
  const grey = mix("#2a3040", "#a9b2c0", k.dy);
  ["s1", "s2", "s3"].forEach((x) => { k[x] = mix(k[x], grey, f * 0.6); });
  ["hf", "hn"].forEach((x) => { k[x] = mix(k[x], grey, f * 0.2); });
  k.cl = Math.min(1, k.cl + f * (1 - k.cl) * 0.9);
  k.cloud = mix(mix("#ffffff", k.s3, 0.35), grey, f * 0.5);
  k.st = k.st * (1 - f);
  const b = { sun: Object.assign({}, B.sun), moon: Object.assign({}, B.moon) };
  b.sun.vis = B.sun.vis * (1 - f * 0.85);
  b.moon.vis = B.moon.vis * (1 - f * 0.85);
  return { K: k, B: b };
}

/** Chip shorthand: "weather" -> {type: weather}; "sensor.x" -> {entity: "sensor.x"}. */
export function normalizeChip(c) {
  if (typeof c === "string") {
    if (c === "weather") return { type: "weather" };
    if (c.indexOf(".") > 0) return { type: "entity", entity: c };
    return null;
  }
  if (!c || typeof c !== "object") return null;
  const type = c.type || (c.entity || c.content ? "entity" : null);
  if (type !== "weather" && type !== "entity") return null;
  return Object.assign({}, c, { type });
}

const ON_STATES = ["on", "open", "opening", "home", "playing", "unlocked", "active"];
export function isOnState(s) { return !!s && ON_STATES.indexOf(s.state) > -1; }
export function isUnavail(s) { return !s || s.state === "unavailable" || s.state === "unknown"; }

/**
 * Subset of Lovelace visibility conditions: state, numeric_state, screen, user, and/or/not.
 * Unknown condition types count as "visible" so a typo never hides content silently forever.
 */
export function checkVisibility(conds, hass, matchMedia) {
  if (!conds) return true;
  const list = Array.isArray(conds) ? conds : [conds];
  return list.every((c) => checkOne(c, hass, matchMedia));
}
function asList(v) { return Array.isArray(v) ? v.map(String) : [String(v)]; }
function checkOne(c, hass, mm) {
  if (!c || typeof c !== "object") return true;
  const ent = c.entity || c.entity_id;
  const st = ent && hass && hass.states ? hass.states[ent] : undefined;
  switch (c.condition) {
    case "state":
      if (!st) return c.state_not !== undefined;
      if (c.state !== undefined && asList(c.state).indexOf(st.state) < 0) return false;
      if (c.state_not !== undefined && asList(c.state_not).indexOf(st.state) > -1) return false;
      return true;
    case "numeric_state": {
      const n = st ? parseFloat(st.state) : NaN;
      if (isNaN(n)) return false;
      if (c.above !== undefined && !(n > Number(c.above))) return false;
      if (c.below !== undefined && !(n < Number(c.below))) return false;
      return true;
    }
    case "screen":
      return !c.media_query || !mm ? true : mm(c.media_query).matches;
    case "user":
      return !c.users || !hass || !hass.user ? true : c.users.indexOf(hass.user.id) > -1;
    case "and": return (c.conditions || []).every((x) => checkOne(x, hass, mm));
    case "or": return (c.conditions || []).some((x) => checkOne(x, hass, mm));
    case "not": return !(c.conditions || []).every((x) => checkOne(x, hass, mm));
    default: return true;
  }
}

/** Formats a chip value. Uses HA's own formatters when present (units, display precision, translations). */
export function chipValue(c, s, hass, lang) {
  const attr = c.attribute;
  const raw = attr ? s.attributes[attr] : s.state;
  if (raw === undefined || raw === null || raw === "") return "—";
  const n = Number(raw);
  const num = typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "" && isFinite(n));
  const unit = c.unit !== undefined ? c.unit : (attr ? "" : (s.attributes.unit_of_measurement || ""));
  if (num && c.decimals !== undefined) {
    const d = clamp(parseInt(c.decimals, 10) || 0, 0, 6);
    return n.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }) + (unit ? " " + unit : "");
  }
  try {
    if (attr && hass && typeof hass.formatEntityAttributeValue === "function") return String(hass.formatEntityAttributeValue(s, attr));
    if (!attr && c.unit === undefined && hass && typeof hass.formatEntityState === "function") return String(hass.formatEntityState(s));
  } catch (e) { /* fall through */ }
  return (num ? n.toLocaleString(lang, { maximumFractionDigits: 2 }) : String(raw)) + (unit ? " " + unit : "");
}

export const CONDITION_ICONS = {
  "clear-night": "mdi:weather-night", cloudy: "mdi:weather-cloudy", exceptional: "mdi:alert-circle-outline",
  fog: "mdi:weather-fog", hail: "mdi:weather-hail", lightning: "mdi:weather-lightning", "lightning-rainy": "mdi:weather-lightning-rainy",
  partlycloudy: "mdi:weather-partly-cloudy", pouring: "mdi:weather-pouring", rainy: "mdi:weather-rainy", snowy: "mdi:weather-snowy",
  "snowy-rainy": "mdi:weather-snowy-rainy", sunny: "mdi:weather-sunny", windy: "mdi:weather-windy", "windy-variant": "mdi:weather-windy-variant"
};

/* ------------------------------------------------------------------ forecast */
export const FORECAST_TYPES = ["daily", "hourly"];
export const FORECAST_POSITIONS = ["right", "below"];

/**
 * `forecast: true` or an object -> normalised options, or null when the forecast is off.
 * Throws readable errors for bad values (shown by Lovelace in place of the card).
 */
export function normalizeForecast(f) {
  if (f === undefined || f === null || f === false) return null;
  const o = f === true ? {} : f;
  if (typeof o !== "object" || Array.isArray(o)) throw new Error("forecast must be true, false or an object");
  const type = o.type === undefined ? "daily" : String(o.type);
  if (FORECAST_TYPES.indexOf(type) < 0) throw new Error(`forecast.type: unknown type "${o.type}". Valid: ${FORECAST_TYPES.join(", ")}`);
  const position = o.position === undefined ? "right" : String(o.position);
  if (FORECAST_POSITIONS.indexOf(position) < 0) throw new Error(`forecast.position: unknown position "${o.position}". Valid: ${FORECAST_POSITIONS.join(", ")}`);
  const count = o.count === undefined ? 5 : parseInt(o.count, 10);
  if (!(count >= 1 && count <= 12)) throw new Error("forecast.count must be a number between 1 and 12");
  const decimals = o.decimals === undefined ? 0 : parseInt(o.decimals, 10);
  if (!(decimals >= 0 && decimals <= 2)) throw new Error("forecast.decimals must be 0, 1 or 2");
  return { type, position, count, decimals, range_bar: o.range_bar !== false };
}

const dayKey = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const toNum = (v) => (v === undefined || v === null || v === "" || !isFinite(Number(v)) ? null : Number(v));

/**
 * Forecast entries from Home Assistant (weather/subscribe_forecast) -> what the card draws.
 * Past days (daily) and past hours (hourly) are skipped, then the first `count` are kept.
 * @returns {{date: Date, today: boolean, condition: string|null, hi: number|null, lo: number|null}[]}
 */
export function forecastItems(list, opts, now) {
  if (!Array.isArray(list) || !opts) return [];
  const today = dayKey(now), out = [];
  for (const f of list) {
    if (!f || !f.datetime) continue;
    const d = new Date(f.datetime);
    if (isNaN(d)) continue;
    if (opts.type === "daily" && dayKey(d) < today) continue;
    if (opts.type === "hourly" && d.getTime() < now.getTime() - 3600000) continue;
    out.push({
      date: d,
      today: opts.type === "daily" && dayKey(d) === today,
      condition: f.condition || null,
      hi: toNum(f.temperature),
      lo: opts.type === "daily" ? toNum(f.templow) : null
    });
    if (out.length >= opts.count) break;
  }
  return out;
}

/** Lowest and highest temperature over the shown entries (for the min/max bars), or null. */
export function forecastRange(items) {
  let min = Infinity, max = -Infinity;
  items.forEach((x) => [x.lo, x.hi].forEach((v) => { if (v !== null) { min = Math.min(min, v); max = Math.max(max, v); } }));
  return min === Infinity ? null : { min, max };
}

/** Position of the min..max bar of one day inside the global range, in % from the bottom. */
export function rangeBar(item, range) {
  if (!range || item.lo === null || item.hi === null) return null;
  const span = range.max - range.min;
  if (span <= 0) return { from: 0, to: 100 };
  const a = clamp((item.lo - range.min) / span * 100, 0, 100);
  const b = clamp((item.hi - range.min) / span * 100, 0, 100);
  let from = Math.min(a, b), to = Math.max(a, b);
  if (to - from < 6) { to = Math.min(100, from + 6); from = to - 6; } // always visible
  return { from: Math.round(from), to: Math.round(to) };
}

export function normIcon(i) {
  if (!i) return null;
  const s = String(i);
  if (s.indexOf(":") > 0) return s;
  return "mdi:" + s.replace(/^mdi-/, "");
}
