import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import Fetch from "i18next-fetch-backend";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import { DEFAULT_LANGUAGE } from "~/lib/i18n.constants";

async function main() {
  await i18next
    .use(initReactI18next)
    .use(Fetch)
    .use(I18nextBrowserLanguageDetector)
    .init({
      fallbackLng: DEFAULT_LANGUAGE,
      defaultNS: "common",
      fallbackNS: "common",
      ns: ["common"],
      // The server middleware already set the language on the <html> tag, so we
      // only detect from there and don't cache anywhere else.
      detection: { order: ["htmlTag"], caches: [] },
      // Namespaces are served by the loader route below.
      backend: { loadPath: "/api/loaders/locales/{{lng}}/{{ns}}" },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

main().catch((error) => console.error(error));
