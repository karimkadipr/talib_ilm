import { data } from "react-router";
import { getMushafText } from "~/data/mushaf.server";
import { getMushaf } from "~/data/mushafs";
import type { Route } from "./+types/route";

/** Some ayat's words (without their numbers), by "surah:ayah" in the riwayah (`?refs=2:255,2:256`). */
export async function loader({ params, request }: Route.LoaderArgs) {
  const mushaf = getMushaf(params.mushafId);
  const refs = (new URL(request.url).searchParams.get("refs") ?? "").split(",").filter(Boolean);
  if (!mushaf || refs.length > 200) return data({ error: "Unknown mushaf or too many ayahs" }, { status: 400 });

  const text = getMushafText(mushaf.id);
  const ayahs: Record<string, string> = {};
  for (const ref of refs) {
    const [surah, n] = ref.split(":").map(Number);
    const a = text[surah - 1]?.ayahs[n - 1];
    if (a) ayahs[ref] = a.text.replace(/\s*[٠-٩]+$/, "");
  }
  const headers = new Headers();
  if (process.env.NODE_ENV === "production") headers.set("Cache-Control", "max-age=86400, s-maxage=604800");
  return data(ayahs, { headers });
}
