# Changelog

## 0.3.0 — 2026-10-29

- New `layout` option for narrow cards (< 600 px wide), also in the visual editor:
  - `compact`: no room kept for the scene, it sits behind the bottom of the text (shortest card).
  - `full`: room under the chips, the whole scene is visible (the 0.2.1 behaviour).
  - `auto` (default): compact on phones, full on tablets and computers. It uses Home Assistant's own mobile breakpoint (screen < 768 px, same as the `screen` visibility condition) and follows it live when the window is resized or the phone rotated.
- No effect on wide cards, where the scene is on the right of the text.

## 0.2.1 — 2026-10-28

- Sections view: the card no longer asks for a fixed 5 rows (`getGridOptions` has no `rows`/`min_rows`), so its height follows its content. On narrow columns the last row of chips was cut off.
- Spacing and greeting size use container units (`cqi`) instead of viewport units (`vw`): a narrow card now looks the same on a wide desktop window as on a phone.
- Narrow layout: the space kept for the scene under the text matches the visible part of the scene. The narrow `min-height` rule, which never applied (the card cannot query its own size), is removed.

## 0.2.0 — 2026-10-23

- New `forecast` option (off by default): daily or hourly forecast inside the banner, in the same glass style as the chips, with max/min temperatures and a min/max bar per day scaled to the shown period.
- Data comes from Home Assistant's `weather/subscribe_forecast` subscription (live updates, no extra sensor); the legacy `forecast` attribute is used as a fallback.
- Shown on the right of the banner when the card is wide enough (the scene moves left to make room, 3 days under 900 px), under the chips otherwise or with `position: below`.
- Hourly forecast labels follow the 12/24 h setting.
- Visual editor: **Show forecast** switch (`show_forecast`) and a **Forecast** section for the details.

## 0.1.0 — 2026-10-23

First release.

- Animated home banner with the 10 worlds and 11 effects of Aurora Glass v3.
- Automatic effects and overcast sky from the `weather` entity; per-condition overrides.
- Dawn/dusk aligned with `sun.sun`.
- Configurable chips (entity, attribute, template, colours, visibility, standard HA actions).
- Options: `show_time`, `show_date`, `show_greeting`, `language` (fr/en), `theme`, `fonts`, `windows`, `height`.
