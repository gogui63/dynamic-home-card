# Dynamic Home Card

🇫🇷 [Lire en français](README.fr.md)

An animated home banner for Home Assistant dashboards. The sky follows **the real sun**, the scene follows **the real weather**, and everything around it — greeting, date, clock, chips and what each chip does — is yours to configure in YAML.

![Dynamic Home Card at dusk](docs/preview.png)

| Snow (French) | Rain, narrow card |
|---|---|
| ![](docs/preview-snow.png) | <img src="docs/preview-mobile.png" width="260"> |

- 10 animated worlds (house, city, mountain, lighthouse, magic forest, space, Japan, cyberpunk, Christmas, ocean)
- 11 effects (rain, storm, snow, fog, leaves, petals, fireflies, shooting stars, fireworks, bubbles, confetti)
- **Automatic weather**: rain when it rains, snow when it snows, grey sky and thick clouds when it is overcast — from your `weather.*` entity
- **Forecast** (optional): the next days with max/min temperatures, in the same glass style
- **Real daylight**: dawn and dusk colours line up with `sun.sun` sunrise and sunset
- Chips with any entity, attribute, colour, icon, Jinja template, visibility conditions, and standard Home Assistant `tap_action` / `hold_action` / `double_tap_action`
- English and French (more languages welcome, see [Translations](#translations))
- One JavaScript file, no dependencies

> The rendering engine and the visual design come from [Aurora Glass v3](https://github.com/lucalux00/aurora-glass-v3) by DomotikPro.it (Luca Pinelli), GPL-3.0. See [NOTICE.md](NOTICE.md).

## Install

### HACS (custom repository)
1. HACS → ⋮ → **Custom repositories** → `https://github.com/gogui63/dynamic-home-card`, type **Dashboard**.
2. Search **Dynamic Home Card** → **Download**.
3. Reload the browser (Ctrl+Shift+R).

### Manual
1. Copy `dist/dynamic-home-card.js` to `config/www/dynamic-home-card/`.
2. Settings → Dashboards → ⋮ → **Resources** → add `/local/dynamic-home-card/dynamic-home-card.js` as a **JavaScript module**.

## Minimal example

```yaml
type: custom:dynamic-home-card
weather_entity: weather.home
```

## Full example

```yaml
type: custom:dynamic-home-card
weather_entity: weather.openweathermap
world: house
language: auto            # auto | en | fr
show_time: true
chips:
  - weather
  - entity: sensor.energy_cost_today
    name: Energy
    icon: mdi:currency-eur
    decimals: 2
    hold_action:
      action: navigate
      navigation_path: /energy
  - entity: sensor.moon_phase
    name: Moon
  - entity: sensor.pollen
    name: Pollen
    attribute: level
    color_attribute: color
tap_action:
  action: navigate
  navigation_path: /lovelace/weather
```

## Options

| Option | Default | Description |
|---|---|---|
| `weather_entity` | — | `weather.*` entity. Drives the automatic effects, the sky and the `weather` chip. |
| `sun_entity` | `sun.sun` | Used to align dawn/dusk with the real sunrise/sunset. Falls back to the clock. |
| `world` | `house` | `house`, `city`, `mountain`, `lighthouse`, `magic_forest`, `space`, `japan`, `cyberpunk`, `christmas`, `ocean`. |
| `effect` | `auto` | `auto` (from the weather), `none`, or a fixed effect: `rain`, `storm`, `snow`, `fog`, `leaves`, `petals`, `fireflies`, `shooting_stars`, `fireworks`, `bubbles`, `confetti`. |
| `effect_intensity` | `1` | Density multiplier (0.1 – 4). |
| `weather_effects` | — | Per-condition override, see below. |
| `weather_sky` | `true` | Grey sky and more clouds when the weather is overcast, rainy… |
| `show_time` | `true` | Show the clock. |
| `show_date` | `true` | Show the date. |
| `show_greeting` | `true` | Show "Good evening, Name". |
| `show_world_name` | `false` | Show the world name badge. |
| `name` | user first name | Name in the greeting. `""` for none. |
| `time_format` | `auto` | `auto` (from your HA profile), `24` or `12`. |
| `language` | `auto` | `auto` (from your HA profile), `en`, `fr`. |
| `theme` | `auto` | `auto` (follows HA dark mode), `dark`, `light`. |
| `windows` | `auto` | House windows: `auto` (lit when dark), `on`, `off`, one entity (all windows), or a list of entities (one per window, in order). |
| `fonts` | `google` | `google` loads Manrope/Sora from Google Fonts; `theme` uses your HA theme font (no external request). |
| `height` | `290px` | Minimum height (number = px, or any CSS length). |
| `layout` | `auto` | Narrow cards (< 600 px): `compact` (the scene sits behind the bottom of the text, shortest card), `full` (room under the chips, the whole scene is visible) or `auto` (compact on phones, full on tablets and computers, using Home Assistant's mobile breakpoint: screen < 768 px). No effect on wide cards, where the scene is on the right. |
| `chips` | `[weather]` | See [Chips](#chips). |
| `show_forecast` | — | Visual editor switch for the forecast. `false` hides it even when `forecast` is set. |
| `forecast` | `false` | `true` or an object to show the forecast, see [Forecast](#forecast). |
| `tap_action`, `hold_action`, `double_tap_action` | `none` | Standard [Home Assistant actions](https://www.home-assistant.io/dashboards/actions/) for the whole card (chips have their own). |
| `preview_hour`, `preview_condition` | — | Freeze the hour (e.g. `21.5`) or the weather condition (e.g. `snowy`) to try a look. |

### Automatic weather

| Condition | Effect | Sky |
|---|---|---|
| `sunny`, `clear-night` | — | clear |
| `partlycloudy` | — | a few clouds |
| `cloudy` | — | overcast |
| `fog` | fog | overcast |
| `rainy` | rain | overcast |
| `pouring` | heavy rain | overcast |
| `lightning`, `lightning-rainy`, `hail`, `exceptional` | storm | very overcast |
| `snowy`, `snowy-rainy` | snow | overcast |
| `windy`, `windy-variant` | leaves | light clouds |

Override any condition:

```yaml
weather_effects:
  clear-night: shooting_stars
  windy: none
  pouring:
    effect: storm
    intensity: 2
    overcast: 1
```

## Forecast

Off by default. In the visual editor: turn on **Show forecast**, details are in the **Forecast** section. In YAML: `show_forecast: true` or `forecast: true` shows the next 5 days with an icon, the max and min temperature and a min/max bar. Or set the details:

```yaml
forecast:
  type: daily        # daily | hourly
  count: 5           # 1 – 12 entries
  position: right    # right of the banner when there is room | below the chips
  decimals: 0        # 0 – 2
  range_bar: true    # min/max bar of each day, scaled to the shown period
```

| Key | Default | Description |
|---|---|---|
| `type` | `daily` | `daily` (max + min) or `hourly` (temperature only). |
| `count` | `5` | Number of days or hours. Past days/hours are skipped. |
| `position` | `right` | `right`: inside the banner on the right, the scene moves left to make room (3 days when the card is under 900 px wide). `below`: under the chips. Narrow cards (< 600 px) always use `below`. |
| `decimals` | `0` | Decimals of the temperatures. |
| `range_bar` | `true` | Show the min/max bar. |

The forecast comes from the `weather_entity` through Home Assistant's live forecast subscription, so it works with any weather integration that provides a forecast (daily and/or hourly, depending on the integration). The forecast is part of the banner: tapping it runs the card's `tap_action`.

> **Sections view**: the card does not set a default number of rows, so its height follows its content (chips that wrap, forecast under the chips on narrow cards). If you force a height with `grid_options.rows`, content that does not fit is cut off.

## Chips

A chip is `weather`, an entity id, or an object:

| Key | Description |
|---|---|
| `type` | `weather` or `entity` (default). |
| `entity` | Entity to show (for `weather`: defaults to `weather_entity`). |
| `name` | Label. Defaults to the friendly name (`Outside` for weather). `""` hides it. |
| `icon` | e.g. `mdi:flash`. Defaults to the entity icon (condition icon for weather). |
| `icon_color` | Icon colour. |
| `attribute` | Show this attribute instead of the state. |
| `content` | Jinja template rendered by Home Assistant, e.g. `"{{ states('sensor.x') \| round(1) }}"`. |
| `decimals`, `unit` | Number formatting. Without them, Home Assistant's own formatting is used. |
| `color` | Value colour. |
| `color_attribute` | Take the value colour from an attribute. |
| `colors` | Colour per value, e.g. `{ Blue: "#89b4fa", Red: "#f38ba8" }`. |
| `show_condition` | `weather` chip: also show the translated condition. |
| `tap_action`, `hold_action`, `double_tap_action` | Standard HA actions. Default tap: `more-info`. |
| `visibility` | Conditions like Lovelace: `state`, `numeric_state`, `screen`, `user`, `and`, `or`, `not`. |
| `hide_if_unavailable`, `hide_if_missing` | Hide the chip when the entity is unavailable / does not exist. |

## Translations

Strings live in [`src/i18n.js`](src/i18n.js). Copy the `en` block, translate it, open a pull request.

## Development

```bash
npm install
npm test        # builds dist/ and runs the tests (Node 20+)
```

Edit files in `src/`; `dist/dynamic-home-card.js` is generated by `npm run build` and committed for HACS.

## License

GPL-3.0-or-later. Contains code from Aurora Glass v3 © 2026 DomotikPro.it (Luca Pinelli), GPL-3.0 — see [NOTICE.md](NOTICE.md).
