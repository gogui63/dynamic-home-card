/*! Dynamic Home Card v0.2.0 — https://github.com/gogui63/dynamic-home-card
 *  License: GPL-3.0-or-later. Contains code derived from Aurora Glass v3
 *  © 2026 DomotikPro.it (Luca Pinelli), GPL-3.0 — https://github.com/lucalux00/aurora-glass-v3
 *  Generated file: edit src/ and run `npm run build`. */
(() => {
"use strict";
/* ---- src/engine/aurora-engine.js ---- */
/* ============================================================================
   Dynamic Home Card — rendering engine
   Derived from "Aurora Glass v3" by DomotikPro.it (Luca Pinelli), GPL-3.0
   https://github.com/lucalux00/aurora-glass-v3 (commit a2cdf25, 2026-10-21)
   © 2026 DomotikPro.it (Luca Pinelli) — original drawing engine, worlds, effects.

   Modifications (Dynamic Home Card contributors, 2026, GPL-3.0):
   - wrapped in a private namespace (no window.AR / window.AMB / window.FX globals),
     so this card can run next to Aurora Glass without conflicts.
   - AMB.BASECSS exported (read-only) so the card can render a world with a
     weather-adjusted palette.
   The code below is otherwise unchanged from upstream (comments in Italian).
   ========================================================================== */
const ENGINE = (function () {
  var NS = {};
/* ---- disegno.js ---- */
/* ============================================================================
   AURORA GLASS v3 — motore di disegno delle immagini dei pulsanti
   Ogni immagine è una funzione draw(on, t): t va da 0 a 1 e il ciclo si chiude
   da solo (così la GIF si ripete senza scatti). Lo usa tools/render_btn.py per
   produrre i file PNG (spento) e GIF (acceso) in assets/btn/.
   ========================================================================== */
(function (g) {
  var TAU = Math.PI * 2;
  var DEFS = [], N = 0, PFX = '', RC = 0;
  var f = function (n) { return Math.round(n * 100) / 100; };
  var sn = function (t, k, p) { return Math.sin(TAU * (t * (k || 1) + (p || 0))); };
  var cs = function (t, k, p) { return Math.cos(TAU * (t * (k || 1) + (p || 0))); };
  var fr = function (x) { return x - Math.floor(x); };
  var clamp = function (x, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, x)); };
  var hsl = function (h, s, l, a) { return 'hsla(' + h + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')'; };
  function rnd(seed) { var s = (seed * 9301 + 49297) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s % 100000) / 100000; }; }
  function uid(p) { return PFX + p + (N++); }

  /* gradienti */
  function lg(stops, o) {
    o = o || {};
    var i = uid('lg');
    DEFS.push('<linearGradient id="' + i + '" x1="' + (o.x1 || 0) + '" y1="' + (o.y1 || 0) + '" x2="' + (o.x2 === undefined ? 0 : o.x2) + '" y2="' + (o.y2 === undefined ? 1 : o.y2) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + (s[2] === undefined ? 1 : s[2]) + '"/>'; }).join('') + '</linearGradient>');
    return 'url(#' + i + ')';
  }
  function rg(stops, o) {
    o = o || {};
    var i = uid('rg');
    DEFS.push('<radialGradient id="' + i + '" cx="' + (o.cx === undefined ? .5 : o.cx) + '" cy="' + (o.cy === undefined ? .5 : o.cy) + '" r="' + (o.r === undefined ? .5 : o.r) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + (s[2] === undefined ? 1 : s[2]) + '"/>'; }).join('') + '</radialGradient>');
    return 'url(#' + i + ')';
  }

  /* primitive */
  function R(x, y, w, h, fill, rx, ex) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '" ' + (ex || '') + '/>'; }
  function C(cx, cy, r, fill, ex) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + fill + '" ' + (ex || '') + '/>'; }
  function E(cx, cy, rx, ry, fill, ex) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '" ' + (ex || '') + '/>'; }
  function P(pts, fill, ex) { return '<polygon points="' + pts + '" fill="' + fill + '" ' + (ex || '') + '/>'; }
  function PA(d, fill, ex) { return '<path d="' + d + '" fill="' + fill + '" ' + (ex || '') + '/>'; }
  function ST(d, stroke, w, ex) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" ' + (ex || '') + '/>'; }
  function Gr(inner, tf, ex) { return '<g' + (tf ? ' transform="' + tf + '"' : '') + ' ' + (ex || '') + '>' + inner + '</g>'; }
  function glow(cx, cy, r, col, a) { return C(cx, cy, r, rg([[0, col, a === undefined ? 1 : a], [.45, col, (a === undefined ? 1 : a) * .35], [1, col, 0]])); }
  function blur(inner, sd) { return '<g filter="url(#' + PFX + 'b' + sd + ')">' + inner + '</g>'; }
  function cone(xt, yt, wt, xb, yb, wb, col, a) {
    return P(f(xt - wt / 2) + ',' + yt + ' ' + f(xt + wt / 2) + ',' + yt + ' ' + f(xb + wb / 2) + ',' + yb + ' ' + f(xb - wb / 2) + ',' + yb, lg([[0, col, a], [1, col, 0]]));
  }
  function motes(t, x, y, w, h, n, col, seed, r0) {
    var rd = rnd(seed || 3), s = '';
    for (var i = 0; i < n; i++) {
      var px = rd(), py = rd(), ph = rd(), q = fr(t + ph);
      s += C(x + w * px + 7 * sn(t, 1, ph), y + h * (1 - q), (r0 || 1.3) * (0.6 + py * .9), col, 'opacity="' + f(Math.sin(Math.PI * q) * .75) + '"');
    }
    return s;
  }
  function stars(n, x, y, w, h, t, seed, col) {
    var rd = rnd(seed || 5), s = '';
    for (var i = 0; i < n; i++) {
      var px = rd(), py = rd(), ph = rd();
      s += C(x + w * px, y + h * py, 0.7 + rd() * 1.2, col || '#fff', 'opacity="' + f(.35 + .65 * Math.abs(sn(t, 1, ph))) + '"');
    }
    return s;
  }
  function roomBase(hue, floorY) {
    floorY = floorY || 178;
    return R(0, 0, 256, floorY, lg([[0, hsl(hue, 34, 34)], [1, hsl(hue, 38, 21)]])) +
      R(0, floorY, 256, 256 - floorY, lg([[0, hsl(hue, 28, 19)], [1, hsl(hue, 34, 8)]])) +
      R(0, floorY - 5, 256, 6, hsl(hue, 22, 44)) + R(0, floorY + 1, 256, 2, 'rgba(255,255,255,.07)');
  }

  var ART = {};
  function filters() {
    return '<filter id="' + PFX + 'b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>' +
      '<filter id="' + PFX + 'b4" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<filter id="' + PFX + 'b8" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>' +
      '<filter id="' + PFX + 'b14" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>' +
      '<filter id="' + PFX + 'off" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.32"/><feComponentTransfer><feFuncR type="linear" slope=".58"/><feFuncG type="linear" slope=".6"/><feFuncB type="linear" slope=".72" intercept=".02"/></feComponentTransfer></filter>';
  }

  function render(key, on, t) {
    var a = ART[key];
    if (!a) throw new Error('arte sconosciuta: ' + key);
    DEFS = []; N = 0; PFX = 'k' + (RC++) + '_';
    var bg = R(0, 0, 256, 256, lg([[0, hsl(a.hue, 40, 20)], [1, hsl(a.hue, 45, 9)]]));
    var inner = a.draw(!!on, t || 0);
    var dimmed = !on && a.dim !== false;
    var vign = R(0, 0, 256, 256, rg([[.55, '#000', 0], [1, '#000', .38]], { r: .75 }));
    return '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs>' + filters() + DEFS.join('') + '</defs>' +
      '<g' + (dimmed ? ' filter="url(#' + PFX + 'off)"' : '') + '>' + bg + inner + '</g>' + vign + '</svg>';
  }

  function begin(prefix) { DEFS = []; N = 0; PFX = prefix || ('k' + (RC++) + '_'); }
  function defs() { return DEFS.join(''); }

  g.AR = { begin: begin, defs: defs, filters: filters, TAU: TAU, f: f, sn: sn, cs: cs, fr: fr, clamp: clamp, hsl: hsl, rnd: rnd, lg: lg, rg: rg, R: R, C: C, E: E, P: P, PA: PA, ST: ST, Gr: Gr,
    glow: glow, blur: blur, uid: uid, cone: cone, motes: motes, stars: stars, roomBase: roomBase, ART: ART, render: render };
})(NS);


/* ---- mondi-base.js ---- */
/* ============================================================================
   AURORA GLASS v3 — MONDI: base comune
   - palette continua per ogni ora del giorno (alba → giorno → tramonto → notte)
   - posizione di sole e luna lungo l'arco
   - cielo, stelle, nuvole, uccelli e piccoli helper SMIL riusati da tutti i mondi
   Ogni mondo produce un SVG autonomo e animato (CSS + SMIL): lo stesso file
   funziona come <img>, come sfondo CSS e dentro Home Assistant.
   ========================================================================== */
(function (g) {
  var A = g.AR, f = A.f;
  var poly = A.P, path = A.PA, rect = A.R, circ = A.C, ell = A.E, line = A.ST, grp = A.Gr;

  /* ------------------------------------------------------------- colori */
  function h2r(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function r2h(r) { return '#' + r.map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }).join(''); }
  function mix(a, b, t) { var x = h2r(a), y = h2r(b); return r2h([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }

  /* fasce: s1..s3 cielo (alto→basso) · hf/hn colline lontane/vicine · win luce finestre · sun · cl nuvole · st stelle
     dy luce del giorno (0 notte → 1 giorno) · b1..b3 colori dello sfondo UI · a1,a2 colori dei pulsanti */
  var KEYS = [
    [0,    { s1: '#070B24', s2: '#141A52', s3: '#2A2A78', hf: '#121A4A', hn: '#0A0F33', win: '#FFD27A', sun: '#FFF1B0', cl: .06, st: 1,   dy: 0,   b1: '#7C5CFF', b2: '#3B82F6', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }],
    [5,    { s1: '#070B24', s2: '#141A52', s3: '#2A2A78', hf: '#121A4A', hn: '#0A0F33', win: '#FFD27A', sun: '#FFF1B0', cl: .06, st: 1,   dy: 0,   b1: '#7C5CFF', b2: '#3B82F6', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }],
    [6.5,  { s1: '#3A2A7A', s2: '#D9648C', s3: '#FFC38A', hf: '#7A4F93', hn: '#44286B', win: '#FFE3A3', sun: '#FFC27A', cl: .38, st: .3,  dy: .35, b1: '#FB7185', b2: '#F59E0B', b3: '#8B5CF6', a1: '#F43F5E', a2: '#F59E0B' }],
    [8.5,  { s1: '#4A90E6', s2: '#8ACBFB', s3: '#F6E6D2', hf: '#6AB48C', hn: '#3F8F66', win: '#FFF6D2', sun: '#FFF3B8', cl: .7,  st: 0,   dy: .9,  b1: '#38BDF8', b2: '#34D399', b3: '#818CF8', a1: '#0284C7', a2: '#6366F1' }],
    [12,   { s1: '#2F86E6', s2: '#74BFFB', s3: '#D4EEFF', hf: '#6DB98F', hn: '#3F8F66', win: '#FFF6D2', sun: '#FFF3B8', cl: .8,  st: 0,   dy: 1,   b1: '#38BDF8', b2: '#34D399', b3: '#818CF8', a1: '#0284C7', a2: '#6366F1' }],
    [16.5, { s1: '#3B86E0', s2: '#86C2F4', s3: '#F8E6C8', hf: '#6DB98F', hn: '#3F8F66', win: '#FFF6D2', sun: '#FFF3B8', cl: .75, st: 0,   dy: .95, b1: '#38BDF8', b2: '#34D399', b3: '#818CF8', a1: '#0284C7', a2: '#6366F1' }],
    [18.5, { s1: '#35205F', s2: '#C23F7A', s3: '#FF9A62', hf: '#7A3A78', hn: '#4A1F5E', win: '#FFD27A', sun: '#FFB36B', cl: .4,  st: .25, dy: .3,  b1: '#F97316', b2: '#EC4899', b3: '#8B5CF6', a1: '#EA580C', a2: '#DB2777' }],
    [20.5, { s1: '#10103A', s2: '#2B2260', s3: '#4A2D78', hf: '#2A1F58', hn: '#150F3A', win: '#FFD27A', sun: '#FFB36B', cl: .15, st: .8,  dy: .05, b1: '#8B5CF6', b2: '#6366F1', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }],
    [22,   { s1: '#070B24', s2: '#141A52', s3: '#2A2A78', hf: '#121A4A', hn: '#0A0F33', win: '#FFD27A', sun: '#FFF1B0', cl: .06, st: 1,   dy: 0,   b1: '#7C5CFF', b2: '#3B82F6', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }],
    [24,   { s1: '#070B24', s2: '#141A52', s3: '#2A2A78', hf: '#121A4A', hn: '#0A0F33', win: '#FFD27A', sun: '#FFF1B0', cl: .06, st: 1,   dy: 0,   b1: '#7C5CFF', b2: '#3B82F6', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }]
  ];
  function palette(h) {
    h = ((h % 24) + 24) % 24;
    var i = 0; while (i < KEYS.length - 2 && h > KEYS[i + 1][0]) i++;
    var a = KEYS[i], b = KEYS[i + 1], t = (h - a[0]) / (b[0] - a[0]), K = {};
    Object.keys(a[1]).forEach(function (k) {
      var x = a[1][k], y = b[1][k];
      K[k] = typeof x === 'number' ? x + (y - x) * t : mix(x, y, t);
    });
    K.nt = 1 - K.dy;                        // "notte" 0..1
    K.cloud = mix('#ffffff', K.s3, .35);    // colore delle nuvole
    return K;
  }
  function body(h) {
    var sunT = (h - 5.5) / 15, hm = (h >= 19.5) ? h - 19.5 : h + 4.5, moonT = hm / 11;
    function arc(t) { t = Math.min(1, Math.max(0, t)); return { x: 50 + 540 * t, y: 192 - Math.sin(Math.PI * t) * 140 }; }
    var s = arc(sunT), m = arc(moonT);
    return { sun: { x: s.x, y: s.y, vis: (sunT >= 0 && sunT <= 1) ? 1 : 0, t: sunT }, moon: { x: m.x, y: m.y, vis: (moonT >= 0 && moonT <= 1) ? 1 : 0, t: moonT } };
  }

  /* ------------------------------------------------------------- SMIL */
  function an(attr, values, dur, ex) { return '<animate attributeName="' + attr + '" values="' + values + '" dur="' + dur + 's" repeatCount="indefinite" ' + (ex || '') + '/>'; }
  function at(type, values, dur, ex) { return '<animateTransform attributeName="transform" type="' + type + '" values="' + values + '" dur="' + dur + 's" repeatCount="indefinite" ' + (ex || '') + '/>'; }
  function circA(cx, cy, r, fill, inner, ex) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + fill + '" ' + (ex || '') + '>' + inner + '</circle>'; }
  function ellA(cx, cy, rx, ry, fill, inner, ex) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '" ' + (ex || '') + '>' + inner + '</ellipse>'; }

  var BASECSS = '.tw{animation:tw 3.2s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.95}50%{opacity:.2}}' +
    '.c1{animation:cl 80s linear infinite}.c2{animation:cl 120s linear infinite;animation-delay:-45s}.c3{animation:cl 100s linear infinite;animation-delay:-75s}' +
    '@keyframes cl{from{transform:translateX(-260px)}to{transform:translateX(900px)}}' +
    '.fl{animation:fl 2.8s steps(1) infinite}@keyframes fl{0%,100%{opacity:1}7%{opacity:.25}12%{opacity:1}55%{opacity:.7}58%{opacity:1}}' +
    '.pu{animation:pu 3s ease-in-out infinite}@keyframes pu{50%{opacity:.45}}';

  /* ------------------------------------------------------------- elementi comuni */
  function stars(K, o) {
    o = o || {};
    var rd = A.rnd(o.seed || 5), n = o.n || 38, s = '', ymax = o.ymax || 130;
    for (var i = 0; i < n; i++) {
      s += '<circle class="tw" cx="' + f(rd() * 640) + '" cy="' + f(rd() * ymax) + '" r="' + f(.5 + rd() * 1.1) + '" fill="#fff" style="animation-delay:-' + f(rd() * 4) + 's;animation-duration:' + f(2.4 + rd() * 2.8) + 's"/>';
    }
    return '<g opacity="' + f(Math.max(K.st, o.min || 0)) + '">' + s + '</g>';
  }
  function sunmoon(K, B, o) {
    o = o || {};
    var s = '';
    s += '<g transform="translate(' + f(B.sun.x) + ' ' + f(B.sun.y) + ')" opacity="' + B.sun.vis + '"><circle r="62" fill="' + A.rg([[0, '#fff', .95], [.22, K.sun, .6], [1, K.sun, 0]]) + '"/><circle r="15" fill="' + K.sun + '"/></g>';
    s += '<g transform="translate(' + f(B.moon.x) + ' ' + f(B.moon.y) + ')" opacity="' + B.moon.vis + '"><circle r="52" fill="' + A.rg([[0, '#DDE6FF', .5], [1, '#DDE6FF', 0]]) + '"/><circle r="13" fill="#EEF2FF"/><circle cx="-4" cy="-3" r="2.4" fill="#C9D3F5"/><circle cx="4" cy="4" r="3" fill="#C9D3F5"/></g>';
    return s;
  }
  function cloud(x, y, sc, cls, K) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" opacity="' + f(K.cl) + '"><g class="' + cls + '" fill="' + K.cloud + '"><ellipse cx="30" cy="12" rx="34" ry="9"/><ellipse cx="48" cy="5" rx="22" ry="10"/><ellipse cx="14" cy="8" rx="20" ry="8"/></g></g>';
  }
  function sky(K, B, o) {
    o = o || {};
    var s = rect(0, 0, 640, 260, A.lg([[0, K.s1], [.62, K.s2], [1, K.s3]]));
    if (o.stars !== 0) s += stars(K, { n: o.stars, seed: o.seed, min: o.minStar, ymax: o.ymax });
    if (!o.noBodies) s += sunmoon(K, B);
    var n = o.clouds === undefined ? 3 : o.clouds;
    if (n > 0) s += cloud(0, 54, 1, 'c1', K);
    if (n > 1) s += cloud(0, 28, .75, 'c2', K);
    if (n > 2) s += cloud(0, 92, .9, 'c3', K);
    return s;
  }
  function bird(y, dur, delay, sc, col) {
    sc = sc || 1;
    return '<g transform="scale(' + sc + ')"><g>' + at('translate', f(-40 / sc) + ' ' + f(y / sc) + ';' + f(700 / sc) + ' ' + f((y - 14) / sc), dur, 'begin="-' + delay + 's"') +
      '<path d="M0 0 q5 -6 10 0 q5 -6 10 0" fill="none" stroke="' + (col || '#1a1a3a') + '" stroke-width="2" stroke-linecap="round">' +
      an('d', 'M0 0 q5 -6 10 0 q5 -6 10 0;M0 0 q5 4 10 0 q5 4 10 0;M0 0 q5 -6 10 0 q5 -6 10 0', .9) + '</path></g></g>';
  }
  function smoke(x, y, col, n) {
    var s = '';
    n = n || 4;
    for (var i = 0; i < n; i++) {
      var dly = -(i * 4 / n);
      s += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + (col || '#cfd6ee') + '" opacity="0">' +
        an('cy', y + ';' + (y - 46), 4, 'begin="' + f(dly) + 's"') + an('cx', x + ';' + (x + 10), 4, 'begin="' + f(dly) + 's"') + an('r', '3;10', 4, 'begin="' + f(dly) + 's"') + an('opacity', '0;.45;0', 4, 'begin="' + f(dly) + 's"') + '</circle>';
    }
    return s;
  }
  function snow(n, seed, col, ymax) {
    var rd = A.rnd(seed || 41), s = '';
    for (var i = 0; i < n; i++) {
      var x = rd() * 640, d = 5 + rd() * 6, r = .9 + rd() * 1.6, dx = 12 + rd() * 22;
      s += '<circle cx="' + f(x) + '" cy="-6" r="' + f(r) + '" fill="' + (col || '#fff') + '" opacity=".85">' +
        an('cy', '-6;' + (ymax || 262), d, 'begin="-' + f(rd() * d) + 's"') + an('cx', f(x) + ';' + f(x + dx) + ';' + f(x - dx * .4) + ';' + f(x), d, 'begin="-' + f(rd() * d) + 's"') + '</circle>';
    }
    return s;
  }

  /* ------------------------------------------------------------- registro */
  var W = {};
  function svg(id, h) {
    var w = W[id];
    var K = palette(h), B = body(h);
    A.begin('w' + id + '_');
    var inner = w.draw(K, h, B);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="640" height="260"><defs>' + A.filters() + A.defs() + '</defs><style>' + BASECSS + (w.css || '') + '</style>' + inner + '</svg>';
  }
  function dataURL(id, h) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(id, h)); }

  g.AMB = { W: W, palette: palette, body: body, mix: mix, svg: svg, dataURL: dataURL, BASECSS: BASECSS, /* DHC: BASECSS exported */
    H: { poly: poly, path: path, rect: rect, circ: circ, ell: ell, line: line, grp: grp, an: an, at: at, circA: circA, ellA: ellA, sky: sky, stars: stars, sunmoon: sunmoon, cloud: cloud, bird: bird, smoke: smoke, snow: snow, mix: mix } };
})(NS);


