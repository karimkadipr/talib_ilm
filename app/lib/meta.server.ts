import type { Localized } from "~/data/curriculum";
import { getLanguageOrFallback } from "~/lib/i18n.constants";
import { localize } from "~/lib/localize";
import type { PageMeta } from "~/lib/meta";
import { getInstance, getLocale } from "~/middleware/i18next";

type Context = Parameters<typeof getInstance>[0];

/**
 * A page's meta in the request's language: "Most specific · … · App name" (the start of a title is
 * what stays visible in a narrow tab), with the app's description unless the page has its own.
 */
export function seo(context: Context, parts: (string | undefined)[], description?: string): PageMeta {
  const { t } = getInstance(context);
  const siteName = t("appName");
  return {
    title: [...parts.filter(Boolean), siteName].join(" · "),
    description: description ?? t("meta.description"),
    siteName,
  };
}

/** Curriculum data in the request's language, for titles built on the server. */
export function localizer(context: Context) {
  const lang = getLanguageOrFallback(getLocale(context));
  return {
    l: (value: Localized) => localize(value, lang),
    num: (n: number) => new Intl.NumberFormat(lang).format(n),
    t: getInstance(context).t,
  };
}
