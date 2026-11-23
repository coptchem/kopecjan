import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/lib/site";

export async function Contact() {
  const t = await getTranslations("contact");
  const locale = await getLocale();
  const cvHref = site.cv[locale === "cs" ? "cs" : "en"];
  const mailto = "mailto:" + site.email;

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="cv-auto border-t border-border bg-surface py-14 md:py-20"
    >
      <div className="container-site">
        <Card
          radius={20}
          className="flex flex-col items-center gap-[18px] px-6 py-10 text-center md:px-10 md:py-12"
        >
          <h2
            id="contact-title"
            className="text-[28px] leading-[1.15] font-bold tracking-[-0.02em] md:text-[36px]"
          >
            {t("title")}
          </h2>
          <p className="max-w-[560px] text-[17px] leading-[1.55] text-muted">{t("subtitle")}</p>
          <div className="mt-1.5 flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:flex-wrap md:justify-center">
            <ButtonLink href={mailto} variant="primary">
              <Icon name="mail" />
              {t("email")}
            </ButtonLink>
            <ButtonLink href={site.linkedin} variant="secondary" target="_blank" rel="me noopener">
              <Icon name="linkedin" />
              {t("linkedin")}
            </ButtonLink>
            <ButtonLink href={site.github} variant="secondary" target="_blank" rel="me noopener">
              <Icon name="github" />
              {t("github")}
            </ButtonLink>
            <ButtonLink href={cvHref} variant="secondary" download>
              <Icon name="download" />
              {t("cv")}
            </ButtonLink>
          </div>
        </Card>
      </div>
    </section>
  );
}
