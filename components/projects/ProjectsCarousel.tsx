"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type Labels = { region: string; prev: string; next: string; pause: string; play: string };

const INTERVAL_MS = 6000;
const controlClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-border text-text transition-colors hover:bg-surface";

/**
 * Three cards side by side on desktop (one and a bit on mobile), scroll-snapped and swipeable.
 * Advances one card every 6 s; pauses on hover, on keyboard focus, with the pause button,
 * and never autoplays when the visitor prefers reduced motion (WCAG 2.2.2).
 */
export function ProjectsCarousel({
  children,
  labels,
  aside,
}: {
  children: ReactNode;
  labels: Labels;
  /** Shown left of the controls (wraps above them on narrow screens). */
  aside?: ReactNode;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPlaying(!reduce);
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const width = first.offsetWidth + gap;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * width, behavior: "smooth" });
  }, []);

  const active = playing && !hovered && !focused;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") step(1);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active, step]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="flex flex-col gap-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <ul
        ref={track}
        className="no-scrollbar -my-2 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth py-2"
      >
        {Children.map(children, (child) => (
          <li className="flex shrink-0 basis-[85%] snap-start md:basis-[calc((100%-2.5rem)/3)]">
            {child}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>{aside}</div>
        <div className="flex gap-2">
          <button
            type="button"
            className={controlClass}
            aria-label={labels.prev}
            onClick={() => step(-1)}
          >
            <Icon name="chevron" className="rotate-90" />
          </button>
          <button
            type="button"
            className={controlClass}
            aria-label={playing ? labels.pause : labels.play}
            onClick={() => setPlaying((p) => !p)}
          >
            <Icon name={playing ? "pause" : "play"} />
          </button>
          <button
            type="button"
            className={controlClass}
            aria-label={labels.next}
            onClick={() => step(1)}
          >
            <Icon name="chevron" className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}