/* ---- mondi-a.js ---- */
/* AURORA GLASS v3 — MONDI (1/2): Casetta · Città · Montagna · Mare e faro · Foresta magica */
(function () {
  var A = NS.AR, W = NS.AMB.W, H = NS.AMB.H, f = A.f, mix = H.mix;
  var poly = H.poly, path = H.path, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, grp = H.grp, an = H.an, at = H.at, circA = H.circA, ellA = H.ellA, sky = H.sky, bird = H.bird, smoke = H.smoke, snow = H.snow;

  /* abete con oscillazione leggera */
  function pine(x, y, hg, col, ph, cap) {
    var w = hg * .42, s = '';
    s += poly(f(x) + ',' + f(y - hg) + ' ' + f(x - w * .55) + ',' + f(y - hg * .62) + ' ' + f(x + w * .55) + ',' + f(y - hg * .62), col);
    s += poly(f(x) + ',' + f(y - hg * .82) + ' ' + f(x - w * .78) + ',' + f(y - hg * .34) + ' ' + f(x + w * .78) + ',' + f(y - hg * .34), col);
    s += poly(f(x) + ',' + f(y - hg * .58) + ' ' + f(x - w) + ',' + f(y - hg * .06) + ' ' + f(x + w) + ',' + f(y - hg * .06), col);
    s += rect(x - w * .09, y - hg * .1, w * .18, hg * .12, col);
    if (cap) s += poly(f(x) + ',' + f(y - hg) + ' ' + f(x - w * .3) + ',' + f(y - hg * .82) + ' ' + f(x + w * .3) + ',' + f(y - hg * .82), cap) + poly(f(x) + ',' + f(y - hg * .82) + ' ' + f(x - w * .42) + ',' + f(y - hg * .6) + ' ' + f(x + w * .42) + ',' + f(y - hg * .6), cap, 'opacity=".9"');
    return '<g>' + at('rotate', '-1.4 ' + f(x) + ' ' + f(y) + ';1.4 ' + f(x) + ' ' + f(y) + ';-1.4 ' + f(x) + ' ' + f(y), 5 + (ph || 0) % 3, 'begin="-' + f(ph || 0) + 's"') + s + '</g>';
  }
  H.pine = pine;
  function winDark(K, ws) { var c = mix('#0b1233', K.s2, K.dy * .55), s = ''; ws.forEach(function (w) { s += rect(w.x, w.y, w.w, w.h, c, 3, 'opacity=".85"'); }); return s; }

  /* ============================================================ CASETTA */
  var WIN_CASA = [{ k: 'camera', x: 398, y: 162, w: 28, h: 20 }, { k: 'cameretta', x: 494, y: 162, w: 28, h: 20 }, { k: 'salotto', x: 398, y: 196, w: 34, h: 22 }, { k: 'cucina', x: 488, y: 196, w: 34, h: 22 }, { k: 'ingresso', x: 447, y: 190, w: 26, h: 36 }];
  W.casetta = { name: 'Casetta', icon: 'mdi-home-variant', desc: 'Sole, luna, nuvole e la tua casetta con le finestre che si accendono', windows: WIN_CASA, draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 3 }), dark = mix(K.hn, '#000', .34), roof = mix(K.hn, '#000', .45);
    s += path('M-10 190 Q90 140 190 176 T380 160 T650 178 V260 H-10Z', K.hf) + path('M-10 232 Q120 200 270 220 T650 212 V260 H-10Z', K.hn);
    s += pine(312, 224, 50, dark, 0) + pine(601, 222, 54, dark, 1.5) + pine(622, 227, 36, dark, 3);
    s += rect(441, 104, 16, 30, roof) + poly('366,154 460,98 554,154', roof) + rect(380, 150, 160, 76, mix(K.hn, '#1b2350', .25), 2) + circ(460, 128, 9, 'rgba(0,0,0,.35)');
    s += winDark(K, WIN_CASA) + poly('447,226 473,226 502,260 418,260', 'rgba(255,255,255,.07)');
    s += smoke(449, 100, K.cloud) + bird(60, 34, 0, 1) + bird(84, 46, 18, .8);
    return s;
  } };

  /* ============================================================ CITTÀ */
  var WIN_CITTA = [{ k: 'salotto', x: 396, y: 118, w: 15, h: 17 }, { k: 'cucina', x: 430, y: 118, w: 15, h: 17 }, { k: 'camera', x: 396, y: 156, w: 15, h: 17 }, { k: 'cameretta', x: 430, y: 156, w: 15, h: 17 }];
  function car(y, dir, dur, dly, col, K) {
    var body = rect(0, 0, 28, 8, col, 3) + poly('5,0 9,-6 20,-6 24,0', col) + rect(10, -5, 4, 4, 'rgba(255,255,255,.55)', 1) + rect(16, -5, 4, 4, 'rgba(255,255,255,.55)', 1) + circ(27, 3, 2.6, '#fff') + circ(1, 3, 2, '#ff3b4e') + circ(8, 8, 3, '#111') + circ(21, 8, 3, '#111');
    var glow = circ(30, 3, 14, A.rg([[0, '#fff', .55 * K.nt + .1], [1, '#fff', 0]])) + rect(-34, 1, 34, 4, A.lg([[0, '#ff3b4e', 0], [1, '#ff3b4e', .5 * K.nt + .15]], { x1: 0, y1: 0, x2: 1, y2: 0 }));
    var x0 = dir > 0 ? -60 : 700, x1 = dir > 0 ? 700 : -60;
    return '<g>' + at('translate', x0 + ' ' + y + ';' + x1 + ' ' + y, dur, 'begin="-' + dly + 's"') + '<g transform="scale(' + (dir > 0 ? 1 : -1) + ' 1)">' + glow + body + '</g></g>';
  }
  W.citta = { name: 'Città', icon: 'mdi-city-variant', desc: 'Grattacieli con finestre che si accendono, auto, aereo e insegne al neon', windows: WIN_CITTA, draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 2, stars: 34 }), rd = A.rnd(77), far = mix(K.hf, K.s3, .3), lit = K.nt * .72 + .05;
    var x = -10; while (x < 640) { var w = 24 + rd() * 20, hh = 44 + rd() * 66; s += rect(x, 222 - hh, w, hh + 20, far); x += w + 2 + rd() * 4; }
    var B2 = [[-14, 56, 112], [38, 62, 98], [96, 50, 152], [150, 62, 112], [216, 46, 134], [310, 58, 120], [360, 100, 178], [466, 56, 112], [526, 60, 144], [588, 62, 104]];
    var dark = mix(K.hn, '#000', .12);
    B2.forEach(function (b, bi) {
      var bx = b[0], bw = b[1], bh = b[2], top = 232 - bh;
      s += rect(bx, top, bw, bh + 4, dark) + rect(bx, top, bw, 3, mix(dark, K.s3, .25));
      var cols = Math.floor((bw - 8) / 11), rows = Math.floor((bh - 12) / 13);
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var wx = bx + 6 + c * 11, wy = top + 9 + r * 13, reserved = false;
        WIN_CITTA.forEach(function (w) { if (wx + 5 > w.x - 2 && wx < w.x + w.w + 2 && wy + 6 > w.y - 2 && wy < w.y + w.h + 2) reserved = true; });
        if (reserved) continue;
        var on = rd() < lit;
        s += rect(wx, wy, 5.5, 7, on ? K.win : mix(K.hn, K.s2, .2 + .2 * K.dy), 0.8, (on && rd() < .12) ? 'class="fl" style="animation-delay:-' + f(rd() * 3) + 's"' : (on ? '' : 'opacity=".75"'));
      }
      if (bi === 8) { // insegna neon
        s += rect(bx + 8, top - 26, 44, 20, '#12041f', 3) +
          '<rect x="' + (bx + 11) + '" y="' + (top - 23) + '" width="38" height="14" rx="2" fill="#FF3DA8" opacity="' + f(.35 + .6 * K.nt) + '">' + an('fill', '#FF3DA8;#22D3EE;#FF3DA8', 4) + '</rect>' +
          circ(bx + 30, top - 16, 22, A.rg([[0, '#FF3DA8', .5 * K.nt], [1, '#FF3DA8', 0]])) + rect(bx + 14, top - 6, 2, 6, '#555') + rect(bx + 44, top - 6, 2, 6, '#555');
      }
      if (bi === 2) s += rect(bx + 24, top - 18, 2, 18, '#666') + circA(bx + 25, top - 19, 2.4, '#ff3b4e', an('opacity', '1;.1;1', 1.4));
    });
    // torre
    s += poly('282,232 304,232 298,70 288,70', mix(K.hn, '#000', .2)) + rect(292, 40, 2, 34, '#777') + ell(293, 120, 18, 4, mix(K.hn, K.s3, .25)) + ell(293, 150, 14, 3.4, mix(K.hn, K.s3, .25)) +
      '<circle cx="293" cy="38" r="3" fill="#ff3b4e">' + an('opacity', '1;.1;1', 1.6) + '</circle>' + circ(293, 38, 14, A.rg([[0, '#ff3b4e', .6 * K.nt], [1, '#ff3b4e', 0]]));
    s += winDark(K, WIN_CITTA);
    // strada
    s += rect(0, 236, 640, 24, '#0b0e1c') + rect(0, 235, 640, 2, mix(K.hn, K.s3, .25));
    for (var d = 0; d < 14; d++) s += rect(d * 50 + 8, 247, 26, 2.4, 'rgba(255,255,255,.5)', 1);
    s += car(238, 1, 9, 2, '#E85D75', K) + car(250, -1, 13, 5, '#FBBF24', K) + car(238, 1, 17, 11, '#22D3EE', K);
    // aereo
    s += '<g opacity="' + f(.35 + .65 * K.nt) + '"><g>' + at('translate', '-30 44;680 24', 38, 'begin="-12s"') + ell(0, 0, 9, 2.4, '#d6dcf0') + poly('-2,0 -8,-6 -4,0', '#d6dcf0') + poly('0,0 6,5 2,0', '#aeb6d2') + circA(-9, 0, 1.6, '#ff3b4e', an('opacity', '1;0;1', 1)) + '</g></g>';
    return s;
  } };

  /* ============================================================ MONTAGNA */
  W.montagna = { name: 'Montagna', icon: 'mdi-image-filter-hdr', desc: 'Cime innevate, funivia, baita, aurora boreale e neve che cade', windows: [{ k: 'salotto', x: 484, y: 222, w: 10, h: 9 }, { k: 'cucina', x: 500, y: 222, w: 10, h: 9 }], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 2, stars: 44 });
    var snowc = mix('#ffffff', K.s3, .22 + .3 * K.nt);
    // aurora
    var au = K.nt * .8;
    if (au > .02) {
      var g1 = A.lg([[0, '#22FFA8', 0], [.5, '#22FFA8', .75], [1, '#8B5CF6', 0]]), g2 = A.lg([[0, '#22D3EE', 0], [.5, '#B07CFF', .6], [1, '#FF5CCB', 0]]);
      s += '<g opacity="' + f(au) + '" filter="url(#' + 'wmontagna_b14)">' +
        '<g>' + at('translate', '-24 0;24 8;-24 0', 11) + path('M-40 120 C 80 20 200 100 300 40 S 520 90 700 30 L700 100 C 520 150 400 80 300 110 S 80 150 -40 120Z', g1) + '</g>' +
        '<g>' + at('translate', '20 0;-20 6;20 0', 14) + path('M-40 150 C 120 70 240 120 340 70 S 540 110 700 60 L700 120 C 540 160 420 110 340 130 S 120 170 -40 150Z', g2, 'opacity=".8"') + '</g></g>';
    }
    // montagne
    s += poly('-10,206 60,134 108,172 170,88 242,182 300,122 372,192 440,98 520,172 584,132 650,182 650,262 -10,262', mix(K.hf, K.s3, .35));
    [[170, 88, 18, 26], [440, 98, 18, 26], [300, 122, 12, 18]].forEach(function (p) {
      s += poly(p[0] + ',' + p[1] + ' ' + (p[0] - p[2]) + ',' + (p[1] + p[3]) + ' ' + (p[0] - p[2] * .45) + ',' + (p[1] + p[3] - 6) + ' ' + (p[0] - p[2] * .1) + ',' + (p[1] + p[3] + 3) + ' ' + (p[0] + p[2] * .3) + ',' + (p[1] + p[3] - 5) + ' ' + (p[0] + p[2]) + ',' + (p[1] + p[3]), snowc);
    });
    s += poly('-10,236 80,170 150,216 230,160 320,226 420,174 520,224 600,180 650,214 650,262 -10,262', K.hf) + poly('230,160 214,182 224,178 232,188 244,176', snowc, 'opacity=".9"') + poly('420,174 404,194 414,190 424,200 438,188', snowc, 'opacity=".9"');
    // funivia
    s += line('M20 56 L610 128', mix(K.hn, '#000', .2), 1.6) + rect(330, 80, 3, 48, mix(K.hn, '#000', .3)) + poly('322,78 341,78 336,70 327,70', mix(K.hn, '#000', .3));
    s += '<g>' + '<animateMotion dur="16s" repeatCount="indefinite" path="M20 56 L610 128" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"/>' + rect(-1, 0, 2, 12, mix(K.hn, '#000', .3)) + rect(-8, 12, 16, 11, '#E85D75', 2) + rect(-6, 14, 5, 5, mix('#FFE9B0', K.win, .5), 1) + rect(1, 14, 5, 5, mix('#FFE9B0', K.win, .5), 1) + '</g>';
    // foresta
    var rd = A.rnd(12), tc = mix(K.hn, '#06140f', .55);
    for (var i = 0; i < 30; i++) { var x = i * 22 + rd() * 10; if (x > 460 && x < 520) continue; s += pine(x, 244 + rd() * 6, 28 + rd() * 22, i % 2 ? tc : mix(tc, K.hn, .3), rd() * 4, snowc); }
    s += rect(-10, 244, 660, 20, mix('#ffffff', K.s3, .35 + .3 * K.nt));
    // baita
    s += rect(476, 214, 40, 28, mix('#7a4a2b', K.hn, .35 + .3 * K.nt)) + poly('470,216 496,198 522,216', mix('#3b2a22', K.hn, .3)) + rect(504, 200, 6, 12, mix('#3b2a22', K.hn, .3)) + poly('470,216 496,198 522,216 518,216 496,202 474,216', snowc) + rect(484, 222, 10, 9, mix('#0b1233', K.s2, K.dy * .5)) + rect(500, 222, 10, 9, mix('#0b1233', K.s2, K.dy * .5)) + smoke(507, 198, K.cloud);
    s += snow(16, 61, '#fff', 262);
    return s;
  } };

  /* ============================================================ MARE E FARO */
  function waves(y, col, op, dur, dir) {
    var d = 'M-160 ' + y; for (var i = 0; i < 12; i++) d += ' q20 -9 40 0 t40 0';
    d += ' V270 H-160Z';
    return '<g opacity="' + op + '"><g>' + at('translate', dir > 0 ? '0 0;80 0' : '0 0;-80 0', dur) + path(d, col) + '</g></g>';
  }
  W.mare = { name: 'Mare e faro', icon: 'mdi-lighthouse', desc: 'Onde che scorrono, barca a vela, gabbiani, delfino e un faro che gira', windows: [], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 3 }), hz = 158;
    var sea1 = mix(mix(K.s2, '#0b3a6b', .55), K.s3, .2), sea2 = mix(mix(K.s1, '#06203f', .6), '#000', .1);
    s += rect(0, hz, 640, 110, A.lg([[0, sea1], [1, sea2]]));
    // riflesso di sole/luna
    [[B.sun, K.sun], [B.moon, '#DDE8FF']].forEach(function (p) {
      var b = p[0]; if (!b.vis || b.y > hz - 6) return;
      for (var i = 0; i < 9; i++) s += '<ellipse cx="' + f(b.x) + '" cy="' + (hz + 6 + i * 11) + '" rx="' + f(6 + i * 3) + '" ry="1.8" fill="' + p[1] + '" opacity="' + f(.55 - i * .045) + '">' + an('rx', f(6 + i * 3) + ';' + f(9 + i * 3.6) + ';' + f(6 + i * 3), 2.2 + i * .17) + an('opacity', f(.55 - i * .045) + ';' + f(.3 - i * .02) + ';' + f(.55 - i * .045), 2.2 + i * .17) + '</ellipse>';
    });
    s += rect(0, hz - 1, 640, 2, 'rgba(255,255,255,.18)');
    s += waves(176, mix(sea1, '#fff', .12), .35, 9, 1) + waves(198, mix(sea1, '#000', .1), .4, 6.5, -1) + waves(226, mix(sea2, '#000', .1), .55, 4.5, 1);
    // faro
    var fx = 540, lx = fx, ly = 128;
    s += poly('486,262 516,226 566,228 596,262', mix(K.hn, '#000', .3)) + poly('524,230 556,230 548,140 532,140', '#F4F6FF') + poly('528,205 552,205 550,188 530,188', '#E5484D') + poly('534,168 548,168 546,152 536,152', '#E5484D');
    s += rect(526, 134, 28, 6, mix(K.hn, '#000', .4), 1) + rect(532, 118, 16, 16, mix(K.hn, '#000', .35), 2) + poly('528,118 540,104 552,118', '#E5484D') + rect(534, 122, 12, 10, mix('#2a3350', K.win, K.nt), 1);
    var nl = K.nt;
    if (nl > .05) {
      var beam = A.lg([[0, '#FFF3C4', .85 * nl], [1, '#FFF3C4', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 });
      s += circ(lx, 127, 26, A.rg([[0, '#FFF3C4', .9 * nl], [1, '#FFF3C4', 0]]));
      s += '<g transform="translate(' + lx + ' 127)"><g>' + at('scale', '1 1;.87 1;.5 1;.04 1;-.5 1;-.87 1;-1 1;-.87 1;-.5 1;-.04 1;.5 1;.87 1;1 1', 9) +
        poly('0,-5 -330,-26 -330,26 0,5', A.lg([[0, '#FFF3C4', .85 * nl], [1, '#FFF3C4', 0]], { x1: 1, y1: 0, x2: 0, y2: 0 })) + poly('0,-5 330,-26 330,26 0,5', A.lg([[0, '#FFF3C4', .85 * nl], [1, '#FFF3C4', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 })) + '</g></g>';
    }
    // barca
    s += '<g><g>' + at('translate', '0 0;0 -3;0 0', 3.4) + '<g>' + at('rotate', '-3 200 214;3 200 214;-3 200 214', 4.2) +
      poly('170,214 230,214 220,230 180,230', '#8E5A33') + rect(170, 211, 60, 4, '#E9C46A') + rect(199, 150, 3, 62, '#C9CCDD') + poly('201,152 201,206 238,206', '#FFFFFF') + poly('199,160 199,206 172,206', '#FFE3C4') + poly('201,150 214,154 201,158', '#E5484D') + '</g></g></g>';
    // delfino
    s += '<g opacity="' + f(K.dy) + '"><g><animateMotion dur="11s" begin="-3s" repeatCount="indefinite" rotate="auto" path="M60 214 Q130 120 220 216" keyTimes="0;1" keyPoints="0;1" calcMode="linear"/>' +
      path('M-18 0 Q-6 -10 10 -4 Q18 -2 22 -5 Q20 2 14 3 Q4 8 -18 0Z', '#5B8FB9') + poly('-4,-7 2,-16 4,-6', '#4A7BA0') + poly('-18,0 -26,-6 -24,3', '#4A7BA0') + circ(14, -3, 1.2, '#fff') + '</g></g>';
    s += bird(70, 40, 5, 1, '#fff') + bird(96, 52, 30, .8, '#fff') + bird(54, 62, 14, .7, '#fff');
    return s;
  } };

  /* ============================================================ FORESTA MAGICA */
  W.foresta = { name: 'Foresta magica', icon: 'mdi-pine-tree', desc: 'Raggi di sole di giorno, lucciole, funghi luminosi e un gufo di notte', windows: [], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 1, stars: 36 }), rd = A.rnd(33), nl = K.nt, dl = K.dy;
    var far = mix(K.hf, K.s3, .25), mid = mix(K.hn, '#0b2a1c', .35), nea = mix(K.hn, '#04120c', .6);
    // raggi di sole
    if (dl > .1) {
      var ray = A.lg([[0, K.sun, .6], [1, K.sun, 0]]), rs = '';
      [90, 160, 240, 330].forEach(function (x, i) { rs += '<g>' + an('opacity', '.35;.8;.35', 5 + i, 'begin="-' + i + 's"') + poly(x + ',-10 ' + (x + 26) + ',-10 ' + (x + 120) + ',260 ' + (x + 54) + ',260', ray) + '</g>'; });
      s += '<g opacity="' + f(dl * .65) + '">' + rs + '</g>';
    }
    // alberi lontani e medi
    s += path('M-10 200 Q80 170 170 196 T340 190 T520 194 T650 188 V262 H-10Z', far);
    for (var i = 0; i < 16; i++) s += pine(i * 42 + rd() * 14, 206, 52 + rd() * 36, far, rd() * 4);
    s += path('M-10 226 Q100 204 220 222 T440 220 T650 214 V262 H-10Z', mid);
    for (var j = 0; j < 12; j++) { var x = j * 56 + rd() * 20; s += pine(x, 232, 70 + rd() * 44, mid, rd() * 4); }
    // nebbia
    [[120, 214, 120], [380, 222, 150], [560, 212, 110]].forEach(function (m, i) {
      s += '<g opacity="' + f(.22 + .12 * nl) + '" filter="url(#wforesta_b14)"><g>' + at('translate', '-34 0;34 0;-34 0', 14 + i * 3) + ell(m[0], m[1], m[2], 14, mix('#ffffff', K.s3, .3)) + '</g></g>';
    });
    // stagno
    s += ell(300, 246, 88, 12, mix(K.s2, '#0b1d2a', .45)) + ell(300, 246, 88, 12, 'rgba(255,255,255,.08)');
    var refl = B.moon.vis ? '#DDE8FF' : K.sun;
    s += ellA(310, 246, 16 + 8 * dl, 4, refl, an('rx', '14;22;14', 3.6), 'opacity="' + f(.3 + .3 * nl) + '"');
    ['0', '-1.4'].forEach(function (b) { s += '<ellipse cx="270" cy="248" rx="4" ry="1.2" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1">' + an('rx', '4;30', 2.8, 'begin="' + b + 's"') + an('ry', '1.2;6', 2.8, 'begin="' + b + 's"') + an('opacity', '.8;0', 2.8, 'begin="' + b + 's"') + '</ellipse>'; });
    // terreno scuro
    s += path('M-10 250 Q120 236 300 252 T650 244 V262 H-10Z', nea);
    // funghi
    [[70, 248, 1, '#FF7AC8'], [118, 252, .7, '#22D3EE'], [468, 250, 1.1, '#FF7AC8'], [520, 254, .8, '#B07CFF'], [572, 248, .9, '#22D3EE']].forEach(function (m, i) {
      var gl = .25 + .65 * nl;
      s += '<g opacity="' + f(gl) + '">' + circ(m[0], m[1] - 10 * m[2], 30 * m[2], A.rg([[0, m[3], .7], [1, m[3], 0]])) + '</g>' + rect(m[0] - 2.4 * m[2], m[1] - 10 * m[2], 4.8 * m[2], 10 * m[2], '#EDE7F6', 1.5) + path('M' + f(m[0] - 11 * m[2]) + ' ' + f(m[1] - 9 * m[2]) + ' Q' + m[0] + ' ' + f(m[1] - 28 * m[2]) + ' ' + f(m[0] + 11 * m[2]) + ' ' + f(m[1] - 9 * m[2]) + 'Z', m[3]) + circ(m[0] - 3 * m[2], m[1] - 16 * m[2], 1.6 * m[2], 'rgba(255,255,255,.7)') + circ(m[0] + 4 * m[2], m[1] - 14 * m[2], 1.2 * m[2], 'rgba(255,255,255,.7)');
    });
    // gufo su un ramo
    s += path('M470 118 Q520 112 600 122 L600 128 Q520 120 470 124Z', '#3a2a22') + ell(552, 100, 11, 15, '#7A5A44') + poly('544,88 542,78 550,86', '#7A5A44') + poly('560,88 562,78 554,86', '#7A5A44') + ell(552, 105, 7, 9, '#C9A98A') +
      '<g>' + circ(548, 96, 4.6, '#FFE29A') + circ(556, 96, 4.6, '#FFE29A') + '<ellipse cx="548" cy="96" rx="4.6" ry="4.6" fill="#1b1330">' + an('ry', '0.1;0.1;4.6;4.6;4.6', 5.4, 'keyTimes="0;.03;.06;.3;1"') + '</ellipse><ellipse cx="556" cy="96" rx="4.6" ry="4.6" fill="#1b1330">' + an('ry', '0.1;0.1;4.6;4.6;4.6', 5.4, 'keyTimes="0;.03;.06;.3;1"') + '</ellipse>' + circ(548, 96, 1.8, '#1b1330') + circ(556, 96, 1.8, '#1b1330') + poly('552,98 550,101 554,101', '#E9B44C') + '</g>' + circ(552, 96, 26, A.rg([[0, '#FFE29A', .35 * nl], [1, '#FFE29A', 0]]));
    // lucciole
    var ff = '';
    for (var k = 0; k < 26; k++) {
      var fx = 30 + rd() * 580, fy = 120 + rd() * 120, d = 6 + rd() * 6, dx = (rd() - .5) * 60, dy = (rd() - .5) * 36;
      ff += '<g>' + at('translate', '0 0;' + f(dx) + ' ' + f(dy) + ';' + f(-dx * .5) + ' ' + f(dy * .6) + ';0 0', d, 'begin="-' + f(rd() * d) + 's"') + circ(fx, fy, 9, A.rg([[0, '#FFF59A', .8], [1, '#FFF59A', 0]])) + '<circle cx="' + f(fx) + '" cy="' + f(fy) + '" r="1.6" fill="#FFFBD0">' + an('opacity', '1;.15;1', 1.6 + rd() * 2, 'begin="-' + f(rd() * 3) + 's"') + '</circle></g>';
    }
    s += '<g opacity="' + f(nl * .95) + '">' + ff + '</g>';
    return s;
  } };
})();


