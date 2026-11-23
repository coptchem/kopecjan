import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ButtonLink, IconLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/lib/site";

export async function Hero() {
  const t = await getTranslations("hero");
  const locale = await getLocale();
  const cvHref = site.cv[locale === "cs" ? "cs" : "en"];
  const mailto = "mailto:" + site.email;

  return (
    <section className="pt-14 pb-14 md:pt-[88px] md:pb-[72px]">
      <div className="container-site grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_300px] md:gap-14">
        {/* The fade runs on the text only: the photo is the LCP element and must paint at once. */}
        <div className="fade-in order-2 flex flex-col gap-5 md:order-1">
          <p className="text-[14px] font-semibold tracking-[0.02em] text-accent">{t("eyebrow")}</p>
          <h1 className="text-[40px] leading-[1.05] font-bold tracking-[-0.03em] md:text-[56px]">
            {t("name")}
          </h1>
          <p className="max-w-[600px] text-[19px] leading-[1.55] text-muted">{t("intro")}</p>
          <p className="flex items-center gap-2 text-[14px] text-muted">
            <Icon name="pin" size={16} />
            {t("location")}
          </p>
          <div className="mt-2 flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
            <ButtonLink href="#ask" variant="primary">
              <Icon name="sparkle" />
              {t("ctaAsk")}
            </ButtonLink>
            <ButtonLink href={cvHref} variant="secondary" download>
              <Icon name="download" />
              {t("ctaCv")}
            </ButtonLink>
            <div className="flex gap-1.5 md:ml-1">
              <IconLink
                href={site.linkedin}
                aria-label={t("linkedin")}
                rel="me noopener"
                target="_blank"
              >
                <Icon name="linkedin" />
              </IconLink>
              <IconLink
                href={site.github}
                aria-label={t("github")}
                rel="me noopener"
                target="_blank"
              >
                <Icon name="github" />
              </IconLink>
              <IconLink href={mailto} aria-label={t("email")}>
                <Icon name="mail" />
              </IconLink>
            </div>
          </div>
        </div>
        <div className="order-1 justify-self-start md:order-2 md:justify-self-end">
          <Image
            src="/jan-kopecky.jpg"
            alt={t("name")}
            width={280}
            height={280}
            priority
            fetchPriority="high"
            decoding="sync"
            sizes="280px"
            className="h-[280px] w-[280px] rounded-3xl border border-border object-cover"
          />
        </div>
      </div>
    </section>
  );
}
