import { data } from "react-router";
import { z } from "zod";
import resources from "~/locales";
import type { Route } from "./+types/route";

const locales = Object.keys(resources) as [
  keyof typeof resources,
  ...Array<keyof typeof resources>,
];

export async function loader({ params }: Route.LoaderArgs) {
  const lng = z.enum(locales).safeParse(params.lng);
  if (lng.error) return data({ error: lng.error.message }, { status: 400 });

  const namespaces = resources[lng.data];
  const namespaceKeys = Object.keys(namespaces) as [
    keyof typeof namespaces,
    ...Array<keyof typeof namespaces>,
  ];

  const ns = z.enum(namespaceKeys).safeParse(params.ns);
  if (ns.error) return data({ error: ns.error.message }, { status: 400 });

  const headers = new Headers();
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Cache-Control",
      "max-age=300, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800",
    );
  }
  return data(namespaces[ns.data], { headers });
}
