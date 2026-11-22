"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";

export function ThemeToggle() {
  const t = useTranslations("nav");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={t("theme")}
      title={t("theme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-transparent text-text transition-colors hover:bg-surface"
    >
      {/* Both icons are rendered and CSS picks one, so there is no hydration flicker. */}
      <Icon name="moon" className="dark:hidden" />
      <Icon name="sun" className="hidden dark:block" />
    </button>
  );
}
