import { data } from "react-router";
import { getPreferences, preferencesCookie } from "~/services/cookies/preferences.cookie.server";
import type { Route } from "./+types/route";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const programme = formData.get("programme");
  if (programme !== "on" && programme !== "off") {
    return data({ success: false }, { status: 400 });
  }
  const prefs = { ...(await getPreferences(request)), programme: programme === "on" };
  const headers = new Headers();
  headers.append("Set-Cookie", await preferencesCookie.serialize(prefs));
  return data({ success: true, ...prefs }, { headers });
}
