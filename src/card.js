/* Dynamic Home Card — a Home Assistant Lovelace card.
   Animated home banner: the sky follows the real sun, the scene follows the real weather,
   greeting / date / time and fully configurable chips.
   License: GPL-3.0-or-later. Rendering engine and visual design derived from
   Aurora Glass v3 © 2026 DomotikPro.it (Luca Pinelli), GPL-3.0 — see NOTICE.md. */
import { ENGINE } from "./engine/aurora-engine.js";
import { I18N, pickLanguage } from "./i18n.js";
import { CSS, PROPS, FONT_URL } from "./styles.js";
import {
  WORLDS, EFFECTS, WEATHER_DEFAULTS, resolveWorld, resolveEffect, weatherScene, modelHour, hoursOf, greetingKey,
  applyOvercast, normalizeChip, isOnState, isUnavail, checkVisibility, chipValue, CONDITION_ICONS, normIcon
} from "./logic.js";

const VERSION = "__VERSION__";
const TAG = "dynamic-home-card";
const { AR, AMB, FX } = ENGINE;
const HOLD_MS = 500, DOUBLE_TAP_MS = 250;

function fire(node, type, detail) {
  const ev = new Event(type, { bubbles: true, composed: true });
  ev.detail = detail;
  node.dispatchEvent(ev);
}
function hasAction(a) { return !!a && a.action !== "none"; }
function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
function pad(n) { return (n < 10 ? "0" : "") + n; }

/* ------------------------------------------------------------------ pointer actions (tap / hold / double tap) */
function bindActions(node, getConfig, onAction) {
  let holdTimer = 0, held = false, tapTimer = 0, taps = 0, startX = 0, startY = 0;
  const cfg = () => getConfig() || {};
  node.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    held = false; startX = e.clientX; startY = e.clientY;
    if (hasAction(cfg().hold_action)) holdTimer = setTimeout(() => { held = true; onAction("hold"); }, HOLD_MS);
  });
  node.addEventListener("pointermove", (e) => { if (holdTimer && (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10)) { clearTimeout(holdTimer); holdTimer = 0; } });
  const cancel = () => { clearTimeout(holdTimer); holdTimer = 0; };
  node.addEventListener("pointercancel", cancel);
  node.addEventListener("pointerleave", cancel);
  node.addEventListener("contextmenu", (e) => { if (hasAction(cfg().hold_action)) e.preventDefault(); });
  node.addEventListener("click", (e) => {
    e.stopPropagation();
    cancel();
    if (held) { held = false; return; }
    if (hasAction(cfg().double_tap_action)) {
      taps++;
      if (taps === 1) { tapTimer = setTimeout(() => { taps = 0; onAction("tap"); }, DOUBLE_TAP_MS); }
      else { clearTimeout(tapTimer); taps = 0; onAction("double_tap"); }
      return;
    }
    onAction("tap");
  });
  node.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAction("tap"); }
  });
}

