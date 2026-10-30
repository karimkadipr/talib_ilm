import { data } from "react-router";
import { getMushaf } from "~/data/mushafs";
import { searchQuran } from "~/data/quran-search.server";
import type { Route } from "./+types/route";

/** The Qur'an search in one riwayah (`?q=2:255`, `?q=ص 50`, `?q=words`), for the search box. */
export async function loader({ params, request }: Route.LoaderArgs) {
  const mushaf = getMushaf(params.mushafId);
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (!mushaf || q.length > 200) return data({ error: "Unknown mushaf or query too long" }, { status: 400 });

  const headers = new Headers();
  if (process.env.NODE_ENV === "production") headers.set("Cache-Control", "max-age=3600, s-maxage=86400");
  return data(searchQuran(mushaf.id, q), { headers });
}
