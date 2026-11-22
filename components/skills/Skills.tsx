import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Tag } from "@/components/ui/Tag";
import type { SkillGroup } from "@/lib/messages";

export async function Skills() {
  const t = await getTranslations("skills");
  const groups = t.raw("groups") as SkillGroup[];

  return (
    <Section id="skills" surface lazy aria-labelledby="skills-title">
      <div className="flex flex-col gap-7">
        <SectionHeading id="skills-title" title={t("title")} subtitle={t("subtitle")} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.name} radius={14} className="flex flex-col gap-2.5 px-5 py-[18px]">
              <p className="text-[13px] font-semibold text-accent">{group.name}</p>
              <ul className="flex flex-wrap gap-1.5">
                {group.tags.map((tag) => (
                  <li key={tag}>
                    <Tag size="md">{tag}</Tag>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}
