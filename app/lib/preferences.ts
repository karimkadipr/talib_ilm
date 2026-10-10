import { useFetcher, useRouteLoaderData } from "react-router";

const ACTION = "/api/actions/set-preferences";
const FETCHER_KEY = "set-preferences";

/** Display preferences from the root loader, with a pending change applied straight away. */
export function usePreferences() {
  const root = useRouteLoaderData("root") as { programme?: boolean } | undefined;
  const fetcher = useFetcher({ key: FETCHER_KEY });
  const pending = fetcher.formData?.get("programme");
  return { programme: pending ? pending === "on" : root?.programme !== false };
}

export function useSetProgramme() {
  const fetcher = useFetcher({ key: FETCHER_KEY });
  return (on: boolean) => fetcher.submit({ programme: on ? "on" : "off" }, { method: "post", action: ACTION });
}
