import { redirect } from "react-router";
import { AVAILABLE_LANGUAGES } from "~/lib/i18n.constants";
import { languageCookie } from "~/services/cookies/language.cookie.server";
import type { Route } from "../+types/root";

/**
 * `?lang=ar|fr|en` on a first visit (no `lng` cookie yet) saves that language
 * as the user's preference and redirects to `/`. Once a preference exists the
 * param is ignored, so a shared link never overrides a returning user's choice.
 */
export const langParamMiddleware: Route.MiddlewareFunction = async ({ request }) => {
  const lang = new URL(request.url).searchParams.get("lang");
  if (!lang || !AVAILABLE_LANGUAGES.includes(lang)) return;

  const saved = await languageCookie.parse(request.headers.get("Cookie"));
  if (saved) return;

  throw redirect("/", {
    headers: { "Set-Cookie": await languageCookie.serialize(lang) },
  });
};
