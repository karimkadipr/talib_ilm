// Whether the reader has been through the adhkar page's first-visit guide (once for both collections).
// Kept in localStorage; if storage is blocked the guide shows once per tab instead of on every visit.

const KEY = "islamic-studies:adhkar-guide:v1";
let seenThisTab = false;

export const adhkarGuide = {
  seen(): boolean {
    if (seenThisTab) return true;
    try {
      return window.localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  },
  markSeen() {
    seenThisTab = true;
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Storage blocked: remembered for this tab only.
    }
  },
};
