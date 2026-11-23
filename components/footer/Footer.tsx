import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-bg">
      <div className="container-site flex flex-col items-start gap-2.5 py-6 text-[13px] text-muted md:flex-row md:items-center md:justify-between md:gap-4">
        <span>{t("copyright", { year })}</span>
        <div className="flex flex-wrap gap-[18px]">
          <a href={site.url} className="text-muted no-underline hover:text-accent">
            {t("site")}
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="me noopener"
            className="text-muted no-underline hover:text-accent"
          >
            {t("linkedin")}
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="me noopener"
            className="text-muted no-underline hover:text-accent"
          >
            {t("github")}
          </a>
          <a href={"mailto:" + site.email} className="text-muted no-underline hover:text-accent">
            {t("email")}
          </a>
        </div>
      </div>
    </footer>
  );
}
