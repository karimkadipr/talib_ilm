import "i18next";
import { initReactI18next } from "react-i18next";
import { createI18nextMiddleware } from "remix-i18next";
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from "~/lib/i18n.constants";
import resources from "~/locales";
import { languageCookie } from "~/services/cookies/language.cookie.server";

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: AVAILABLE_LANGUAGES, // fallback should be last
      fallbackLanguage: DEFAULT_LANGUAGE,
      cookie: languageCookie, // cookie to store the user preference
    },
    i18next: {
      resources,
      defaultNS: "common",
      fallbackNS: "common",
      ns: ["common"],
    },
    plugins: [initReactI18next],
  });

// Adds type-safety to the `t` function — `en` is the source of truth.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: (typeof resources)["en"];
  }
}
