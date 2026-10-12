import { data } from "react-router";
import { getPreferences, preferencesCookie, type Preferences } from "~/services/cookies/preferences.cookie.server";
import type { Route } from "./+types/route";

/** Sets one or more preferences, each sent as "on" or "off"; the others are kept. */
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const prefs = await getPreferences(request);
  let changed = false;
  for (const key of ["programme", "sideBySide"] as const satisfies (keyof Preferences)[]) {
    const value = formData.get(key);
    if (value === null) continue;
    if (value !== "on" && value !== "off") return data({ success: false }, { status: 400 });
    prefs[key] = value === "on";
    changed = true;
  }
  if (!changed) return data({ success: false }, { status: 400 });
  const headers = new Headers();
  headers.append("Set-Cookie", await preferencesCookie.serialize(prefs));
  return data({ success: true, ...prefs }, { headers });
}
