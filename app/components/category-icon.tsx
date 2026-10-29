import { AudioLines, BookOpen } from "lucide-react";
import { DuaHandsIcon } from "~/components/dua-hands-icon";

/** The icon of a top-level category (sidebar, tab bar, home page). */
export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = id === "adhkar" ? DuaHandsIcon : id === "quran" ? AudioLines : BookOpen;
  return <Icon className={className} />;
}
