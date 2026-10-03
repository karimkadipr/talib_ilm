import { cn } from "cn";

/** Eight-point star (khatam) mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect x="6" y="6" width="20" height="20" rx="2" className="fill-primary/15 stroke-primary" strokeWidth="1.5" />
      <rect
        x="6"
        y="6"
        width="20"
        height="20"
        rx="2"
        transform="rotate(45 16 16)"
        className="fill-primary/15 stroke-primary"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="3" className="fill-gold" />
    </svg>
  );
}
