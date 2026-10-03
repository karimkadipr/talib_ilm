// Feature flags
export const ENABLED_MULTI_LANGUAGES = true;

// Languages — the default language MUST be listed last (remix-i18next uses the
// last entry as the fallback during detection).
export const DEFAULT_LANGUAGE = "en";
export const AVAILABLE_LANGUAGES = ["fr", "ar", DEFAULT_LANGUAGE];

export function getLanguageOrFallback(lang?: string) {
  if (!ENABLED_MULTI_LANGUAGES) return DEFAULT_LANGUAGE;
  if (lang && AVAILABLE_LANGUAGES.includes(lang)) return lang;
  return DEFAULT_LANGUAGE;
}

export function getLanguageLabel(lang: string) {
  const labels: Record<string, string> = {
    en: "English",
    fr: "Français",
    ar: "العربية",
  };
  return labels[lang] ?? lang;
}
