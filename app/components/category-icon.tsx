import { AudioLines, BookCheck, BookOpen, BookOpenText, ScrollText } from "lucide-react";
import { DuaHandsIcon } from "~/components/dua-hands-icon";

const icons: Record<string, typeof BookOpen> = {
  adhkar: DuaHandsIcon as typeof BookOpen,
  quran: BookOpenText,
  recitation: AudioLines,
  tafsir: ScrollText,
  hifz: BookCheck,
};

/** The icon of a category (sidebar, tab bar, home page, a section's sub-section cards). */
export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = icons[id] ?? BookOpen;
  return <Icon className={className} />;
}
