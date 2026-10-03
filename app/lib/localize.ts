import { useTranslation } from "react-i18next";
import type { Localized } from "~/data/curriculum";

/** Picks the right string from curriculum data for the current language. */
export function useLocalize() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;
  const isAr = lang === "ar";

  function l(value: Localized) {
    if (isAr) return value.ar;
    if (lang === "fr") return value.fr ?? value.en;
    return value.en;
  }

  const numberFormat = new Intl.NumberFormat(lang);
  const num = (n: number) => numberFormat.format(n);

  function duration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return t("duration.m", { m: num(m) });
    if (!m) return t("duration.h", { h: num(h) });
    return t("duration.hm", { h: num(h), m: num(m) });
  }

  return { l, isAr, lang, num, duration, t };
}
