import { cn } from "cn";
import type { Book } from "~/data/curriculum";

type Props = {
  book: Book;
  hue: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  xs: "w-9 rounded-md text-[9px] p-1",
  sm: "w-14 rounded-lg text-[11px] p-1.5",
  md: "w-28 rounded-xl text-base p-3",
  lg: "w-40 sm:w-48 rounded-2xl text-2xl p-4",
};

/** Typographic cover: the Arabic title set in naskh over the subject's tint. */
export function BookCover({ book, hue, size = "md", className }: Props) {
  return (
    <div
      aria-hidden
      style={{ "--hue": hue } as React.CSSProperties}
      className={cn(
        "relative flex aspect-[3/4] shrink-0 flex-col items-center justify-center overflow-hidden text-center ring-1 ring-white/10 ring-inset",
        "bg-[linear-gradient(160deg,oklch(0.34_0.07_var(--hue))_0%,oklch(0.2_0.04_var(--hue))_100%)]",
        SIZES[size],
        className,
      )}
    >
      <div className="bg-khatam absolute inset-0 opacity-70" />
      {/* Spine highlight */}
      <div className="absolute inset-y-0 start-0 w-[6%] bg-white/5" />
      {size !== "xs" && (
        <div className="absolute inset-x-[12%] top-[10%] h-px bg-[oklch(0.84_0.12_85/0.5)]" />
      )}
      <span
        dir="rtl"
        className="font-arabic relative line-clamp-4 leading-snug text-[oklch(0.95_0.03_var(--hue))]"
      >
        {size === "xs" ? book.title.ar.split(" ")[0] : book.title.ar}
      </span>
      {(size === "md" || size === "lg") && (
        <span
          dir="rtl"
          className="font-arabic relative mt-2 line-clamp-1 text-[0.55em] text-[oklch(0.84_0.12_85/0.85)]"
        >
          {book.author.ar}
        </span>
      )}
      {size !== "xs" && (
        <div className="absolute inset-x-[12%] bottom-[10%] h-px bg-[oklch(0.84_0.12_85/0.5)]" />
      )}
    </div>
  );
}