/* ---- mondi-b.js ---- */
/* AURORA GLASS v3 — MONDI (2/2): Spazio · Giappone · Cyberpunk · Natale · Oceano */
(function () {
  var A = NS.AR, W = NS.AMB.W, H = NS.AMB.H, f = A.f, mix = H.mix;
  var poly = H.poly, path = H.path, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, grp = H.grp, an = H.an, at = H.at, circA = H.circA, ellA = H.ellA,
      sky = H.sky, bird = H.bird, smoke = H.smoke, snow = H.snow, pine = H.pine;
  function winDark(K, ws) { var c = mix('#0b1233', K.s2, K.dy * .55), s = ''; ws.forEach(function (w) { s += rect(w.x, w.y, w.w, w.h, c, 3, 'opacity=".85"'); }); return s; }

  /* ============================================================ SPAZIO */
  W.spazio = { name: 'Spazio', icon: 'mdi-rocket-launch', desc: 'Nebulose, pianeta con anelli, astronauta che fluttua, stelle cadenti, satellite e UFO', windows: [], draw: function (K, h, B) {
    var s = rect(0, 0, 640, 260, A.lg([[0, mix('#04010d', K.s1, .45)], [1, mix('#0a0730', K.s2, .5)]]));
    var neb = [[120, 90, 190, 70, K.b1, 18], [420, 60, 200, 60, K.b2, 23], [300, 200, 230, 50, K.b3, 29]];
    neb.forEach(function (n, i) { s += '<g opacity=".5" filter="url(#wspazio_b14)"><g>' + at('translate', '-18 0;18 10;-18 0', n[5]) + ell(n[0], n[1], n[2], n[3], n[4]) + '</g></g>'; });
    s += H.stars(K, { n: 80, seed: 9, ymax: 260, min: 1 });
    // pianeta con anelli
    var px = 520, py = 168;
    s += '<g>' + at('translate', '0 0;-6 5;0 0', 14) + '<g transform="rotate(-16 ' + px + ' ' + py + ')">' + '<ellipse cx="' + px + '" cy="' + py + '" rx="112" ry="22" fill="none" stroke="' + mix(K.b1, '#ffffff', .4) + '" stroke-width="8" opacity=".55"/>' + '<ellipse cx="' + px + '" cy="' + py + '" rx="94" ry="18" fill="none" stroke="' + mix(K.b3, '#ffffff', .3) + '" stroke-width="3" opacity=".5"/></g>';
    var pg = A.lg([[0, mix(K.b2, '#ffffff', .25)], [.5, mix(K.b1, '#2a1a6a', .3)], [1, mix(K.b1, '#0b0630', .7)]], { x1: 0, y1: 0, x2: .7, y2: 1 }), pcid = A.uid('pc');
    s += '<clipPath id="' + pcid + '"><circle cx="' + px + '" cy="' + py + '" r="62"/></clipPath><g clip-path="url(#' + pcid + ')">' + circ(px, py, 62, pg);
    [-34, -14, 8, 30].forEach(function (dy, i) { s += rect(px - 70, py + dy, 140, 7 + i * 2, 'rgba(255,255,255,' + (.14 + i * .03) + ')'); });
    s += circ(px - 24, py - 24, 70, A.rg([[0, '#fff', .3], [1, '#fff', 0]])) + '</g>' + circ(px, py, 62, 'none', 'stroke="rgba(255,255,255,.2)" stroke-width="1.5"');
    s += '<g transform="rotate(-16 ' + px + ' ' + py + ')"><path d="M' + (px - 112) + ' ' + py + ' A112 22 0 0 0 ' + (px + 112) + ' ' + py + '" fill="none" stroke="' + mix(K.b1, '#ffffff', .4) + '" stroke-width="8" opacity=".75"/><path d="M' + (px - 94) + ' ' + py + ' A94 18 0 0 0 ' + (px + 94) + ' ' + py + '" fill="none" stroke="' + mix(K.b3, '#ffffff', .3) + '" stroke-width="3" opacity=".7"/></g></g>';
    // lune
    s += circ(110, 56, 20, A.lg([[0, '#EEF0FF'], [1, '#8E93C6']], { x1: 0, y1: 0, x2: 1, y2: 1 })) + circ(103, 50, 4, 'rgba(60,60,110,.35)') + circ(116, 63, 5, 'rgba(60,60,110,.3)') + circ(116, 48, 2.6, 'rgba(60,60,110,.3)');
    s += circ(52, 196, 14, A.lg([[0, '#FF9A7A'], [1, '#B8402E']], { x1: 0, y1: 0, x2: 1, y2: 1 })) + circ(48, 192, 3, 'rgba(120,30,20,.4)');
    // astronauta
    var astro = path('M-6 -4 Q-30 -22 -52 -46', 'none', 'stroke="#C9CEDB" stroke-width="2.4" stroke-linecap="round" opacity=".7"') +
      rect(-17, -9, 8, 22, '#C9CEDB', 3) + rect(-12, -10, 24, 28, '#F4F6FF', 8) + rect(-12, 8, 24, 5, '#E5484D') + rect(6, -2, 11, 5, '#F4F6FF', 3) + grp(rect(-20, -2, 11, 5, '#F4F6FF', 3), 'rotate(18 -9 0)') +
      grp(rect(-11, 16, 8, 18, '#F4F6FF', 4) + rect(-12, 30, 10, 5, '#98A3B8', 2), 'rotate(8 -7 16)') + grp(rect(3, 16, 8, 18, '#F4F6FF', 4) + rect(2, 30, 10, 5, '#98A3B8', 2), 'rotate(-12 7 16)') +
      circ(0, -22, 15, '#F4F6FF') + ell(0, -22, 11.5, 10, A.lg([[0, '#1d2a5c'], [1, '#6b8cff']], { x1: 0, y1: 0, x2: 1, y2: 1 })) + ell(-4, -26, 4, 2.6, 'rgba(255,255,255,.55)') + circ(0, -22, 15, 'none', 'stroke="#C9CEDB" stroke-width="1.4"') + rect(-4, -3, 8, 5, '#C9CEDB', 2);
    s += '<g transform="translate(330 124)"><g>' + at('translate', '0 0;5 -9;0 0', 6.5) + '<g>' + at('rotate', '-9 0 0;9 0 0;-9 0 0', 9) + astro + '</g></g></g>';
    // stelle cadenti
    [[560, 14, 9, 0], [440, 20, 13, -4]].forEach(function (m, i) {
      s += '<g opacity="0">' + an('opacity', '0;1;0;0', m[2], 'keyTimes="0;.02;.11;1" begin="' + m[3] + 's"') + at('translate', m[0] + ' ' + m[1] + ';' + (m[0] - 250) + ' ' + (m[1] + 150) + ';' + (m[0] - 250) + ' ' + (m[1] + 150), m[2], 'keyTimes="0;.11;1" begin="' + m[3] + 's"') +
        '<line x1="0" y1="0" x2="60" y2="-36" stroke="' + A.lg([[0, '#fff', 1], [1, '#fff', 0]], { x1: 0, y1: 0, x2: 1, y2: 0, }) + '" stroke-width="2.4" stroke-linecap="round"/>' + circ(0, 0, 2.6, '#fff') + '</g>';
    });
    // satellite
    s += '<g>' + at('translate', '-40 70;700 36', 38, 'begin="-14s"') + rect(-5, -3, 10, 6, '#C9CEDB', 1) + rect(-22, -2, 15, 5, '#4F7BFF', 1) + rect(7, -2, 15, 5, '#4F7BFF', 1) + rect(-1, -7, 2, 4, '#98A3B8') + circA(0, -8, 1.6, '#ff3b4e', an('opacity', '1;0;1', 1.2)) + '</g>';
    // UFO
    s += '<g>' + at('translate', '-60 44;190 28;410 58;700 34', 46, 'begin="-30s"') + ell(0, 0, 17, 5, A.lg([[0, '#D6DAEA'], [1, '#7C84A6']])) + path('M-8 -2 Q0 -14 8 -2Z', 'rgba(140,255,200,.7)') + circA(-9, 1.4, 1.5, '#FFE29A', an('opacity', '1;.2;1', .9)) + circA(0, 2, 1.5, '#FF7AC8', an('opacity', '.2;1;.2', .9)) + circA(9, 1.4, 1.5, '#7FD6FF', an('opacity', '1;.2;1', .9, 'begin="-.4s"')) + '</g>';
    return s;
  } };

  /* ============================================================ GIAPPONE */
  W.giappone = { name: 'Giappone', icon: 'mdi-temple-buddhist', desc: 'Monte Fuji, torii, pagoda, ciliegio con petali che cadono e lanterne', windows: [], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 2, stars: 40 }), nl = K.nt, rd = A.rnd(58);
    var red = mix('#D6362D', K.hn, .35 * nl + .08), dark = mix(K.hn, '#000', .28);
    // fuji
    s += path('M110 226 Q214 196 258 108 Q290 58 322 108 Q368 196 470 226Z', mix(K.hf, K.s3, .4)) + path('M256 116 Q290 56 324 116 L312 108 L302 124 L292 108 L282 126 L270 110Z', mix('#ffffff', K.s3, .15 + .3 * nl));
    s += '<g opacity="' + f(.45) + '" filter="url(#wgiappone_b14)"><g>' + at('translate', '-30 0;30 0;-30 0', 16) + ell(300, 168, 130, 10, mix('#ffffff', K.s3, .4)) + '</g></g>';
    s += path('M-10 200 Q100 172 220 200 T450 196 T650 200 V262 H-10Z', K.hf) + path('M-10 232 Q150 208 300 228 T650 220 V262 H-10Z', K.hn);
    // pagoda
    var px = 540, wt = '';
    for (var i = 0; i < 5; i++) {
      var yb = 226 - i * 30, w = 78 - i * 11;
      s += rect(px - (w - 20) / 2, yb - 26, w - 20, 22, dark) + poly(f(px - w / 2 - 8) + ',' + (yb - 25) + ' ' + f(px + w / 2 + 8) + ',' + (yb - 25) + ' ' + f(px + w / 2 - 4) + ',' + (yb - 36) + ' ' + f(px - w / 2 + 4) + ',' + (yb - 36), mix(dark, '#000', .25)) + path('M' + f(px - w / 2 - 8) + ' ' + (yb - 25) + ' q-6 -2 -9 -8 q6 2 9 4Z', mix(dark, '#000', .25)) + path('M' + f(px + w / 2 + 8) + ' ' + (yb - 25) + ' q6 -2 9 -8 q-6 2 -9 4Z', mix(dark, '#000', .25));
      wt += rect(px - 4, yb - 22, 8, 12, K.win, 1, 'opacity="' + f(.15 + .85 * nl) + '"');
    }
    s += wt + rect(px - 1.6, 226 - 4 * 30 - 62, 3.2, 28, dark) + circ(px, 226 - 4 * 30 - 62, 3, '#E9C46A');
    // torii
    var tx = 150;
    s += rect(tx - 36, 150, 9, 82, red) + rect(tx + 27, 150, 9, 82, red) + path('M' + (tx - 56) + ' 152 Q' + tx + ' 138 ' + (tx + 56) + ' 152 L' + (tx + 54) + ' 162 Q' + tx + ' 150 ' + (tx - 54) + ' 162Z', mix(red, '#000', .25)) + rect(tx - 46, 170, 92, 7, red) + rect(tx - 4, 160, 8, 12, red);
    [[tx - 20, 0], [tx, .6], [tx + 20, 1.2]].forEach(function (l) {
      s += '<g>' + at('rotate', '-5 ' + l[0] + ' 177;5 ' + l[0] + ' 177;-5 ' + l[0] + ' 177', 3.4, 'begin="-' + l[1] + 's"') + rect(l[0] - .6, 177, 1.2, 8, '#222') + circ(l[0], 196, 22, A.rg([[0, '#FF8A4D', .75 * nl], [1, '#FF8A4D', 0]])) + ell(l[0], 193, 6, 8, '#E5484D') + rect(l[0] - 4, 185, 8, 2, '#3a1d1d') + rect(l[0] - 4, 199, 8, 2, '#3a1d1d') + '</g>';
    });
    // ciliegio
    var cc = mix('#F9A8C9', K.hn, .5 * nl);
    s += path('M52 238 C 44 204 60 184 40 142 M48 196 C 62 188 74 170 90 168', 'none', 'stroke="' + mix('#6b4a3a', K.hn, .4) + '" stroke-width="9" stroke-linecap="round"');
    for (var c = 0; c < 22; c++) s += circ(20 + rd() * 110, 100 + rd() * 62, 16 + rd() * 16, rd() > .5 ? cc : mix(cc, '#ffffff', .25), 'opacity="' + f(.75 + rd() * .2) + '"');
    for (var p = 0; p < 26; p++) {
      var x0 = 10 + rd() * 130, y0 = 110 + rd() * 50, d = 6 + rd() * 6, dx = 50 + rd() * 120;
      s += '<g>' + at('translate', f(x0) + ' ' + f(y0) + ';' + f(x0 + dx) + ' 258', d, 'begin="-' + f(rd() * d) + 's"') + '<g>' + at('rotate', '0;360', 2 + rd() * 3) + ell(0, 0, 3, 1.7, mix('#FFC1D8', K.hn, .35 * nl), 'opacity=".95"') + '</g></g>';
    }
    return s;
  } };

  /* ============================================================ CYBERPUNK */
  function fcar(y, dir, dur, dly, col) {
    var x0 = dir > 0 ? -60 : 700, x1 = dir > 0 ? 700 : -60;
    return '<g>' + at('translate', x0 + ' ' + y + ';' + x1 + ' ' + (y + 6), dur, 'begin="-' + dly + 's"') + '<g transform="scale(' + dir + ' 1)">' + rect(-44, -1, 44, 2.6, A.lg([[0, col, 0], [1, col, .85]], { x1: 0, y1: 0, x2: 1, y2: 0 })) + ell(0, 0, 11, 3.6, '#20243a') + ell(2, -2.2, 5, 2.6, col, 'opacity=".9"') + circ(10, 0, 7, A.rg([[0, '#fff', .8], [1, col, 0]])) + '</g></g>';
  }
  W.cyberpunk = { name: 'Cyberpunk', icon: 'mdi-robot-industrial', desc: 'Metropoli al neon sotto la pioggia: insegne che sfarfallano, auto volanti, ologramma', windows: [], draw: function (K, h, B) {
    var nl = K.nt, rd = A.rnd(91);
    var s = rect(0, 0, 640, 260, A.lg([[0, mix(K.s1, '#2a0a4a', .55)], [.6, mix(K.s2, '#8a1d6a', .3 + .25 * nl)], [1, mix(K.s3, '#ff5aa8', .25 + .3 * nl)]]));
    s += H.stars(K, { n: 24, seed: 3, ymax: 90 }) + H.sunmoon(K, B) + H.cloud(0, 60, 1, 'c1', K);
    var far = mix('#2a0a4a', K.s2, .45);
    for (var i = 0; i < 18; i++) {
      var x = i * 38 + rd() * 10, w = 26 + rd() * 22, hh = 80 + rd() * 100;
      s += rect(x, 232 - hh, w, hh, far) + '<line x1="' + f(x + 6) + '" y1="' + f(232 - hh + 8) + '" x2="' + f(x + 6) + '" y2="228" stroke="' + (i % 2 ? '#22D3EE' : '#FF3DA8') + '" stroke-width="2" stroke-dasharray="2 5" opacity="' + f(.15 + .65 * nl) + '"/><line x1="' + f(x + w - 7) + '" y1="' + f(232 - hh + 14) + '" x2="' + f(x + w - 7) + '" y2="228" stroke="#FFD27A" stroke-width="2" stroke-dasharray="2 6" opacity="' + f(.1 + .5 * nl) + '"/>';
    }
    // ologramma
    s += '<g transform="translate(330 70)" opacity="' + f(.35 + .6 * nl) + '"><g>' + at('scale', '1 1;.05 1;-1 1;.05 1;1 1', 6) + poly('0,-34 22,0 0,34 -22,0', 'rgba(34,211,238,.18)', 'stroke="#22D3EE" stroke-width="1.6"') + poly('0,-34 0,34', 'none', 'stroke="#22D3EE" stroke-width="1"') + ell(0, 0, 22, 6, 'none', 'stroke="#FF3DA8" stroke-width="1.2"') + '</g>' + circ(0, 0, 42, A.rg([[0, '#22D3EE', .35], [1, '#22D3EE', 0]])) + '</g>';
    // torri
    var T = [[-6, 70, 150, '#FF3DA8'], [78, 54, 124, '#22D3EE'], [150, 66, 176, '#FF3DA8'], [296, 70, 150, '#22D3EE'], [380, 58, 120, '#FF3DA8'], [452, 70, 170, '#22D3EE'], [540, 66, 134, '#FF3DA8'], [598, 60, 152, '#22D3EE']];
    T.forEach(function (t, i) {
      var top = 238 - t[2], body = mix('#150626', K.s1, .3);
      s += rect(t[0], top, t[1], t[2] + 4, body) + rect(t[0], top, 2.4, t[2], t[3], 0, 'opacity="' + f(.35 + .6 * nl) + '"') + rect(t[0] + t[1] - 2.4, top, 2.4, t[2], t[3], 0, 'opacity="' + f(.2 + .5 * nl) + '"') + rect(t[0] - 1, top - 2, t[1] + 2, 3, t[3], 0, 'opacity="' + f(.4 + .6 * nl) + '"');
      for (var r = 0; r < Math.floor(t[2] / 16); r++) for (var c = 0; c < Math.floor((t[1] - 12) / 11); c++) if (rd() < .22 + .5 * nl) s += rect(t[0] + 7 + c * 11, top + 9 + r * 16, 5, 6, rd() > .5 ? '#FFD27A' : (rd() > .5 ? '#22D3EE' : '#FF7AC8'), 0.8, 'opacity=".85"');
      if (i % 2 === 0) s += '<g class="' + (i % 4 === 0 ? 'fl' : 'pu') + '" style="animation-delay:-' + f(rd() * 3) + 's">' + rect(t[0] + t[1] / 2 - 4, top + 24, 8, 54, t[3], 2, 'opacity="' + f(.3 + .7 * nl) + '"') + rect(t[0] + t[1] / 2 - 4, top + 24, 8, 54, 'none', 2, 'stroke="#fff" stroke-width="1" opacity="' + f(.6 * nl) + '"') + circ(t[0] + t[1] / 2, top + 50, 24, A.rg([[0, t[3], .5 * nl], [1, t[3], 0]])) + '</g>';
      if (i % 3 === 1) s += rect(t[0] + t[1] / 2 - 1, top - 20, 2, 18, '#777') + circA(t[0] + t[1] / 2, top - 21, 2.2, '#ff3b4e', an('opacity', '1;.1;1', 1.3));
    });
    // auto volanti
    s += fcar(52, 1, 9, 1, '#FF3DA8') + fcar(92, -1, 13, 6, '#22D3EE') + fcar(130, 1, 17, 12, '#FFD27A');
    // strada bagnata
    s += rect(0, 238, 640, 24, '#0a0414') + rect(0, 238, 640, 2, '#FF3DA8', 0, 'opacity="' + f(.3 + .5 * nl) + '"');
    [[60, '#FF3DA8'], [190, '#22D3EE'], [330, '#FF3DA8'], [470, '#22D3EE'], [580, '#FF3DA8']].forEach(function (r, i) { s += '<g opacity="' + f(.2 + .5 * nl) + '" filter="url(#wcyberpunk_b8)">' + ell(r[0], 250, 38, 4, r[1], 'class="pu" style="animation-delay:-' + i * .6 + 's"') + '</g>'; });
    [[120, 248, 0], [260, 252, -1], [410, 247, -2], [540, 251, -.5]].forEach(function (r) { s += '<ellipse cx="' + r[0] + '" cy="' + r[1] + '" rx="2" ry=".6" fill="none" stroke="rgba(200,230,255,.7)" stroke-width="1">' + an('rx', '2;18', 1.8, 'begin="' + r[2] + 's"') + an('ry', '.6;4', 1.8, 'begin="' + r[2] + 's"') + an('opacity', '.9;0', 1.8, 'begin="' + r[2] + 's"') + '</ellipse>'; });
    // pioggia
    for (var q = 0; q < 46; q++) {
      var rx = rd() * 700 - 30, d = .8 + rd() * .5;
      s += '<g opacity="' + f(.35 + .3 * rd()) + '">' + at('translate', f(rx) + ' -20;' + f(rx - 50) + ' 270', d, 'begin="-' + f(rd() * d) + 's"') + '<line x1="0" y1="0" x2="-4" y2="13" stroke="#BFE0FF" stroke-width="1.1" stroke-linecap="round"/></g>';
    }
    return s;
  } };

  /* ============================================================ NATALE */
  W.natale = { name: 'Natale', icon: 'mdi-pine-tree-variant', desc: 'Casa innevata con luci colorate, albero, pupazzo di neve e la slitta di Babbo Natale', windows: [{ k: 'camera', x: 398, y: 162, w: 28, h: 20 }, { k: 'cameretta', x: 494, y: 162, w: 28, h: 20 }, { k: 'salotto', x: 398, y: 196, w: 34, h: 22 }, { k: 'cucina', x: 488, y: 196, w: 34, h: 22 }, { k: 'ingresso', x: 447, y: 190, w: 26, h: 36 }], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 2, stars: 44 }), nl = K.nt;
    var sn1 = mix('#ffffff', K.s3, .3 + .3 * nl), sn2 = mix('#ffffff', K.s2, .38 + .3 * nl), dark = mix(K.hn, '#000', .3), roof = mix(K.hn, '#000', .4);
    s += path('M-10 192 Q90 150 190 180 T380 166 T650 182 V262 H-10Z', sn1) + path('M-10 234 Q120 206 270 224 T650 216 V262 H-10Z', sn2);
    // slitta
    s += '<g>' + at('translate', '-150 70;780 40', 32, 'begin="-10s"') + '<g>' + at('translate', '0 0;0 -8;0 0', 3) + '<g transform="scale(.9)">' +
      path('M-90 6 q8 -14 24 -10 l-4 8z', '#8E5A33') + ell(-56, 0, 12, 6, '#A86D3F') + circ(-44, -6, 5, '#A86D3F') + circ(-40, -10, 1.4, '#222') + path('M-44 -10 l-3 -10 m3 6 l5 -9', 'none', 'stroke="#6B4423" stroke-width="1.6" stroke-linecap="round"') + circA(-39, -5, 1.8, '#ff3b4e', an('opacity', '1;.3;1', .8)) + path('M-30 0 h20', 'none', 'stroke="#c9a06a" stroke-width="1"') +
      ell(-14, 0, 12, 6, '#A86D3F') + circ(-2, -6, 5, '#A86D3F') + path('M-2 -10 l-3 -10 m3 6 l5 -9', 'none', 'stroke="#6B4423" stroke-width="1.6" stroke-linecap="round"') +
      path('M2 4 Q10 -2 18 4 L32 4 Q34 16 22 16 L4 16Z', '#E5484D') + path('M0 16 Q20 22 36 14', 'none', 'stroke="#E9C46A" stroke-width="2.4" stroke-linecap="round"') + ell(12, -6, 7, 8, '#E5484D') + circ(12, -14, 4, '#FBD3B5') + poly('8,-16 12,-24 16,-16', '#E5484D') + rect(20, -4, 12, 8, '#2a8f5b', 2) + '</g></g>' +
      circ(-110, 6, 34, A.rg([[0, '#FFE29A', .5], [1, '#FFE29A', 0]])) + '</g>';
    // alberi
    s += pine(300, 226, 46, dark, 1, '#fff') + pine(336, 228, 34, dark, 2, '#fff') + pine(16, 232, 56, dark, 0, '#fff') + pine(54, 234, 40, dark, 3, '#fff');
    // casa con neve
    s += rect(441, 104, 16, 30, roof) + poly('366,154 460,98 554,154', roof) + rect(380, 150, 160, 76, mix(K.hn, '#5a3a40', .35), 2) + poly('362,157 460,96 558,157 548,157 460,106 372,157', '#fff', 'opacity=".95"') + rect(439, 98, 20, 6, '#fff') + winDark(K, [{ x: 398, y: 162, w: 28, h: 20 }, { x: 494, y: 162, w: 28, h: 20 }, { x: 398, y: 196, w: 34, h: 22 }, { x: 488, y: 196, w: 34, h: 22 }, { x: 447, y: 190, w: 26, h: 36 }]) + poly('447,226 473,226 502,260 418,260', 'rgba(255,255,255,.12)') + smoke(449, 96, K.cloud);
    // luci sul tetto
    var cols = ['#FF4D4D', '#FFD93D', '#4DD2FF', '#7CFF6B'], k = 0;
    for (var t = 0; t <= 1.001; t += 1 / 8) { [[366, 154, 460, 98], [460, 98, 554, 154]].forEach(function (sg, si) { if (si === 1 && t === 0) return; var x = sg[0] + (sg[2] - sg[0]) * t, y = sg[1] + (sg[3] - sg[1]) * t + 3; var c = cols[(k++) % 4]; s += circA(x, y, 3, c, an('opacity', '1;.25;1', 1.6, 'begin="-' + f((k % 4) * .4) + 's"')) + circ(x, y, 9, A.rg([[0, c, .5], [1, c, 0]])); }); }
    // albero di Natale
    var gx = 592, gy = 228;
    s += rect(gx - 4, gy - 10, 8, 12, '#6B4423') + poly(gx + ',' + (gy - 74) + ' ' + (gx - 20) + ',' + (gy - 40) + ' ' + (gx + 20) + ',' + (gy - 40), '#1f7a4d') + poly(gx + ',' + (gy - 58) + ' ' + (gx - 26) + ',' + (gy - 22) + ' ' + (gx + 26) + ',' + (gy - 22), '#26925a') + poly(gx + ',' + (gy - 40) + ' ' + (gx - 32) + ',' + (gy - 8) + ' ' + (gx + 32) + ',' + (gy - 8), '#2fae6a');
    [[-8, -50, '#FF4D4D'], [10, -36, '#FFD93D'], [-16, -22, '#4DD2FF'], [14, -16, '#FF7AC8'], [0, -28, '#FFD93D']].forEach(function (b, i) { s += circA(gx + b[0], gy + b[1], 3.2, b[2], an('opacity', '1;.4;1', 1.8, 'begin="-' + i * .3 + 's"')); });
    s += '<g transform="translate(' + gx + ' ' + (gy - 78) + ')"><g>' + at('scale', '1 1;1.25 1.25;1 1', 1.6) + '<path d="M0 -8 L2.4 -2 L8.4 -2 L3.6 1.8 L5.4 8 L0 4.4 L-5.4 8 L-3.6 1.8 L-8.4 -2 L-2.4 -2Z" fill="#FFE066"/>' + circ(0, 0, 16, A.rg([[0, '#FFE066', .8], [1, '#FFE066', 0]])) + '</g></g>';
    // pupazzo
    var mx = 250, my = 232;
    s += ell(mx, my + 1, 24, 4, 'rgba(0,0,0,.2)') + circ(mx, my - 14, 16, '#fff') + circ(mx, my - 38, 12, '#fff') + circ(mx, my - 56, 9, '#fff') + rect(mx - 9, my - 66, 18, 3, '#222') + rect(mx - 6, my - 78, 12, 13, '#222', 1) + circ(mx - 3, my - 57, 1.2, '#222') + circ(mx + 3, my - 57, 1.2, '#222') + poly((mx) + ',' + (my - 55) + ' ' + (mx + 11) + ',' + (my - 53) + ' ' + mx + ',' + (my - 51), '#FF8A3D') + rect(mx - 10, my - 48, 20, 4, '#E5484D', 2) + '<g>' + at('rotate', '-4 ' + mx + ' ' + (my - 46) + ';6 ' + mx + ' ' + (my - 46) + ';-4 ' + mx + ' ' + (my - 46), 2.4) + rect(mx + 4, my - 48, 4, 14, '#E5484D', 2) + '</g>' + circ(mx, my - 38, 1.5, '#222') + circ(mx, my - 30, 1.5, '#222');
    s += snow(46, 17, '#fff', 262);
    return s;
  } };

  /* ============================================================ OCEANO */
  function fish(col, sc) { return '<g transform="scale(' + (sc || 1) + ')">' + ell(0, 0, 9, 4.4, col) + poly('-8,0 -15,-5 -15,5', col) + circ(5, -1, 1.1, '#111') + path('M-1 -4 Q1 0 -1 4', 'none', 'stroke="rgba(255,255,255,.55)" stroke-width="1.4"') + '</g>'; }
  function school(y, dir, dur, dly, col, n, rdSeed) {
    var rd = A.rnd(rdSeed), s = '';
    for (var i = 0; i < n; i++) s += '<g transform="translate(' + f(i * 15 * -dir + rd() * 8) + ' ' + f((rd() - .5) * 30) + ')">' + '<g>' + at('translate', '0 0;0 ' + f(3 + rd() * 3) + ';0 0', 1.8 + rd(), 'begin="-' + f(rd() * 2) + 's"') + '<g transform="scale(' + dir + ' 1)">' + fish(col, .8 + rd() * .3) + '</g></g></g>';
    var x0 = dir > 0 ? -90 : 740, x1 = dir > 0 ? 740 : -90;
    return '<g>' + at('translate', x0 + ' ' + y + ';' + x1 + ' ' + (y + 12), dur, 'begin="-' + dly + 's"') + s + '</g>';
  }
  function jelly(x, y, sc, col, dly) {
    var tent = '';
    [-8, -3, 3, 8].forEach(function (tx, i) { tent += path('M' + tx + ' 2 q-3 8 0 16 t0 16 t0 12', 'none', 'stroke="' + col + '" stroke-width="2" stroke-linecap="round" opacity=".7"', '') .replace('/>', '>' + an('d', 'M' + tx + ' 2 q-3 8 0 16 t0 16 t0 12;M' + tx + ' 2 q3 8 0 16 t0 16 t0 12;M' + tx + ' 2 q-3 8 0 16 t0 16 t0 12', 2.4, 'begin="-' + i * .4 + 's"') + '</path>'); });
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><g>' + at('translate', '0 0;6 -14;0 0', 7, 'begin="-' + dly + 's"') + '<g>' + at('scale', '1 1;1.1 .88;1 1', 2.6, 'begin="-' + dly + 's"') + circ(0, -4, 26, A.rg([[0, col, .4], [1, col, 0]])) + path('M-15 0 A15 13 0 0 1 15 0 Q0 6 -15 0Z', col, 'opacity=".85"') + path('M-9 -4 Q-4 -10 2 -9', 'none', 'stroke="rgba(255,255,255,.6)" stroke-width="1.6" stroke-linecap="round"') + tent + '</g></g></g>';
  }
  W.oceano = { name: 'Oceano', icon: 'mdi-fish', desc: 'Sott\'acqua: banchi di pesci, meduse luminose, balena, sottomarino, alghe e bolle', windows: [], draw: function (K, h, B) {
    var dl = K.dy, nl = K.nt;
    var top = mix('#0A2A5A', '#4CCFE6', dl), mid = mix('#07204A', '#1E88C8', dl), bot = mix('#040B24', '#0A3C6E', dl);
    var s = rect(0, 0, 640, 260, A.lg([[0, top], [.55, mid], [1, bot]]));
    if (dl > .08) {
      var ray = A.lg([[0, '#fff', .55], [1, '#fff', 0]]), rs = '', sx = Math.min(560, Math.max(80, B.sun.x));
      [-120, -50, 20, 90, 160].forEach(function (dx, i) { rs += '<g>' + an('opacity', '.3;.9;.3', 4.5 + i * .7, 'begin="-' + i + 's"') + poly((sx + dx * .3) + ',-10 ' + (sx + dx * .3 + 22) + ',-10 ' + (sx + dx + 70) + ',262 ' + (sx + dx - 10) + ',262', ray) + '</g>'; });
      s += '<g opacity="' + f(dl * .5) + '">' + rs + '</g>';
    }
    if (B.moon.vis) s += circ(B.moon.x, 4, 70, A.rg([[0, '#DDE8FF', .4], [1, '#DDE8FF', 0]]));
    // balena
    s += '<g opacity="' + f(.28 + .1 * dl) + '"><g>' + at('translate', '-220 70;760 56', 64, 'begin="-24s"') + path('M0 0 Q40 -26 110 -12 Q150 -4 170 8 L196 -10 L192 14 L200 30 L172 18 Q140 30 90 24 Q30 26 0 0Z', mix(K.hn, '#0a1a3a', .5)) + circ(30, -4, 1.6, '#fff') + '</g></g>';
    // sabbia + corallo
    s += path('M-10 240 Q100 224 220 240 T450 238 T650 232 V262 H-10Z', mix('#E8D2A6', '#0a1a3a', .55 - .35 * dl)) + path('M-10 252 Q140 240 300 252 T650 246 V262 H-10Z', mix('#CDB68A', '#08122a', .6 - .35 * dl));
    [[60, '#FF7AA8'], [330, '#FF9A5C'], [590, '#B07CFF']].forEach(function (c) {
      var cc = mix(c[1], '#0a1a3a', .45 - .3 * dl);
      s += path('M' + c[0] + ' 244 q-4 -22 -14 -30 M' + c[0] + ' 244 q2 -30 -2 -44 M' + c[0] + ' 244 q8 -20 18 -26 M' + (c[0] - 7) + ' 222 q-8 -6 -10 -14 M' + (c[0] + 6) + ' 214 q10 -4 14 -12', 'none', 'stroke="' + cc + '" stroke-width="7" stroke-linecap="round"');
    });
    // alghe
    [[20, 56, '#2FA66B'], [110, 70, '#3CC47C'], [160, 44, '#2FA66B'], [420, 64, '#3CC47C'], [470, 48, '#2FA66B'], [610, 74, '#3CC47C']].forEach(function (a, i) {
      var c = mix(a[2], '#0a2a3a', .5 - .4 * dl);
      s += '<g transform="translate(' + a[0] + ' 250)"><g>' + at('skewX', '-7;7;-7', 3.4 + i * .4, 'begin="-' + i * .5 + 's"') + path('M0 0 q-9 ' + f(-a[1] / 3) + ' 0 ' + f(-a[1] / 2) + ' q9 ' + f(-a[1] / 3) + ' 0 ' + f(-a[1] / 2), 'none', 'stroke="' + c + '" stroke-width="6" stroke-linecap="round"') + '</g></g>';
    });
    // pesci
    s += school(70, 1, 24, 6, '#FFB347', 7, 3) + school(130, -1, 30, 14, '#4DD2FF', 6, 5) + school(190, 1, 20, 3, '#FF7AC8', 5, 8);
    // sottomarino
    s += '<g>' + at('translate', '-140 176;760 152', 52, 'begin="-30s"') + '<g>' + at('translate', '0 0;0 -4;0 0', 3.6) + ell(0, 0, 36, 13, '#F2B544') + rect(-10, -22, 18, 12, '#E09A24', 3) + rect(-3, -30, 3, 10, '#C9CEDB') + rect(-3, -32, 10, 3, '#C9CEDB') + circ(-16, -1, 5.6, '#1d3a5a') + circ(-16, -1, 3.6, mix('#8FEFFF', '#fff', .2)) + circ(0, -1, 5.6, '#1d3a5a') + circ(0, -1, 3.6, '#8FEFFF') + circ(16, -1, 5.6, '#1d3a5a') + circ(16, -1, 3.6, '#8FEFFF') + circ(0, -1, 26, A.rg([[0, '#8FEFFF', .3 + .3 * nl], [1, '#8FEFFF', 0]])) + '<g transform="translate(-38 0)">' + '<g>' + at('rotate', '0;360', .5) + rect(-1.4, -9, 2.8, 18, '#C9CEDB') + rect(-9, -1.4, 18, 2.8, '#C9CEDB') + '</g></g></g></g>';
    // meduse
    s += jelly(150, 150, 1, mix('#FF7AC8', '#ffffff', .15), 0) + jelly(400, 110, .8, mix('#7FD6FF', '#ffffff', .1), 3) + jelly(560, 170, 1.1, mix('#C084FC', '#ffffff', .1), 5);
    // bolle
    var rd = A.rnd(14);
    for (var b = 0; b < 16; b++) { var bx = rd() * 640, d = 6 + rd() * 5, r = 1.6 + rd() * 3; s += '<circle cx="' + f(bx) + '" cy="270" r="' + f(r) + '" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.65)" stroke-width="1">' + an('cy', '270;-10', d, 'begin="-' + f(rd() * d) + 's"') + an('cx', f(bx) + ';' + f(bx + 12) + ';' + f(bx - 6) + ';' + f(bx), d, 'begin="-' + f(rd() * d) + 's"') + '</circle>'; }
    return s;
  } };
})();


