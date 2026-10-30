import { getMushaf, type MushafId } from "~/data/mushafs";

// The riwayah the reader chose for Tafsīr and Memorization: Ḥafṣ until they switch. A plain cookie,
// written in the browser when they switch, so the server opens their riwayah as soon as they enter
// either section.

const COOKIE = "riwayah";

export function preferredRiwayah(cookieHeader: string | null): MushafId {
  const id = cookieHeader?.match(/(?:^|;\s*)riwayah=([a-z]+)/)?.[1];
  return getMushaf(id)?.id ?? "hafs";
}

export function chooseRiwayah(id: MushafId) {
  document.cookie = `${COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
