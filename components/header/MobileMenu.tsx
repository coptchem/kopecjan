"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { navItems } from "./nav-items";

export function MobileMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? t("close") : t("menu")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-transparent text-text transition-colors hover:bg-surface md:hidden"
      >
        <Icon name={open ? "close" : "menu"} />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-[68px] z-20 border-b border-border bg-bg md:hidden"
      >
        <nav aria-label={t("menu")} className="container-site flex flex-col py-2">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center border-b border-border py-3 text-[15px] font-medium text-text no-underline last:border-b-0"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
