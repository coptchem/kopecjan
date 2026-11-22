import { defineRouting } from "next-intl/routing";

export const locales = ["en", "cs"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeCookie: { name: "NEXT_LOCALE" },
  // hreflang links are emitted once, from generateMetadata, not also as a Link header.
  alternateLinks: false,
});

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
