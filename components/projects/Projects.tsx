import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge, Tag } from "@/components/ui/Tag";
import type { ExternalLink, ProjectItem } from "@/lib/messages";
import { ProjectsCarousel } from "./ProjectsCarousel";

export async function Projects() {
  const t = await getTranslations("projects");
  const items = t.raw("items") as ProjectItem[];
  const clientSites = t.raw("clientSites") as ExternalLink[];

  return (
    <Section id="projects" lazy aria-labelledby="projects-title">
      <div className="flex flex-col gap-7">
        <SectionHeading id="projects-title" title={t("title")} subtitle={t("subtitle")} />
        <ProjectsCarousel
          labels={{
            region: t("title"),
            prev: t("prev"),
            next: t("next"),
            pause: t("pause"),
            play: t("play"),
          }}
          aside={
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
              <span>{t("clientSitesTitle")}</span>
              {clientSites.map((site) => (
                <a
                  key={site.href}
                  href={site.href}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 font-semibold text-accent no-underline hover:underline"
                >
                  {site.label}
                  <Icon name="arrowUpRight" size={14} strokeWidth={2} />
                </a>
              ))}
            </p>
          }
        >
          {items.map((item) => {
            const internal = item.href?.startsWith("#") ?? false;
            return (
              <Card as="article" lift key={item.name} className="flex w-full flex-col gap-3.5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[18px] font-semibold">{item.name}</h3>
                  <Badge>{item.badge}</Badge>
                </div>
                <p className="flex-1 text-[14px] leading-[1.55] text-muted">{item.desc}</p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                )}
                {((item.href && item.linkLabel) || item.repo) && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {item.href && item.linkLabel && (
                      <a
                        href={item.href}
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent no-underline hover:underline"
                        {...(internal ? {} : { target: "_blank", rel: "noopener" })}
                      >
                        {item.linkLabel}
                        <Icon
                          name={internal ? "arrowUp" : "arrowUpRight"}
                          size={14}
                          strokeWidth={2}
                        />
                      </a>
                    )}
                    {item.repo && (
                      <a
                        href={item.repo}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent no-underline hover:underline"
                      >
                        <Icon name="github" size={14} />
                        {t("sourceCode")}
                      </a>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </ProjectsCarousel>
      </div>
    </Section>
  );
}
