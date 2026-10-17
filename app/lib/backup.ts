import { z } from "zod";

// Backup and restore of everything the app keeps for the listener: every localStorage entry under
// PREFIX (progress, lesson and book notes, bookmarks, favorites, adhkār, playback positions, reader
// and player settings), plus the display preferences and language, which live in cookies. A backup
// is one JSON file; restoring replaces what this browser has, then the page reloads so every store
// reads it afresh.

const PREFIX = "islamic-studies:";

const backupSchema = z.object({
  app: z.literal("islamic-studies"),
  version: z.literal(1),
  exportedAt: z.string(),
  storage: z.record(z.string().startsWith(PREFIX), z.string()),
  preferences: z.object({ programme: z.boolean(), sideBySide: z.boolean() }).optional(),
  locale: z.string().optional(),
});

export type Backup = z.infer<typeof backupSchema>;

function storedKeys() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  return keys;
}

/** Saves a backup file of this browser's data. */
export function downloadBackup(preferences: Backup["preferences"], locale: string) {
  const storage: Record<string, string> = {};
  for (const key of storedKeys()) storage[key] = localStorage.getItem(key) ?? "";
  const now = new Date();
  const backup: Backup = { app: "islamic-studies", version: 1, exportedAt: now.toISOString(), storage, preferences, locale };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  // Local date, so a backup made late in the evening is named for that day.
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  a.download = `islamic-studies-backup-${day}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Reads a backup file; null if it isn't one. */
export async function readBackup(file: File): Promise<Backup | null> {
  try {
    const parsed = backupSchema.safeParse(JSON.parse(await file.text()));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** What a backup holds, for the listener to check before restoring it. */
export function summarize(backup: Backup) {
  const json = (key: string) => {
    try {
      return JSON.parse(backup.storage[PREFIX + key] ?? "null");
    } catch {
      return null;
    }
  };
  const count = (o: unknown) => (o && typeof o === "object" ? Object.keys(o).length : 0);
  const progress = json("progress:v1");
  const favorites = json("quran-favorites:v1");
  const bookNotes = json("book-notes:v1");
  return {
    lessons: count(progress?.watched),
    books: Object.values(progress?.books ?? {}).filter((s) => s === "done").length,
    favorites: Object.values(favorites ?? {}).reduce<number>((n, list) => n + (Array.isArray(list) ? list.length : 0), 0),
    notes:
      Object.values(progress?.notes ?? {}).filter((n) => typeof n === "string" && n.trim()).length +
      Object.values(bookNotes ?? {}).reduce<number>((n, list) => n + count(list), 0),
  };
}

/** Replaces this browser's data with the backup's, including the cookie preferences and language. */
export async function restoreBackup(backup: Backup) {
  for (const key of storedKeys()) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(backup.storage)) localStorage.setItem(key, value);
  const post = (action: string, body: Record<string, string>) =>
    fetch(action, { method: "POST", body: new URLSearchParams(body) }).catch(() => {});
  const p = backup.preferences;
  await Promise.all([
    p && post("/api/actions/set-preferences", { programme: p.programme ? "on" : "off", sideBySide: p.sideBySide ? "on" : "off" }),
    backup.locale && post("/api/actions/set-locale", { locale: backup.locale }),
  ]);
  location.reload();
}
