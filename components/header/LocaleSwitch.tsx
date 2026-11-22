"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

const options: { locale: Locale; label: string }[] = [
  { locale: "cs", label: "CZ" },
  { locale: "en", label: "EN" },
];

export function LocaleSwitch() {
  const t = useTranslations("nav");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="flex overflow-hidden rounded-lg border border-border text-[12px] font-semibold"
    >
      {options.map(({ locale, label }) => {
        const active = locale === current;
        const tone = active ? "bg-accent-soft text-accent" : "text-muted hover:text-accent";
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={locale}
            prefetch={false}
            aria-current={active ? "true" : undefined}
            className={`flex h-8 items-center px-2.5 no-underline transition-colors ${tone}`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
