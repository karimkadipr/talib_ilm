import { data } from "react-router";
import { tafsirs } from "~/data/mushafs";
import { surahs } from "~/data/surahs";
import { getTafsir } from "~/data/tafsir.server";
import type { Route } from "./+types/route";

/** An in-app tafsir of some ayat of a surah (`?ayahs=1,2`, in Ḥafṣ's count), for the ayah panel. */
export async function loader({ params, request }: Route.LoaderArgs) {
  const tafsir = tafsirs.find((t) => t.id === params.tafsirId && t.source);
  const surah = surahs[Number(params.surah) - 1];
  const ayahs = (new URL(request.url).searchParams.get("ayahs") ?? "").split(",").map(Number);
  if (!tafsir || !surah || !ayahs.every((n) => Number.isInteger(n) && n >= 1 && n <= surah.ayahs))
    return data({ error: "Unknown tafsir or ayah" }, { status: 400 });

  const headers = new Headers();
  if (process.env.NODE_ENV === "production") {
    headers.set("Cache-Control", "max-age=86400, s-maxage=604800, stale-while-revalidate=604800");
  }
  return data(getTafsir(tafsir.id, surah.n, ayahs), { headers });
}
