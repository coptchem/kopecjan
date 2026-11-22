import type { ReactNode } from "react";

type Props = { children: ReactNode; size?: "sm" | "md"; className?: string };

/** Chip / tag with --chip fill. sm = 12px (cards), md = 13px (skills). */
export function Tag({ children, size = "sm", className = "" }: Props) {
  const sizing = size === "sm" ? "px-[9px] py-1 text-[12px]" : "px-2.5 py-[5px] text-[13px]";
  return (
    <span
      className={`inline-block rounded-full bg-chip font-medium text-text ${sizing} ${className}`}
    >
      {children}
    </span>
  );
}

/** Small accent badge (SaaS, Beta, RAG). */
export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full bg-accent-soft px-2 py-[3px] text-[11px] font-semibold text-accent ${className}`}
    >
      {children}
    </span>
  );
}
