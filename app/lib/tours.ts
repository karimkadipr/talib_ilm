// Which first-visit tours the reader has been through (the book text's notes and bookmark).
// Kept in localStorage; if storage is blocked each tour shows once per tab instead of on every visit.

export type TourName = "text";

const KEY = (name: TourName) => `islamic-studies:tour:${name}:v1`;
const seenThisTab = new Set<TourName>();

export const tours = {
  seen(name: TourName): boolean {
    if (seenThisTab.has(name)) return true;
    try {
      return window.localStorage.getItem(KEY(name)) === "1";
    } catch {
      return false;
    }
  },
  markSeen(name: TourName) {
    seenThisTab.add(name);
    try {
      window.localStorage.setItem(KEY(name), "1");
    } catch {
      // Storage blocked: remembered for this tab only.
    }
  },
};