/* ------------------------------------------------------------------ the card */
class DynamicHomeCard extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._built = false;
    this._chips = [];
    this._tracked = {};
    this._timer = 0;
    this._artKey = "";
    this._artTok = 0;
    this._fx = null;
    this._fxKey = "";
    this._visible = true;
    this._connected = false;
    this._tplUnsubs = [];
    this._tplValues = {};
  }

  /* ---------------- Lovelace API ---------------- */
  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    const world = resolveWorld(config.world);
    if (!world) throw new Error(`Unknown world "${config.world}". Valid: ${Object.keys(WORLDS).join(", ")}`);
    const effect = resolveEffect(config.effect);
    if (!effect) throw new Error(`Unknown effect "${config.effect}". Valid: auto, none, ${Object.keys(EFFECTS).join(", ")}`);
    if (config.weather_effects && typeof config.weather_effects === "object") {
      Object.entries(config.weather_effects).forEach(([cond, v]) => {
        if (!WEATHER_DEFAULTS[cond]) throw new Error(`weather_effects: unknown condition "${cond}". Valid: ${Object.keys(WEATHER_DEFAULTS).join(", ")}`);
        const name = typeof v === "object" && v !== null ? v.effect : v;
        if (name !== undefined && name !== null && name !== "none" && !resolveEffect(name)) throw new Error(`weather_effects.${cond}: unknown effect "${name}"`);
      });
    }
    if (config.chips !== undefined && !Array.isArray(config.chips)) throw new Error("chips must be a list");
    const chips = (config.chips === undefined ? ["weather"] : config.chips).map((c, i) => {
      const n = normalizeChip(c);
      if (!n) throw new Error(`chips[${i}] is invalid: use "weather", an entity id, or an object with "entity"`);
      return n;
    });
    const old = this._config;
    this._config = Object.assign({
      show_time: true, show_date: true, show_greeting: true, show_world_name: false,
      theme: "auto", fonts: "google", windows: "auto", weather_sky: true, time_format: "auto", language: "auto",
      sun_entity: "sun.sun"
    }, config, { _world: world, _effect: effect, _chips: chips });
    if (this._built) {
      this._buildChips();
      this._artKey = ""; this._fxKey = "";
      if (!old || JSON.stringify(old.chips) !== JSON.stringify(config.chips)) this._resubscribeTemplates();
      this._update(true);
    }
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._build();
    if (first) this._resubscribeTemplates();
    let dirty = first;
    for (const id of this._trackedIds()) {
      const s = hass.states[id];
      if (this._tracked[id] !== s) { this._tracked[id] = s; dirty = true; }
    }
    if (this._lastLang !== (hass.locale && hass.locale.language)) { this._lastLang = hass.locale && hass.locale.language; dirty = true; }
    if (dirty) this._update(false);
  }
  get hass() { return this._hass; }

  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 5, min_rows: 4 }; }

  static getStubConfig(hass) {
    const w = hass && Object.keys(hass.states).find((e) => e.startsWith("weather."));
    const cfg = { world: "house", chips: ["weather"] };
    if (w) cfg.weather_entity = w;
    return cfg;
  }

  static getConfigForm() {
    const opt = (o) => Object.keys(o).map((k) => ({ value: k, label: k }));
    return {
      schema: [
        { name: "weather_entity", selector: { entity: { domain: "weather" } } },
        { type: "grid", name: "", schema: [
          { name: "world", selector: { select: { mode: "dropdown", options: opt(WORLDS) } } },
          { name: "effect", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "auto (weather)" }, { value: "none", label: "none" }].concat(opt(EFFECTS)) } } },
          { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "auto" }, { value: "fr", label: "Français" }, { value: "en", label: "English" }] } } },
          { name: "theme", selector: { select: { mode: "dropdown", options: ["auto", "dark", "light"].map((v) => ({ value: v, label: v })) } } },
          { name: "time_format", selector: { select: { mode: "dropdown", options: ["auto", "24", "12"].map((v) => ({ value: v, label: v })) } } },
          { name: "name", selector: { text: {} } }
        ] },
        { type: "grid", name: "", schema: [
          { name: "show_time", selector: { boolean: {} } },
          { name: "show_date", selector: { boolean: {} } },
          { name: "show_greeting", selector: { boolean: {} } },
          { name: "show_world_name", selector: { boolean: {} } },
          { name: "weather_sky", selector: { boolean: {} } }
        ] }
      ],
      computeLabel: (s) => {
        const lang = (document.querySelector("home-assistant") || {}).hass;
        const L = I18N[pickLanguage("auto", lang)] || I18N.en;
        return L.editor[s.name] || s.name;
      }
    };
  }

  connectedCallback() {
    this._connected = true;
    if (this._built) { this._startTimer(); this._update(true); this._resubscribeTemplates(); }
  }
  disconnectedCallback() {
    this._connected = false;
    clearInterval(this._timer); this._timer = 0;
    if (this._fx) this._fx.stop();
    this._unsubscribeTemplates();
    if (this._ro) this._ro.disconnect();
    if (this._io) this._io.disconnect();
    this._fxKey = "";
  }

  /* ---------------- DOM ---------------- */
  _build() {
    this._built = true;
    if (!document.getElementById("dhc-props")) {
      const st = document.createElement("style"); st.id = "dhc-props"; st.textContent = PROPS; document.head.appendChild(st);
    }
    const root = this._root;
    root.innerHTML = "";
    const style = el("style"); style.textContent = CSS; root.appendChild(style);
    const card = el("ha-card", "hero"); this._card = card;
    card.innerHTML =
      '<div class="bg" aria-hidden="true"><i class="o1"></i><i class="o2"></i><i class="o3"></i></div>' +
      '<div class="hero-art" aria-hidden="true"><img alt="" draggable="false"><img alt="" draggable="false"><div class="win-layer"></div></div>' +
      '<canvas class="fx-hero" aria-hidden="true"></canvas>' +
      '<div class="flash" aria-hidden="true"></div>' +
      '<div class="hero-tag" hidden><ha-icon></ha-icon><span></span></div>' +
      '<div class="hero-body"><p class="eyebrow"></p><h1 class="greet"></h1><div class="clock" aria-live="off"></div><div class="hero-chips"></div></div>';
    root.appendChild(card);
    const $ = (s) => card.querySelector(s);
    this._els = {
      imgs: card.querySelectorAll(".hero-art img"), win: $(".win-layer"), canvas: $(".fx-hero"),
      tag: $(".hero-tag"), tagIcon: $(".hero-tag ha-icon"), tagText: $(".hero-tag span"),
      date: $(".eyebrow"), greet: $(".greet"), clock: $(".clock"), chips: $(".hero-chips")
    };
    this._front = this._els.imgs[0]; this._back = this._els.imgs[1];
    bindActions(card, () => this._config, (a) => this._cardAction(a));
    this._fx = new FX.Fx(this._els.canvas, { k: 1, alpha: 1, onFlash: (a) => this.style.setProperty("--flash", a.toFixed(3)) });
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => { if (this._fx && this._fx.kind !== "none") this._fx.resize(); });
      this._ro.observe(card);
    }
    if (typeof IntersectionObserver !== "undefined") {
      this._io = new IntersectionObserver((entries) => {
        this._visible = entries.some((e) => e.isIntersecting);
        if (!this._fx) return;
        if (!this._visible) this._fx.stop(); else if (this._fx.kind !== "none") this._fx.start();
      });
      this._io.observe(card);
    }
    this._buildChips();
    this._startTimer();
  }

  _startTimer() {
    clearInterval(this._timer);
    if (!this._connected && this.isConnected === false) return;
    this._timer = setInterval(() => this._update(false), 15000);
  }

  _lang() { return pickLanguage(this._config.language, this._hass); }
  _t() { return I18N[this._lang()] || I18N.en; }
  _locale() {
    const h = this._hass;
    return (h && h.locale && h.locale.language) || this._lang();
  }

  _trackedIds() {
    const c = this._config, ids = [];
    if (c.weather_entity) ids.push(c.weather_entity);
    if (c.sun_entity) ids.push(c.sun_entity);
    (c._chips || []).forEach((x) => {
      if (x.entity) ids.push(x.entity);
      (Array.isArray(x.visibility) ? x.visibility : []).forEach((v) => { if (v && (v.entity || v.entity_id)) ids.push(v.entity || v.entity_id); });
    });
    const w = c.windows;
    if (typeof w === "string" && w.indexOf(".") > 0) ids.push(w);
    if (Array.isArray(w)) w.forEach((x) => { if (typeof x === "string") ids.push(x); });
    return ids;
  }

  /* ---------------- chips ---------------- */
  _buildChips() {
    const box = this._els.chips;
    box.innerHTML = "";
    this._chips = this._config._chips.map((c, i) => {
      const node = el("span", "chip");
      const ic = el("ha-icon"); const lb = el("span", "lbl"); const val = el("b");
      node.append(ic, lb, val);
      const item = { c, node, ic, lb, val, i };
      const actionCfg = () => this._chipActionConfig(item.c);
      if (hasAction(actionCfg().tap_action) || hasAction(actionCfg().hold_action) || hasAction(actionCfg().double_tap_action)) {
        node.classList.add("action"); node.setAttribute("role", "button"); node.tabIndex = 0;
        bindActions(node, actionCfg, (a) => fire(this, "hass-action", { config: actionCfg(), action: a }));
      }
      box.appendChild(node);
      return item;
    });
  }

  _chipEntity(c) { return c.type === "weather" ? (c.entity || this._config.weather_entity) : c.entity; }

  _chipActionConfig(c) {
    const entity = this._chipEntity(c);
    const def = entity ? { action: "more-info" } : { action: "none" };
    return {
      entity,
      tap_action: c.tap_action || def,
      hold_action: c.hold_action,
      double_tap_action: c.double_tap_action
    };
  }

  _renderChips() {
    const hass = this._hass, t = this._t(), lang = this._locale();
    const mm = typeof window !== "undefined" && window.matchMedia ? (q) => window.matchMedia(q) : null;
    this._chips.forEach((x) => {
      const c = x.c, id = this._chipEntity(c), s = id && hass ? hass.states[id] : undefined;
      let show = checkVisibility(c.visibility, hass, mm);
      if (show && c.hide_if_unavailable && isUnavail(s)) show = false;
      if (show && c.hide_if_missing && id && !s) show = false;
      if (show && c.type === "weather" && !s) show = false;
      x.node.hidden = !show;
      if (!show) return;
      const na = !c.content && isUnavail(s);
      let label, value, icon, color = "";
      if (c.type === "weather") {
        label = c.name !== undefined ? c.name : t.outside;
        icon = normIcon(c.icon) || CONDITION_ICONS[s.state] || "mdi:weather-partly-cloudy";
        if (na) value = "—";
        else {
          const temp = s.attributes.temperature;
          let tv = "";
          if (temp !== undefined && temp !== null) {
            try { tv = hass && typeof hass.formatEntityAttributeValue === "function" ? String(hass.formatEntityAttributeValue(s, "temperature")) : ""; } catch (e) { tv = ""; }
            if (!tv) tv = Number(temp).toLocaleString(lang, { maximumFractionDigits: 1 }) + " " + (s.attributes.temperature_unit || "°C");
          }
          let cond = "";
          if (c.show_condition) { try { cond = hass && typeof hass.formatEntityState === "function" ? String(hass.formatEntityState(s)) : s.state; } catch (e) { cond = s.state; } }
          value = [tv, cond].filter(Boolean).join(" · ") || "—";
        }
      } else {
        label = c.name !== undefined ? c.name : (s && s.attributes.friendly_name) || id || "";
        icon = normIcon(c.icon) || (s && normIcon(s.attributes.icon)) || "mdi:information-outline";
        if (c.content) {
          const v = this._tplValues[x.i];
          value = v === undefined ? "…" : String(v);
        } else value = na ? "—" : chipValue(c, s, hass, lang);
        if (!na && s) {
          const key = c.attribute ? s.attributes[c.attribute] : s.state;
          if (c.colors && c.colors[key] !== undefined) color = c.colors[key];
          else if (c.color_attribute && s.attributes[c.color_attribute]) color = s.attributes[c.color_attribute];
          else if (c.color) color = c.color;
        } else if (c.color) color = c.color;
      }
      x.ic.setAttribute("icon", icon);
      x.lb.textContent = label; x.lb.hidden = !label;
      x.val.textContent = value;
      x.val.style.color = color ? String(color) : "";
      if (c.icon_color) x.ic.style.color = String(c.icon_color); else x.ic.style.color = "";
      x.node.classList.toggle("na", na);
      x.node.setAttribute("aria-label", [label, value].filter(Boolean).join(" "));
    });
  }

  /* ---------------- Jinja templates (chip `content`), via HA's render_template subscription ---------------- */
  _unsubscribeTemplates() {
    this._tplUnsubs.forEach((p) => Promise.resolve(p).then((u) => { try { if (typeof u === "function") u(); } catch (e) { /* ignore */ } }).catch(() => {}));
    this._tplUnsubs = [];
  }
  _resubscribeTemplates() {
    this._unsubscribeTemplates();
    this._tplValues = {};
    const hass = this._hass;
    if (!hass || !hass.connection || !this._config || !this._connected && this.isConnected === false) return;
    this._config._chips.forEach((c, i) => {
      if (!c.content || typeof c.content !== "string") return;
      if (c.content.indexOf("{") < 0) { this._tplValues[i] = c.content; return; }
      const p = hass.connection.subscribeMessage((msg) => {
        this._tplValues[i] = msg && msg.result !== undefined ? msg.result : (msg && msg.error ? "⚠" : "");
        this._renderChips();
      }, { type: "render_template", template: c.content, variables: { config: c, user: hass.user && hass.user.name }, strict: false });
      if (p && p.catch) p.catch((e) => { this._tplValues[i] = "⚠"; console.warn("dynamic-home-card: template error", e && e.message); this._renderChips(); });
      this._tplUnsubs.push(p);
    });
  }

  /* ---------------- card action ---------------- */
  _cardAction(action) {
    const c = this._config;
    const cfg = { entity: c.entity || c.weather_entity, tap_action: c.tap_action || { action: "none" }, hold_action: c.hold_action, double_tap_action: c.double_tap_action };
    const a = action === "hold" ? cfg.hold_action : action === "double_tap" ? cfg.double_tap_action : cfg.tap_action;
    if (!hasAction(a)) return;
    fire(this, "hass-action", { config: cfg, action });
  }

  /* ---------------- main update ---------------- */
  _now() { return new Date(); }

  _update(force) {
    if (!this._built || !this._config) return;
    const c = this._config, hass = this._hass, t = this._t(), now = this._now();
    this.dataset.fonts = c.fonts === "theme" ? "theme" : "google";
    if (c.fonts !== "theme" && !document.getElementById("dhc-fonts")) {
      const l = document.createElement("link"); l.id = "dhc-fonts"; l.rel = "stylesheet"; l.href = FONT_URL; document.head.appendChild(l);
    }
    const dark = c.theme === "dark" ? true : c.theme === "light" ? false : !(hass && hass.themes && hass.themes.darkMode === false);
    this.dataset.theme = dark ? "dark" : "light";
    if (c.height !== undefined) this.style.setProperty("--dhc-height", typeof c.height === "number" ? c.height + "px" : String(c.height));
    this._card.classList.toggle("clickable", hasAction(c.tap_action) || hasAction(c.hold_action) || hasAction(c.double_tap_action));

    const sunState = hass && c.sun_entity ? hass.states[c.sun_entity] : undefined;
    const h = typeof c.preview_hour === "number" ? c.preview_hour : modelHour(now, sunState);
    const realH = typeof c.preview_hour === "number" ? c.preview_hour : hoursOf(now);

    // weather
    const ws = hass && c.weather_entity ? hass.states[c.weather_entity] : undefined;
    const cond = typeof c.preview_condition === "string" ? c.preview_condition : (ws && !isUnavail(ws) ? ws.state : null);
    const scene = weatherScene(cond, c);
    let effect;
    if (c._effect === "auto") effect = scene.effect;
    else if (c._effect === "none") effect = null;
    else effect = c._effect;
    const intensity = c._effect === "auto" ? scene.intensity : (typeof c.effect_intensity === "number" ? c.effect_intensity : 1);

    // colours of the time of day
    const K = AMB.palette(h);
    ["b1", "b2", "b3", "a1", "a2"].forEach((k) => this.style.setProperty("--dhc-" + k, K[k]));
    this.style.setProperty("--dhc-win", K.win);

    // texts
    const t0 = this._els;
    t0.date.hidden = !c.show_date;
    if (c.show_date) {
      const d = new Intl.DateTimeFormat(this._locale(), { weekday: "long", day: "numeric", month: "long" }).format(now);
      t0.date.textContent = d;
    }
    t0.greet.hidden = !c.show_greeting;
    if (c.show_greeting) {
      const name = c.name !== undefined ? String(c.name) : (hass && hass.user && hass.user.name ? hass.user.name.split(" ")[0] : "");
      const g = t.greetings[greetingKey(realH)];
      t0.greet.textContent = name ? g + ", " + name : g;
    }
    t0.clock.hidden = !c.show_time;
    if (c.show_time) this._renderClock(now);
    t0.tag.hidden = !c.show_world_name;
    if (c.show_world_name) {
      t0.tagText.textContent = (t.worlds && t.worlds[c._world]) || c._world;
      t0.tagIcon.setAttribute("icon", normIcon(AMB.W[WORLDS[c._world]].icon));
    }

    this._renderArt(h, scene.overcast, force);
    this._renderWindows(K);
    this._renderFx(effect, intensity);
    this._renderChips();
  }

  _renderClock(now) {
    const c = this._config, hass = this._hass;
    let fmt = String(c.time_format || "auto");
    if (fmt === "auto") {
      const tf = hass && hass.locale && hass.locale.time_format;
      if (tf === "12") fmt = "12";
      else if (tf === "24") fmt = "24";
      else {
        try { fmt = new Intl.DateTimeFormat(this._locale(), { hour: "numeric" }).resolvedOptions().hour12 ? "12" : "24"; } catch (e) { fmt = "24"; }
      }
    }
    let hh = now.getHours(); const mm = now.getMinutes();
    let suffix = "";
    if (fmt === "12") { suffix = hh < 12 ? "AM" : "PM"; hh = hh % 12 || 12; }
    const clock = this._els.clock;
    clock.textContent = "";
    clock.append(String(fmt === "12" ? hh : pad(hh)));
    const colon = el("span", "colon"); colon.textContent = ":"; clock.append(colon);
    clock.append(pad(mm));
    if (suffix) { const s = el("span", "ampm"); s.textContent = suffix; clock.append(s); }
  }

  _renderArt(h, overcast, force) {
    const id = WORLDS[this._config._world];
    const q = Math.round(h * 4) / 4;
    const oc = Math.round(overcast * 20) / 20;
    const key = id + "|" + q + "|" + oc;
    if (key === this._artKey && !force) return;
    this._artKey = key;
    const w = AMB.W[id];
    const res = applyOvercast(AMB.palette(q), AMB.body(q), oc, AMB.mix);
    AR.begin("dhc" + id + "_");
    const inner = w.draw(res.K, q, res.B);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="640" height="260"><defs>' + AR.filters() + AR.defs() + "</defs><style>" + AMB.BASECSS + (w.css || "") + "</style>" + inner + "</svg>";
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    const tok = ++this._artTok, back = this._back;
    back.onload = () => {
      if (tok !== this._artTok) return;
      back.classList.add("show"); this._front.classList.remove("show");
      this._back = this._front; this._front = back;
    };
    back.src = url;
    this._buildWindows(w);
  }

  _buildWindows(w) {
    const layer = this._els.win;
    const slots = w.windows || [];
    if (layer.dataset.world === this._config._world && layer.children.length === slots.length) return;
    layer.dataset.world = this._config._world;
    layer.innerHTML = "";
    slots.forEach((s) => {
      const d = el("div", "wglow");
      d.style.left = (s.x / 640 * 100) + "%"; d.style.top = (s.y / 260 * 100) + "%";
      d.style.width = (s.w / 640 * 100) + "%"; d.style.height = (s.h / 260 * 100) + "%";
      layer.appendChild(d);
    });
  }

  _renderWindows(K) {
    const w = this._config.windows, hass = this._hass;
    const nodes = Array.prototype.slice.call(this._els.win.children);
    nodes.forEach((n, i) => {
      let on;
      if (w === "off" || w === false) on = false;
      else if (w === "on" || w === true) on = true;
      else if (w === "auto" || w === undefined) on = K.dy < 0.35;
      else if (typeof w === "string") on = isOnState(hass && hass.states[w]);
      else if (Array.isArray(w)) { const id = w[i]; on = typeof id === "string" ? isOnState(hass && hass.states[id]) : false; }
      else on = false;
      n.classList.toggle("on", !!on);
    });
  }

  _renderFx(effect, intensity) {
    const kind = effect ? EFFECTS[effect] : "none";
    const key = kind + "|" + intensity;
    if (key === this._fxKey) return;
    this._fxKey = key;
    this._fx.k = intensity;
    this._fx.set(kind);
    if (!this._visible) this._fx.stop();
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, DynamicHomeCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === TAG)) {
  window.customCards.push({
    type: TAG,
    name: "Dynamic Home Card",
    description: "Animated home banner: the sky follows the real sun, effects follow the real weather, configurable chips.",
    preview: true,
    documentationURL: "https://github.com/gogui63/dynamic-home-card"
  });
}
console.info("%c DYNAMIC-HOME-CARD %c " + VERSION + " ", "background:#7C5CFF;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px", "background:#1b1740;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");

export { DynamicHomeCard };
