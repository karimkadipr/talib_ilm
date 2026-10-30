import { CoachMarks, visible } from "~/components/coach-marks";
import { useLocalize } from "~/lib/localize";

/**
 * The first visit to the muṣḥaf: search, turning pages, then tapping an ayah for its tafsīr, which the
 * reader does for real to finish. The page marks the controls with data-guide.
 */
export function MushafGuide({ hue, searching, ayahOpen }: { hue: number; searching: boolean; ayahOpen: boolean }) {
  const { t } = useLocalize();
  const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  return (
    <CoachMarks
      storageKey="islamic-studies:mushaf-guide:v1"
      hue={hue}
      paused={searching || ayahOpen}
      completed={ayahOpen}
      steps={[
        { id: "search", target: () => visible("[data-guide='search']"), title: t("mushafGuide.searchTitle"), body: t("mushafGuide.search") },
        {
          id: "pages",
          target: () => visible("[data-guide='pages']"),
          title: t("mushafGuide.pagesTitle"),
          body: touch ? t("mushafGuide.pagesTouch") : t("mushafGuide.pagesKeys"),
        },
        { id: "ayah", target: () => visible("article [id^='ayah-']"), title: t("mushafGuide.ayahTitle"), body: t("mushafGuide.ayah") },
      ]}
    />
  );
}