/* ---- effetti.js ---- */
/* ============================================================================
   AURORA GLASS v3 — EFFETTI (meteo e atmosfera) disegnati su canvas.
   Si possono sovrapporre a qualsiasi mondo: pioggia, temporale, neve, nebbia,
   foglie, petali, lucciole, stelle cadenti, fuochi d'artificio, bolle, coriandoli.
   ========================================================================== */
(function (g) {
  var TAU = Math.PI * 2, rnd = Math.random;
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }

  function Fx(canvas, o) {
    o = o || {};
    this.c = canvas; this.x = canvas.getContext('2d');
    this.kind = 'none'; this.P = []; this.w = 1; this.h = 1; this.dpr = 1; this.t = 0; this.last = 0;
    this.k = o.k || 1;                 // moltiplicatore densità
    this.alpha = o.alpha === undefined ? 1 : o.alpha;
    this.running = false; this.onFlash = o.onFlash || null;
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.S = {};                       // stato per effetto (timer, fulmini…)
    var self = this;
    this._loop = function (ts) { self.loop(ts); };
  }
  Fx.prototype.resize = function () {
    var r = this.c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = Math.round(this.w * this.dpr); this.c.height = Math.round(this.h * this.dpr);
    this.x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.init();
  };
  Fx.prototype.set = function (kind) {
    this.kind = kind || 'none';
    this.S = {};
    this.resize();
    if (this.kind === 'none') { this.stop(); this.x.clearRect(0, 0, this.w, this.h); }
    else this.start();
  };
  Fx.prototype.start = function () { if (!this.running) { this.running = true; this.last = 0; requestAnimationFrame(this._loop); } };
  Fx.prototype.stop = function () { this.running = false; };
  Fx.prototype.init = function () { var e = E[this.kind]; this.P = []; if (e && e.init) e.init(this); };
  Fx.prototype.loop = function (ts) {
    if (!this.running) return;
    var dt = this.last ? Math.min(.05, (ts - this.last) / 1000) : .016;
    this.last = ts; this.t += dt;
    var e = E[this.kind];
    if (!e || document.hidden) { requestAnimationFrame(this._loop); return; }
    var x = this.x;
    x.clearRect(0, 0, this.w, this.h);
    x.globalAlpha = this.alpha;
    if (this.reduced) { dt = 0; }
    e.draw(this, dt);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    requestAnimationFrame(this._loop);
  };
  function area(fx, per) { return Math.max(8, Math.round(fx.w * fx.h / per * fx.k)); }

  /* ---------------------------------------------------------------- pioggia / temporale */
  function rainInit(heavy) {
    return function (fx) {
      var n = area(fx, heavy ? 3200 : 5200);
      for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * (fx.w + 120) - 40, y: rnd() * fx.h, v: 650 + rnd() * 520, l: 10 + rnd() * 14, a: .22 + rnd() * .38 });
      fx.S.sp = []; fx.S.next = 2 + rnd() * 4; fx.S.flash = 0; fx.S.bolt = null; fx.S.boltT = 0;
    };
  }
  function bolt(fx) {
    var pts = [], x = fx.w * (.2 + rnd() * .6), y = 0, ty = fx.h * (.55 + rnd() * .3);
    pts.push([x, y]);
    while (y < ty) { y += 10 + rnd() * 16; x += (rnd() - .5) * 34; pts.push([x, y]); }
    var br = [], k = 1 + Math.floor(rnd() * 2);
    for (var i = 0; i < k; i++) { var s = pts[2 + Math.floor(rnd() * (pts.length - 4))], bx = s[0], by = s[1], seg = [[bx, by]]; for (var j = 0; j < 4; j++) { bx += (rnd() - .3) * 28; by += 8 + rnd() * 12; seg.push([bx, by]); } br.push(seg); }
    return { main: pts, br: br };
  }
  function rainDraw(heavy) {
    return function (fx, dt) {
      var x = fx.x, S = fx.S, wind = -.22;
      if (heavy) { x.fillStyle = 'rgba(8,10,34,.16)'; x.fillRect(0, 0, fx.w, fx.h); }
      x.lineWidth = 1.1; x.lineCap = 'round';
      for (var i = 0; i < fx.P.length; i++) {
        var d = fx.P[i], dy = d.v * dt;
        d.y += dy; d.x += dy * wind;
        if (d.y > fx.h) { if (S.sp.length < 36 && rnd() < .5) S.sp.push({ x: d.x, y: fx.h - 2, t: 0 }); d.y = -d.l; d.x = rnd() * (fx.w + 120) - 20; }
        x.strokeStyle = 'rgba(190,222,255,' + d.a + ')';
        x.beginPath(); x.moveTo(d.x, d.y); x.lineTo(d.x + d.l * wind, d.y + d.l); x.stroke();
      }
      for (var s = S.sp.length - 1; s >= 0; s--) {
        var p = S.sp[s]; p.t += dt * 3.2;
        if (p.t >= 1) { S.sp.splice(s, 1); continue; }
        x.strokeStyle = 'rgba(210,235,255,' + (.5 * (1 - p.t)) + ')';
        x.beginPath(); x.ellipse(p.x, p.y, 2 + p.t * 9, 1 + p.t * 2.4, 0, 0, TAU); x.stroke();
      }
      if (heavy) {
        S.next -= dt;
        if (S.next <= 0) { S.next = 3 + rnd() * 6; S.flash = 1; S.bolt = bolt(fx); S.boltT = .22; }
        if (S.flash > .01) {
          x.fillStyle = 'rgba(214,228,255,' + (S.flash * .42) + ')'; x.fillRect(0, 0, fx.w, fx.h);
          S.flash *= Math.pow(.02, dt * 2.2);
          if (fx.onFlash) fx.onFlash(S.flash);
        } else if (S.flash !== 0) { S.flash = 0; if (fx.onFlash) fx.onFlash(0); }
        if (S.bolt && S.boltT > 0) {
          S.boltT -= dt;
          x.save(); x.shadowColor = '#bcd4ff'; x.shadowBlur = 18; x.strokeStyle = 'rgba(255,255,255,' + Math.min(1, S.boltT * 7) + ')'; x.lineWidth = 2.4; x.lineJoin = 'round';
          function poly(pp) { x.beginPath(); pp.forEach(function (q, i) { i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.stroke(); }
          poly(S.bolt.main); x.lineWidth = 1.3; S.bolt.br.forEach(poly); x.restore();
        }
      }
    };
  }

  /* ---------------------------------------------------------------- neve */
  function snowInit(fx) { var n = area(fx, 4800); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, r: 1 + rnd() * 2.6, v: 24 + rnd() * 56, ph: rnd() * TAU, sw: 8 + rnd() * 22 }); }
  function snowDraw(fx, dt) {
    var x = fx.x; x.fillStyle = '#fff';
    fx.P.forEach(function (p) {
      p.y += p.v * dt; p.x += Math.sin(fx.t * .9 + p.ph) * p.sw * dt;
      if (p.y > fx.h + 4) { p.y = -4; p.x = rnd() * fx.w; }
      x.globalAlpha = fx.alpha * (.45 + p.r / 5.2); x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill();
    });
  }

  /* ---------------------------------------------------------------- nebbia */
  function fogInit(fx) { var n = Math.max(5, Math.round(fx.w / 150 * fx.k)); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: fx.h * (.2 + rnd() * .8), r: 90 + rnd() * 170, v: (5 + rnd() * 14) * (rnd() > .5 ? 1 : -1), a: .10 + rnd() * .12 }); }
  function fogDraw(fx, dt) {
    var x = fx.x;
    fx.P.forEach(function (p) {
      p.x += p.v * dt; if (p.x > fx.w + p.r) p.x = -p.r; if (p.x < -p.r) p.x = fx.w + p.r;
      var gr = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, 'rgba(236,242,255,' + p.a + ')'); gr.addColorStop(1, 'rgba(236,242,255,0)');
      x.fillStyle = gr; x.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });
  }

  /* ---------------------------------------------------------------- foglie / petali */
  var LEAF = ['#E8742B', '#C8402A', '#F2B544', '#A8461F', '#D9A21B'];
  var PET = ['#FFC1D8', '#F9A8C9', '#FFD6E6', '#F48FB1'];
  function leafInit(petal) {
    return function (fx) {
      var n = area(fx, petal ? 6500 : 8500);
      for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, s: petal ? 3 + rnd() * 3 : 5 + rnd() * 5, v: 28 + rnd() * 48, ph: rnd() * TAU, rot: rnd() * TAU, rv: (rnd() - .5) * 4, sw: 20 + rnd() * 34, c: petal ? pick(PET) : pick(LEAF) });
    };
  }
  function leafDraw(petal) {
    return function (fx, dt) {
      var x = fx.x;
      fx.P.forEach(function (p) {
        p.y += p.v * dt; p.x += (Math.sin(fx.t * 1.2 + p.ph) * p.sw + (petal ? 26 : 8)) * dt; p.rot += p.rv * dt;
        if (p.y > fx.h + 12) { p.y = -12; p.x = rnd() * fx.w; }
        if (p.x > fx.w + 12) p.x = -12;
        x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c; x.beginPath();
        if (petal) { x.ellipse(0, 0, p.s, p.s * .55, 0, 0, TAU); }
        else { x.moveTo(0, -p.s); x.quadraticCurveTo(p.s * .95, -p.s * .2, 0, p.s); x.quadraticCurveTo(-p.s * .95, -p.s * .2, 0, -p.s); }
        x.fill();
        if (!petal) { x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = .8; x.beginPath(); x.moveTo(0, -p.s); x.lineTo(0, p.s); x.stroke(); }
        x.restore();
      });
    };
  }

  /* ---------------------------------------------------------------- lucciole */
  function flyInit(fx) { var n = area(fx, 9000); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, vx: (rnd() - .5) * 30, vy: (rnd() - .5) * 30, ph: rnd() * TAU, r: 4 + rnd() * 7 }); }
  function flyDraw(fx, dt) {
    var x = fx.x; x.globalCompositeOperation = 'lighter';
    fx.P.forEach(function (p) {
      p.vx += (rnd() - .5) * 90 * dt; p.vy += (rnd() - .5) * 90 * dt; p.vx *= .985; p.vy *= .985;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -10) p.x = fx.w + 10; if (p.x > fx.w + 10) p.x = -10; if (p.y < -10) p.y = fx.h + 10; if (p.y > fx.h + 10) p.y = -10;
      var a = .2 + .8 * (.5 + .5 * Math.sin(fx.t * 1.8 + p.ph)), gr = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6);
      gr.addColorStop(0, 'rgba(255,248,160,' + a + ')'); gr.addColorStop(.3, 'rgba(255,240,120,' + a * .45 + ')'); gr.addColorStop(1, 'rgba(255,240,120,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(p.x, p.y, p.r * 2.6, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,230,' + a + ')'; x.beginPath(); x.arc(p.x, p.y, 1.4, 0, TAU); x.fill();
    });
  }

  /* ---------------------------------------------------------------- stelle cadenti */
  function metInit(fx) { fx.S.next = .4; fx.S.m = []; var n = area(fx, 7000); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h * .75, ph: rnd() * TAU, r: .5 + rnd() * 1.2 }); }
  function metDraw(fx, dt) {
    var x = fx.x, S = fx.S;
    fx.P.forEach(function (p) { x.globalAlpha = fx.alpha * (.25 + .6 * Math.abs(Math.sin(fx.t * 1.3 + p.ph))); x.fillStyle = '#fff'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill(); });
    x.globalAlpha = fx.alpha;
    S.next -= dt;
    if (S.next <= 0) { S.next = .9 + rnd() * 2.2; S.m.push({ x: fx.w * (.35 + rnd() * .75), y: -10 + rnd() * fx.h * .3, vx: -(520 + rnd() * 320), vy: 280 + rnd() * 200, len: 90 + rnd() * 80, life: 0 }); }
    for (var i = S.m.length - 1; i >= 0; i--) {
      var m = S.m[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.life += dt;
      if (m.life > 1.3 || m.y > fx.h + 20 || m.x < -120) { S.m.splice(i, 1); continue; }
      var sp = Math.hypot(m.vx, m.vy), tx = m.x - m.vx / sp * m.len, ty = m.y - m.vy / sp * m.len, a = Math.min(1, (1.3 - m.life) * 2);
      var gr = x.createLinearGradient(m.x, m.y, tx, ty); gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(160,190,255,0)');
      x.strokeStyle = gr; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(m.x, m.y); x.lineTo(tx, ty); x.stroke();
      x.fillStyle = 'rgba(255,255,255,' + a + ')'; x.beginPath(); x.arc(m.x, m.y, 2, 0, TAU); x.fill();
    }
  }

  /* ---------------------------------------------------------------- fuochi d'artificio */
  function fwInit(fx) { fx.S.next = .3; fx.S.r = []; fx.S.s = []; }
  function fwDraw(fx, dt) {
    var x = fx.x, S = fx.S; x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    S.next -= dt;
    if (S.next <= 0) { S.next = .7 + rnd() * 1.3; S.r.push({ x: fx.w * (.12 + rnd() * .76), y: fx.h + 4, ty: fx.h * (.14 + rnd() * .36), v: fx.h * (.9 + rnd() * .5), h: Math.floor(rnd() * 360) }); }
    for (var i = S.r.length - 1; i >= 0; i--) {
      var r = S.r[i]; r.y -= r.v * dt; r.v *= (1 - .6 * dt);
      x.strokeStyle = 'hsla(' + r.h + ',100%,80%,.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(r.x, r.y); x.lineTo(r.x, r.y + 12); x.stroke();
      if (r.y <= r.ty || r.v < 24) {
        var n = 46 + Math.floor(rnd() * 30), two = rnd() > .5;
        for (var k = 0; k < n; k++) { var a = TAU * k / n + rnd() * .1, sp = 50 + rnd() * 140 * (two && k % 2 ? .55 : 1); S.s.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, h: two && k % 2 ? (r.h + 160) % 360 : r.h + rnd() * 24 }); }
        S.r.splice(i, 1);
      }
    }
    for (var s = S.s.length - 1; s >= 0; s--) {
      var p = S.s[s], px = p.x, py = p.y; p.vy += 110 * dt; p.vx *= (1 - .9 * dt); p.vy *= (1 - .5 * dt); p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * .75;
      if (p.life <= 0) { S.s.splice(s, 1); continue; }
      x.strokeStyle = 'hsla(' + p.h + ',100%,' + (62 + 20 * p.life) + '%,' + p.life + ')'; x.lineWidth = 1.8 * p.life + .4; x.beginPath(); x.moveTo(px, py); x.lineTo(p.x, p.y); x.stroke();
    }
  }

  /* ---------------------------------------------------------------- bolle */
  function bubInit(fx) { var n = area(fx, 9500); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, r: 3 + rnd() * 9, v: 20 + rnd() * 44, ph: rnd() * TAU, sw: 6 + rnd() * 14 }); }
  function bubDraw(fx, dt) {
    var x = fx.x;
    fx.P.forEach(function (p) {
      p.y -= p.v * dt; p.x += Math.sin(fx.t * 1.4 + p.ph) * p.sw * dt;
      if (p.y < -p.r * 2) { p.y = fx.h + p.r * 2; p.x = rnd() * fx.w; }
      x.fillStyle = 'rgba(255,255,255,.08)'; x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1.2;
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(p.x, p.y, p.r * .62, Math.PI * 1.15, Math.PI * 1.5); x.stroke();
    });
  }

  /* ---------------------------------------------------------------- coriandoli */
  var CONF = ['#FF4D6D', '#FFD93D', '#4DD2FF', '#7CFF6B', '#B07CFF', '#FF9A3D'];
  function confInit(fx) { var n = area(fx, 5200); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, w: 5 + rnd() * 6, h: 3 + rnd() * 4, v: 50 + rnd() * 90, rot: rnd() * TAU, rv: (rnd() - .5) * 6, ph: rnd() * TAU, sw: 14 + rnd() * 26, c: pick(CONF) }); }
  function confDraw(fx, dt) {
    var x = fx.x;
    fx.P.forEach(function (p) {
      p.y += p.v * dt; p.x += Math.sin(fx.t * 1.6 + p.ph) * p.sw * dt; p.rot += p.rv * dt;
      if (p.y > fx.h + 10) { p.y = -10; p.x = rnd() * fx.w; }
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, Math.abs(Math.cos(fx.t * 3 + p.ph)) * .9 + .1); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore();
    });
  }

  var E = {
    pioggia:    { name: 'Pioggia',          icon: 'mdi-weather-pouring',         init: rainInit(false), draw: rainDraw(false) },
    temporale:  { name: 'Temporale',        icon: 'mdi-weather-lightning-rainy', init: rainInit(true),  draw: rainDraw(true) },
    neve:       { name: 'Neve',             icon: 'mdi-weather-snowy',           init: snowInit,        draw: snowDraw },
    nebbia:     { name: 'Nebbia',           icon: 'mdi-weather-fog',             init: fogInit,         draw: fogDraw },
    foglie:     { name: 'Foglie d\'autunno', icon: 'mdi-leaf-maple',              init: leafInit(false), draw: leafDraw(false) },
    petali:     { name: 'Petali',           icon: 'mdi-flower-tulip',            init: leafInit(true),  draw: leafDraw(true) },
    lucciole:   { name: 'Lucciole',         icon: 'mdi-shimmer',                 init: flyInit,         draw: flyDraw },
    stelle:     { name: 'Stelle cadenti',   icon: 'mdi-star-shooting',           init: metInit,         draw: metDraw },
    fuochi:     { name: 'Fuochi d\'artificio', icon: 'mdi-firework',             init: fwInit,          draw: fwDraw },
    bolle:      { name: 'Bolle',            icon: 'mdi-chart-bubble',          init: bubInit,         draw: bubDraw },
    coriandoli: { name: 'Coriandoli',       icon: 'mdi-party-popper',            init: confInit,        draw: confDraw }
  };
  g.FX = { Fx: Fx, E: E };
})(NS);



  return NS;
})();

