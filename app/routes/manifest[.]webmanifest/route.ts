import { getLanguageOrFallback } from "~/lib/i18n.constants";
import { getInstance, getLocale } from "~/middleware/i18next";
import type { Route } from "./+types/route";

// Web app manifest (installing the site to a phone's home screen), in the visitor's language.
export async function loader({ context }: Route.LoaderArgs) {
  const lang = getLanguageOrFallback(getLocale(context));
  const { t } = getInstance(context);
  const manifest = {
    name: t("appName"),
    short_name: t("appName"),
    description: t("meta.description"),
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b0f0e",
    theme_color: "#0b0f0e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      // The language comes from a cookie, so don't let a shared cache serve one language to everyone.
      "Cache-Control": "private, no-cache",
    },
  });
}
