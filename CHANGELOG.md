# Changelog

## 0.2.0 — 2026-10-23

- New `forecast` option (off by default): daily or hourly forecast inside the banner, in the same glass style as the chips, with max/min temperatures and a min/max bar per day scaled to the shown period.
- Data comes from Home Assistant's `weather/subscribe_forecast` subscription (live updates, no extra sensor); the legacy `forecast` attribute is used as a fallback.
- Shown on the right of the banner when the card is wide enough (the scene moves left to make room, 3 days under 900 px), under the chips otherwise or with `position: below`.
- Hourly forecast labels follow the 12/24 h setting.

## 0.1.0 — 2026-10-23

First release.

- Animated home banner with the 10 worlds and 11 effects of Aurora Glass v3.
- Automatic effects and overcast sky from the `weather` entity; per-condition overrides.
- Dawn/dusk aligned with `sun.sun`.
- Configurable chips (entity, attribute, template, colours, visibility, standard HA actions).
- Options: `show_time`, `show_date`, `show_greeting`, `language` (fr/en), `theme`, `fonts`, `windows`, `height`.
