/* Dynamic Home Card — styles.
   Visual design derived from the "hero" of Aurora Glass v3 © 2026 DomotikPro.it (Luca Pinelli), GPL-3.0.
   Adapted to a standalone Lovelace card: container queries instead of viewport media queries,
   background blobs scoped to the card, Home Assistant theme fallbacks. */
export const FONT_URL = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap";

export const PROPS = "@property --dhc-b1 { syntax: '<color>'; inherits: true; initial-value: #7C5CFF; }\n" +
  "@property --dhc-b2 { syntax: '<color>'; inherits: true; initial-value: #3B82F6; }\n" +
  "@property --dhc-b3 { syntax: '<color>'; inherits: true; initial-value: #22D3EE; }\n" +
  "@property --dhc-a1 { syntax: '<color>'; inherits: true; initial-value: #7C5CFF; }\n" +
  "@property --dhc-a2 { syntax: '<color>'; inherits: true; initial-value: #D946EF; }\n" +
  "@property --dhc-win { syntax: '<color>'; inherits: true; initial-value: #FFD27A; }";

export const CSS = `
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
