import { useFetcher, useRouteLoaderData } from "react-router";

const ACTION = "/api/actions/set-preferences";
const FETCHER_KEY = "set-preferences";

/** Display preferences from the root loader, with a pending change applied straight away. */
export function usePreferences() {
  const root = useRouteLoaderData("root") as { programme?: boolean; sideBySide?: boolean } | undefined;
  const fetcher = useFetcher({ key: FETCHER_KEY });
  const pending = (key: string) => fetcher.formData?.get(key);
  const programme = pending("programme");
  const sideBySide = pending("sideBySide");
  return {
    programme: programme ? programme === "on" : root?.programme !== false,
    sideBySide: sideBySide ? sideBySide === "on" : root?.sideBySide === true,
  };
}

function useSetPreference(key: "programme" | "sideBySide") {
  const fetcher = useFetcher({ key: FETCHER_KEY });
  return (on: boolean) => fetcher.submit({ [key]: on ? "on" : "off" }, { method: "post", action: ACTION });
}

export const useSetProgramme = () => useSetPreference("programme");
export const useSetSideBySide = () => useSetPreference("sideBySide");
