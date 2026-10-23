/* Dynamic Home Card — translations.
   To add a language: copy the "en" block, translate the values, keep the keys.
   Language is picked from the card option `language`, otherwise from the
   Home Assistant user profile (hass.locale.language), falling back to English. */
export const I18N = {
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
      windows: "Window lights", effect_intensity: "Effect intensity",
      show_forecast: "Show forecast", forecast: "Forecast", type: "Forecast type (daily / hourly)",
      position: "Position (right / below)", count: "Days or hours shown", decimals: "Decimals", range_bar: "Min/max bar"
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
      weather_sky: "Le ciel suit la météo", windows: "Fenêtres éclairées", effect_intensity: "Intensité de l'effet",
      show_forecast: "Afficher les prévisions", forecast: "Prévisions", type: "Type (journalières / horaires)",
      position: "Position (à droite / en dessous)", count: "Nombre de jours ou d'heures", decimals: "Décimales", range_bar: "Barre min/max"
    }
  }
};

export function pickLanguage(configLang, hass) {
  const want = (configLang && configLang !== "auto" ? configLang : (hass && hass.locale && hass.locale.language) || (hass && hass.language) || "en");
  const base = String(want).toLowerCase().split(/[-_]/)[0];
  return I18N[base] ? base : "en";
}
