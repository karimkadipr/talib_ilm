import { createCookie } from "react-router";

// Stores the user's locale preference (set by the set-locale action).
export const languageCookie = createCookie("lng", {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
});
