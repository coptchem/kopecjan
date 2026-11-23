import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge, Tag } from "@/components/ui/Tag";
import type { ProjectItem } from "@/lib/messages";

export async function Projects() {
  const t = await getTranslations("projects");
  const items = t.raw("items") as ProjectItem[];

  return (
    <Section id="projects" lazy aria-labelledby="projects-title">
      <div className="flex flex-col gap-7">
        <SectionHeading id="projects-title" title={t("title")} subtitle={t("subtitle")} />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((item) => {
            const internal = item.href?.startsWith("#") ?? false;
            return (
              <Card as="article" lift key={item.name} className="flex flex-col gap-3.5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[18px] font-semibold">{item.name}</h3>
                  <Badge>{item.badge}</Badge>
                </div>
                <p className="flex-1 text-[14px] leading-[1.55] text-muted">{item.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
                {item.href && item.linkLabel && (
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent no-underline hover:underline"
                    {...(internal ? {} : { target: "_blank", rel: "noopener" })}
                  >
                    {item.linkLabel}
                    <Icon name={internal ? "arrowUp" : "arrowUpRight"} size={14} strokeWidth={2} />
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