/* ---- src/i18n.js ---- */
/* Dynamic Home Card — translations.
   To add a language: copy the "en" block, translate the values, keep the keys.
   Language is picked from the card option `language`, otherwise from the
   Home Assistant user profile (hass.locale.language), falling back to English. */
const I18N = {
  en: {
    greetings: { night: "Good night", morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
    outside: "Outside",
    unavailable: "Unavailable",
    forecast: "Forecast", today: "Today", max: "max", min: "min",
    worlds: {
      house: "House", city: "City", mountain: "Mountain", lighthouse: "Sea & lighthouse", magic_forest: "Magic forest",
      space: "Space", japan: "Japan", cyberpunk: "Cyberpunk", christmas: "Christmas", ocean: "Ocean"
    },
    editor: {
      weather_entity: "Weather entity", sun_entity: "Sun entity", world: "World", effect: "Effect", language: "Language",
      theme: "Theme", name: "Name in greeting", time_format: "Time format", show_time: "Show time", show_date: "Show date",
      show_greeting: "Show greeting", show_world_name: "Show world name", weather_sky: "Sky follows the weather",
      windows: "Window lights", effect_intensity: "Effect intensity"
    }
  },
  fr: {
    greetings: { night: "Bonne nuit", morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir" },
    outside: "Extérieur",
    unavailable: "Indisponible",
    forecast: "Prévisions", today: "Auj.", max: "max", min: "min",
    worlds: {
      house: "Maison", city: "Ville", mountain: "Montagne", lighthouse: "Mer et phare", magic_forest: "Forêt magique",
      space: "Espace", japan: "Japon", cyberpunk: "Cyberpunk", christmas: "Noël", ocean: "Océan"
    },
    editor: {
      weather_entity: "Entité météo", sun_entity: "Entité soleil", world: "Monde", effect: "Effet", language: "Langue",
      theme: "Thème", name: "Prénom dans la salutation", time_format: "Format de l'heure", show_time: "Afficher l'heure",
      show_date: "Afficher la date", show_greeting: "Afficher la salutation", show_world_name: "Afficher le nom du monde",
      weather_sky: "Le ciel suit la météo", windows: "Fenêtres éclairées", effect_intensity: "Intensité de l'effet"
    }
  }
};

function pickLanguage(configLang, hass) {
  const want = (configLang && configLang !== "auto" ? configLang : (hass && hass.locale && hass.locale.language) || (hass && hass.language) || "en");
  const base = String(want).toLowerCase().split(/[-_]/)[0];
  return I18N[base] ? base : "en";
}

/* ---- src/styles.js ---- */
/* Dynamic Home Card — styles.
   Visual design derived from the "hero" of Aurora Glass v3 © 2026 DomotikPro.it (Luca Pinelli), GPL-3.0.
   Adapted to a standalone Lovelace card: container queries instead of viewport media queries,
   background blobs scoped to the card, Home Assistant theme fallbacks. */
const FONT_URL = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap";

const PROPS = "@property --dhc-b1 { syntax: '<color>'; inherits: true; initial-value: #7C5CFF; }\n" +
  "@property --dhc-b2 { syntax: '<color>'; inherits: true; initial-value: #3B82F6; }\n" +
  "@property --dhc-b3 { syntax: '<color>'; inherits: true; initial-value: #22D3EE; }\n" +
  "@property --dhc-a1 { syntax: '<color>'; inherits: true; initial-value: #7C5CFF; }\n" +
  "@property --dhc-a2 { syntax: '<color>'; inherits: true; initial-value: #D946EF; }\n" +
  "@property --dhc-win { syntax: '<color>'; inherits: true; initial-value: #FFD27A; }";

const CSS = `
:host {
  display: block; height: 100%;
  --ease: cubic-bezier(.16, 1, .3, 1);
  --spring: cubic-bezier(.34, 1.56, .64, 1);
  --font-display: 'Sora', 'Manrope', system-ui, sans-serif;
  --font-ui: 'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --b1: var(--dhc-b1); --b2: var(--dhc-b2); --b3: var(--dhc-b3); --a1: var(--dhc-a1); --a2: var(--dhc-a2); --win: var(--dhc-win);
  transition: --dhc-b1 1.6s ease, --dhc-b2 1.6s ease, --dhc-b3 1.6s ease, --dhc-a1 1.6s ease, --dhc-a2 1.6s ease, --dhc-win 1.6s ease;
  --bg: #070A16;
  --border: rgba(255,255,255,.10);
  --hi: rgba(255,255,255,.16);
  --text: #F5F7FF; --dim: #A3AED0; --faint: #6B7599;
  --acc-text: color-mix(in srgb, var(--b1) 55%, #fff);
  --blob-o: .55;
  --shadow: 0 24px 60px -26px rgba(0,0,0,.75);
}
:host([data-theme="light"]) {
  --bg: #EDF0FA;
  --border: rgba(20,25,60,.10); --hi: rgba(255,255,255,.95);
  --text: #141838; --dim: #55608A; --faint: #8E97B8;
  --acc-text: color-mix(in srgb, var(--a1) 85%, #000);
  --blob-o: .38;
  --shadow: 0 24px 50px -28px rgba(30,40,90,.38);
}
:host([data-fonts="theme"]) { --font-display: var(--ha-font-family-body, var(--primary-font-family, inherit)); --font-ui: var(--ha-font-family-body, var(--primary-font-family, inherit)); }
* { box-sizing: border-box; }
[hidden] { display: none !important; }

ha-card.hero {
  position: relative; isolation: isolate; overflow: hidden; height: 100%;
  min-height: var(--dhc-height, 290px); display: flex;
  border-radius: var(--ha-card-border-radius, 28px);
  background: var(--bg); color: var(--text);
  border: 1px solid var(--border);
  box-shadow: var(--shadow), inset 0 1px 0 var(--hi);
  font-family: var(--font-ui); font-size: 16px; line-height: 1.4; -webkit-font-smoothing: antialiased;
  container-type: inline-size; container-name: dhc;
}
ha-card.hero.clickable { cursor: pointer; }

/* living background (the Aurora "blobs"), scoped to the card */
.bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.bg i { position: absolute; width: 90%; aspect-ratio: 1; border-radius: 50%; opacity: var(--blob-o); }
.bg .o1 { left: -30%; top: -80%; background: radial-gradient(circle, var(--b1), transparent 64%); animation: drift1 30s ease-in-out infinite alternate; }
.bg .o2 { right: -35%; top: -20%; background: radial-gradient(circle, var(--b2), transparent 64%); animation: drift2 38s ease-in-out infinite alternate; }
.bg .o3 { left: 10%; bottom: -120%; background: radial-gradient(circle, var(--b3), transparent 64%); animation: drift3 44s ease-in-out infinite alternate; }
@keyframes drift1 { to { transform: translate(14%, 12%) scale(1.15); } }
@keyframes drift2 { to { transform: translate(-16%, 14%) scale(.9); } }
@keyframes drift3 { to { transform: translate(18%, -10%) scale(1.2); } }

.flash { position: absolute; inset: 0; z-index: 4; pointer-events: none; background: rgba(214,228,255, calc(var(--flash, 0) * .28)); }

.hero-art { position: absolute; right: 0; bottom: 0; height: 100%; aspect-ratio: 640 / 260; z-index: 0;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.7) 20%, #000 40%); mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.7) 20%, #000 40%); }
.hero-art img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 1.1s ease; }
.hero-art img.show { opacity: 1; }
.wglow { position: absolute; border-radius: 2px; background: var(--win); box-shadow: 0 0 9px 2px var(--win); opacity: 0; transition: opacity .6s ease; pointer-events: none; }
.wglow.on { opacity: 1; }
.fx-hero { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
.hero-body { position: relative; z-index: 2; padding: clamp(22px, 3vw, 36px); display: flex; flex-direction: column; justify-content: center; gap: 4px; min-width: 0; }
.hero-tag { position: absolute; z-index: 3; right: 16px; top: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; font-size: .74rem; font-weight: 700; color: #fff; background: rgba(8,10,30,.45); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.18); }
.hero-tag ha-icon { --mdc-icon-size: 16px; }
.eyebrow { margin: 0; font-size: .74rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--faint); }
.greet { margin: 2px 0 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(1.1rem, 2.2vw, 1.5rem); letter-spacing: -.02em; line-height: 1.25; }
.clock { font-family: var(--font-display); font-weight: 800; line-height: 1; letter-spacing: -.05em; font-variant-numeric: tabular-nums; font-size: clamp(3.6rem, 9cqi, 6.6rem); margin: 4px 0 8px; background: linear-gradient(110deg, var(--text) 10%, var(--acc-text) 55%, var(--a2) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; filter: drop-shadow(0 6px 24px color-mix(in srgb, var(--a1) 35%, transparent)); }
.clock .colon { animation: blink 1s steps(1) infinite; }
.clock .ampm { font-size: .32em; letter-spacing: 0; margin-left: .2em; }
@keyframes blink { 50% { opacity: .25; } }
.hero-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px 8px 10px; border-radius: 99px; font-size: .82rem; font-weight: 600; color: var(--dim); background: color-mix(in srgb, var(--bg) 45%, transparent); border: 1px solid var(--border); backdrop-filter: blur(8px); -webkit-tap-highlight-color: transparent; user-select: none; max-width: 100%; }
.chip.action { cursor: pointer; transition: transform .25s var(--spring), border-color .2s; }
.chip.action:hover { border-color: color-mix(in srgb, var(--acc-text) 45%, transparent); }
.chip.action:active { transform: scale(.96); }
.chip:focus-visible { outline: 2px solid var(--acc-text); outline-offset: 2px; }
.chip ha-icon { --mdc-icon-size: 1.1rem; color: var(--acc-text); flex: none; }
.chip .lbl { white-space: nowrap; }
.chip b { color: var(--text); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chip.na b { opacity: .5; }

/* forecast: same glass as the chips; right of the banner when wide, under the chips when narrow */
.forecast { display: flex; gap: 2px; padding: 10px 8px; border-radius: 22px; background: color-mix(in srgb, var(--bg) 45%, transparent); border: 1px solid var(--border); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: inset 0 1px 0 var(--hi); }
.forecast.pos-right { position: absolute; z-index: 3; top: 50%; right: clamp(16px, 2.4vw, 28px); transform: translateY(-50%); max-height: calc(100% - 24px); }
.forecast.pos-below { margin-top: 12px; align-self: flex-start; max-width: 100%; overflow-x: auto; scrollbar-width: none; }
.hero.fc-right .hero-body { padding-right: calc(var(--dhc-fc-w, 0px) + 2 * clamp(16px, 2.4vw, 28px)); }
.hero.fc-right .hero-art { right: calc(var(--dhc-fc-w, 0px) + clamp(16px, 2.4vw, 28px));
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.7) 20%, #000 40%, #000 72%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.7) 20%, #000 40%, #000 72%, transparent 100%); }
.fc-day { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 50px; padding: 2px 6px; border-radius: 14px; }
.fc-day.today { background: color-mix(in srgb, var(--acc-text) 14%, transparent); }
.fc-name { font-size: .66rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); white-space: nowrap; }
.fc-day.today .fc-name { color: var(--acc-text); }
.fc-day ha-icon { --mdc-icon-size: 24px; color: var(--acc-text); margin: 4px 0 2px; }
.fc-hi { font-family: var(--font-display); font-weight: 700; font-size: .95rem; color: var(--text); font-variant-numeric: tabular-nums; }
.fc-lo { font-size: .8rem; font-weight: 600; color: var(--dim); font-variant-numeric: tabular-nums; }
.fc-bar { position: relative; width: 5px; height: 30px; margin: 3px 0; border-radius: 99px; background: color-mix(in srgb, var(--text) 12%, transparent); }
.fc-bar i { position: absolute; left: 0; right: 0; border-radius: 99px; background: linear-gradient(0deg, var(--b3), var(--a2)); }
@container dhc (max-width: 900px) { .forecast.pos-right .fc-day:nth-child(n+4) { display: none; } }

/* narrow cards (phones, small columns): scene goes under the text, like Aurora's mobile layout */
@container dhc (max-width: 600px) {
  ha-card.hero { min-height: var(--dhc-height-narrow, 410px); }
  .hero-art { height: auto; width: 100%; -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 42%); mask-image: linear-gradient(180deg, transparent 0%, #000 42%); }
  .hero-body { padding-bottom: 46cqi; justify-content: flex-start; }
  .hero-tag { top: auto; bottom: 12px; }
  .clock { font-size: clamp(3.2rem, 18cqi, 5rem); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}
`;

/* ---- src/logic.js ---- */
/* Dynamic Home Card — pure helpers (no DOM). Covered by tests/logic.test.mjs. */

/* World ids exposed in YAML (English) -> engine ids (Italian, from Aurora Glass). */
const WORLDS = {
  house: "casetta", city: "citta", mountain: "montagna", lighthouse: "mare", magic_forest: "foresta",
  space: "spazio", japan: "giappone", cyberpunk: "cyberpunk", christmas: "natale", ocean: "oceano"
};

/* Effect ids exposed in YAML (English) -> engine ids. */
const EFFECTS = {
  rain: "pioggia", storm: "temporale", snow: "neve", fog: "nebbia", leaves: "foglie", petals: "petali",
  fireflies: "lucciole", shooting_stars: "stelle", fireworks: "fuochi", bubbles: "bolle", confetti: "coriandoli"
};

/* Home Assistant weather conditions (https://www.home-assistant.io/integrations/weather/)
   -> [effect, intensity, overcast 0..1]. Overridable per condition with `weather_effects`. */
const WEATHER_DEFAULTS = {
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
function resolveWorld(id) {
  if (id === undefined || id === null || id === "") return "house";
  const k = String(id).toLowerCase();
  if (WORLDS[k]) return k;
  if (WORLD_BY_ENGINE[k]) return WORLD_BY_ENGINE[k];
  return null;
}

/** "auto" | "none" | effect id (English or Italian). Returns the public id, "auto", "none" or null if unknown. */
function resolveEffect(id) {
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
function weatherScene(condition, config) {
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

function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

/** Hours of the day (0..24, fractional) of a Date, local time. */
function hoursOf(d) { return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }

/**
 * The worlds were drawn for a fixed day: sunrise colours at 6:30 and sunset colours at 18:30.
 * This maps the real local time onto that model so dawn and dusk follow the real sun
 * (sun.sun next_rising / next_setting). Falls back to the clock when the sun entity is missing
 * or the values are unusable (polar day/night).
 */
function modelHour(now, sunState) {
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
function greetingKey(h) {
  if (h >= 22 || h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

/** Uses the engine colour mixer to grey the sky and thicken clouds for bad weather. */
function applyOvercast(K, B, f, mix) {
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
function normalizeChip(c) {
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
function isOnState(s) { return !!s && ON_STATES.indexOf(s.state) > -1; }
function isUnavail(s) { return !s || s.state === "unavailable" || s.state === "unknown"; }

/**
 * Subset of Lovelace visibility conditions: state, numeric_state, screen, user, and/or/not.
 * Unknown condition types count as "visible" so a typo never hides content silently forever.
 */
function checkVisibility(conds, hass, matchMedia) {
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
function chipValue(c, s, hass, lang) {
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

const CONDITION_ICONS = {
  "clear-night": "mdi:weather-night", cloudy: "mdi:weather-cloudy", exceptional: "mdi:alert-circle-outline",
  fog: "mdi:weather-fog", hail: "mdi:weather-hail", lightning: "mdi:weather-lightning", "lightning-rainy": "mdi:weather-lightning-rainy",
  partlycloudy: "mdi:weather-partly-cloudy", pouring: "mdi:weather-pouring", rainy: "mdi:weather-rainy", snowy: "mdi:weather-snowy",
  "snowy-rainy": "mdi:weather-snowy-rainy", sunny: "mdi:weather-sunny", windy: "mdi:weather-windy", "windy-variant": "mdi:weather-windy-variant"
};

/* ------------------------------------------------------------------ forecast */
const FORECAST_TYPES = ["daily", "hourly"];
const FORECAST_POSITIONS = ["right", "below"];

/**
 * `forecast: true` or an object -> normalised options, or null when the forecast is off.
 * Throws readable errors for bad values (shown by Lovelace in place of the card).
 */
function normalizeForecast(f) {
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
function forecastItems(list, opts, now) {
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
function forecastRange(items) {
  let min = Infinity, max = -Infinity;
  items.forEach((x) => [x.lo, x.hi].forEach((v) => { if (v !== null) { min = Math.min(min, v); max = Math.max(max, v); } }));
  return min === Infinity ? null : { min, max };
}

/** Position of the min..max bar of one day inside the global range, in % from the bottom. */
function rangeBar(item, range) {
  if (!range || item.lo === null || item.hi === null) return null;
  const span = range.max - range.min;
  if (span <= 0) return { from: 0, to: 100 };
  const a = clamp((item.lo - range.min) / span * 100, 0, 100);
  const b = clamp((item.hi - range.min) / span * 100, 0, 100);
  let from = Math.min(a, b), to = Math.max(a, b);
  if (to - from < 6) { to = Math.min(100, from + 6); from = to - 6; } // always visible
  return { from: Math.round(from), to: Math.round(to) };
}

function normIcon(i) {
  if (!i) return null;
  const s = String(i);
  if (s.indexOf(":") > 0) return s;
  return "mdi:" + s.replace(/^mdi-/, "");
}

/* ---- src/card.js ---- */
/* Dynamic Home Card — a Home Assistant Lovelace card.
   Animated home banner: the sky follows the real sun, the scene follows the real weather,
   greeting / date / time and fully configurable chips.
   License: GPL-3.0-or-later. Rendering engine and visual design derived from
   Aurora Glass v3 © 2026 DomotikPro.it (Luca Pinelli), GPL-3.0 — see NOTICE.md. */




const VERSION = "0.2.0";
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
    this._fcUnsub = null;
    this._fcList = null;
    this._fcKey = "";
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
    const forecast = normalizeForecast(config.forecast);
    const old = this._config;
    this._config = Object.assign({
      show_time: true, show_date: true, show_greeting: true, show_world_name: false,
      theme: "auto", fonts: "google", windows: "auto", weather_sky: true, time_format: "auto", language: "auto",
      sun_entity: "sun.sun"
    }, config, { _world: world, _effect: effect, _chips: chips, _forecast: forecast });
    if (this._built) {
      this._buildChips();
      this._artKey = ""; this._fxKey = "";
      if (!old || JSON.stringify(old.chips) !== JSON.stringify(config.chips)) this._resubscribeTemplates();
      this._resubscribeForecast();
      this._update(true);
    }
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._build();
    if (first) { this._resubscribeTemplates(); this._resubscribeForecast(); }
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
    if (this._built) { this._startTimer(); this._update(true); this._resubscribeTemplates(); this._resubscribeForecast(true); }
  }
  disconnectedCallback() {
    this._connected = false;
    clearInterval(this._timer); this._timer = 0;
    if (this._fx) this._fx.stop();
    this._unsubscribeTemplates();
    this._unsubscribeForecast();
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
      '<div class="hero-body"><p class="eyebrow"></p><h1 class="greet"></h1><div class="clock" aria-live="off"></div><div class="hero-chips"></div></div>' +
      '<div class="forecast" role="list" hidden></div>';
    root.appendChild(card);
    const $ = (s) => card.querySelector(s);
    this._els = {
      imgs: card.querySelectorAll(".hero-art img"), win: $(".win-layer"), canvas: $(".fx-hero"),
      tag: $(".hero-tag"), tagIcon: $(".hero-tag ha-icon"), tagText: $(".hero-tag span"),
      date: $(".eyebrow"), greet: $(".greet"), clock: $(".clock"), chips: $(".hero-chips"),
      body: $(".hero-body"), forecast: $(".forecast")
    };
    this._front = this._els.imgs[0]; this._back = this._els.imgs[1];
    bindActions(card, () => this._config, (a) => this._cardAction(a));
    this._fx = new FX.Fx(this._els.canvas, { k: 1, alpha: 1, onFlash: (a) => this.style.setProperty("--flash", a.toFixed(3)) });
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => { if (this._fx && this._fx.kind !== "none") this._fx.resize(); this._placeForecast(); });
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

  /* ---------------- forecast, via HA's weather/subscribe_forecast subscription ---------------- */
  _unsubscribeForecast() {
    const p = this._fcUnsub;
    this._fcUnsub = null;
    if (p) Promise.resolve(p).then((u) => { try { if (typeof u === "function") u(); } catch (e) { /* ignore */ } }).catch(() => {});
  }
  _resubscribeForecast(force) {
    const c = this._config, hass = this._hass, f = c && c._forecast;
    const key = f && c.weather_entity ? c.weather_entity + "|" + f.type : "";
    if (!force && key === this._fcKey && (this._fcUnsub || !key)) return;
    this._unsubscribeForecast();
    this._fcKey = key;
    this._fcList = null;
    if (!key || !hass || !hass.connection || !this._connected && this.isConnected === false) { this._renderForecast(); return; }
    const p = hass.connection.subscribeMessage((msg) => {
      const list = msg && (msg.forecast || (msg.event && msg.event.forecast));
      this._fcList = Array.isArray(list) ? list : [];
      this._renderForecast();
    }, { type: "weather/subscribe_forecast", forecast_type: f.type, entity_id: c.weather_entity });
    if (p && p.catch) p.catch((e) => { console.warn("dynamic-home-card: forecast unavailable", e && e.message); this._fcList = []; this._renderForecast(); });
    this._fcUnsub = p;
  }

  _fmtTemp(v) {
    const f = this._config._forecast;
    return Number(v).toLocaleString(this._locale(), { minimumFractionDigits: f.decimals, maximumFractionDigits: f.decimals }) + "°";
  }

  _renderForecast() {
    if (!this._built) return;
    const box = this._els.forecast, c = this._config, f = c._forecast;
    const ws = this._hass && c.weather_entity ? this._hass.states[c.weather_entity] : undefined;
    // older integrations still expose the forecast as an attribute
    const list = this._fcList || (ws && Array.isArray(ws.attributes.forecast) ? ws.attributes.forecast : null);
    const items = f ? forecastItems(list, f, this._now()) : [];
    const t = this._t(), lang = this._locale();
    const rkey = JSON.stringify([items, f, lang, this._timeFormat()]);
    if (rkey === this._fcRender) { this._placeForecast(); return; }
    this._fcRender = rkey;
    this._card.classList.toggle("has-fc", items.length > 0);
    box.hidden = !items.length;
    box.textContent = "";
    if (!items.length) { this._placeForecast(); return; }
    const range = f.range_bar ? forecastRange(items) : null;
    box.setAttribute("aria-label", t.forecast);
    items.forEach((x) => {
      const day = el("div", "fc-day" + (x.today ? " today" : ""));
      day.setAttribute("role", "listitem");
      const name = el("span", "fc-name");
      if (f.type === "hourly") name.textContent = new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit", hourCycle: this._timeFormat() === "12" ? "h12" : "h23" }).format(x.date);
      else name.textContent = x.today ? t.today : new Intl.DateTimeFormat(lang, { weekday: "short" }).format(x.date).replace(/\.$/, "");
      const ic = el("ha-icon");
      ic.setAttribute("icon", CONDITION_ICONS[x.condition] || "mdi:weather-partly-cloudy");
      const hi = el("span", "fc-hi"); hi.textContent = x.hi === null ? "—" : this._fmtTemp(x.hi);
      day.append(name, ic, hi);
      const bar = range ? rangeBar(x, range) : null;
      if (bar) {
        const track = el("span", "fc-bar"); track.setAttribute("aria-hidden", "true");
        const fill = el("i");
        fill.style.bottom = bar.from + "%"; fill.style.top = (100 - bar.to) + "%";
        track.appendChild(fill); day.appendChild(track);
      }
      if (x.lo !== null) { const lo = el("span", "fc-lo"); lo.textContent = this._fmtTemp(x.lo); day.appendChild(lo); }
      day.setAttribute("aria-label", [name.textContent, x.hi !== null ? t.max + " " + this._fmtTemp(x.hi) : "", x.lo !== null ? t.min + " " + this._fmtTemp(x.lo) : ""].filter(Boolean).join(", "));
      box.appendChild(day);
    });
    this._placeForecast();
  }

  /* right of the banner when there is room, otherwise in the text column under the chips */
  _placeForecast() {
    if (!this._built) return;
    const box = this._els.forecast, f = this._config && this._config._forecast;
    const right = !!f && f.position === "right" && !box.hidden && this._card.clientWidth >= 600;
    const parent = right ? this._card : this._els.body;
    if (box.parentNode !== parent) parent.appendChild(box);
    box.classList.toggle("pos-right", right);
    box.classList.toggle("pos-below", !right);
    this._card.classList.toggle("fc-right", right);
    if (right) this.style.setProperty("--dhc-fc-w", box.offsetWidth + "px"); else this.style.removeProperty("--dhc-fc-w");
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
    this._renderForecast();
  }

  /* "12" or "24": card option, then the HA user profile, then the locale */
  _timeFormat() {
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
    return fmt;
  }

  _renderClock(now) {
    const fmt = this._timeFormat();
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


})();
