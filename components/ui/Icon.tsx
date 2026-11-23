import type { SVGProps } from "react";

export type IconName =
  | "sparkle"
  | "download"
  | "pin"
  | "mail"
  | "linkedin"
  | "github"
  | "sun"
  | "moon"
  | "menu"
  | "close"
  | "arrowUpRight"
  | "arrowUp"
  | "arrowRight"
  | "chevron"
  | "send"
  | "stop"
  | "retry"
  | "clock"
  | "alert"
  | "file";

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

const strokeIcons: Partial<Record<IconName, string>> = {
  sparkle:
    "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  pin: "M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z M14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  mail: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 7l9 6 9-6",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  arrowUpRight: "M7 17L17 7M9 7h8v8",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  chevron: "M6 9l6 6 6-6",
  send: "M5 12h14M13 6l6 6-6 6",
  retry: "M21 12a9 9 0 1 1-2.6-6.4 M21 3v6h-6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2",
  alert: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8v4M12 16h.01",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5",
};

const fillIcons: Partial<Record<IconName, string>> = {
  github:
    "M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3",
  linkedin:
    "M6.5 8.5h-3V21h3V8.5zM5 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM21 13.3c0-3.3-1.8-5-4.3-5-1.6 0-2.7.9-3.2 1.7V8.5h-3V21h3v-6.5c0-1.7.8-2.8 2.3-2.8 1.4 0 2.1 1 2.1 2.8V21h3v-7.7z",
  stop: "M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z",
};

/** Inline SVG icons from the design: 1.8px stroke, 24px viewBox. Decorative by default. */
export function Icon({ name, size = 18, strokeWidth = 1.8, ...rest }: Props) {
  const fill = fillIcons[name];
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
  if (fill) {
    return (
      <svg {...common} fill="currentColor">
        <path d={fill} />
      </svg>
    );
  }
  return (
    <svg
      {...common}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={strokeIcons[name]} />
    </svg>
  );
}
