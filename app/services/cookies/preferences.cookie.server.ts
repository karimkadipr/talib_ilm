import { createCookie } from "react-router";

// Display preferences (set by the set-preferences action). A cookie rather than localStorage so the
// server renders the right sidebar and home page on the first request.
export const preferencesCookie = createCookie("prefs", {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
});

export type Preferences = {
  /** Show the weekly programme (Programme and Today pages). On unless turned off. */
  programme: boolean;
};

export async function getPreferences(request: Request): Promise<Preferences> {
  const stored = await preferencesCookie.parse(request.headers.get("Cookie"));
  return { programme: stored?.programme !== false };
}
