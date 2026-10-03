import { data } from "react-router";
import { AVAILABLE_LANGUAGES } from "~/lib/i18n.constants";
import { languageCookie } from "~/services/cookies/language.cookie.server";
import type { Route } from "./+types/route";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const locale = formData.get("locale");
  if (typeof locale !== "string" || !AVAILABLE_LANGUAGES.includes(locale)) {
    return data({ success: false }, { status: 400 });
  }
  const headers = new Headers();
  headers.append("Set-Cookie", await languageCookie.serialize(locale));
  return data({ success: true, locale }, { headers });
}
