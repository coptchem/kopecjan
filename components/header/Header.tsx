import { getTranslations } from "next-intl/server";
import { LocaleSwitch } from "./LocaleSwitch";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";
import { navItems } from "./nav-items";

export async function Header() {
  const t = await getTranslations("nav");

  return (
    <header id="top" className="relative border-b border-border bg-bg">
      <div className="container-site flex h-[68px] items-center justify-between gap-6">
        <a
          href="#top"
          className="flex items-center gap-2 text-[18px] font-bold tracking-[-0.01em] text-text no-underline"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-[3px] bg-accent-bg"
          />
          kopecjan
        </a>

        <nav aria-label={t("menu")} className="hidden gap-7 text-[14px] font-medium md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-muted no-underline transition-colors hover:text-accent"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <LocaleSwitch />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
