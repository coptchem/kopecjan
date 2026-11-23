import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Tag } from "@/components/ui/Tag";
import type { Education, Job } from "@/lib/messages";

/**
 * Timeline of jobs as native <details> collapsibles (no JavaScript needed),
 * the first one open by default, plus Education and Languages cards.
 */
export async function Experience() {
  const t = await getTranslations("experience");
  const jobs = t.raw("jobs") as Job[];
  const education = t.raw("education") as Education[];
  const languages = t.raw("languages") as string[];

  return (
    <Section id="experience" lazy aria-labelledby="experience-title">
      <div className="flex flex-col gap-7">
        <SectionHeading id="experience-title" title={t("title")} subtitle={t("subtitle")} />

        <div className="relative flex max-w-[820px] flex-col gap-2 pl-7 md:pl-9">
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-border" />
          {jobs.map((job, i) => (
            <details
              key={job.title}
              open={i === 0}
              className="group relative border-b border-border pt-3.5 pb-[18px]"
            >
              <span
                aria-hidden="true"
                className={`absolute top-[22px] -left-7 box-border h-4 w-4 rounded-full border-[3px] border-bg md:-left-9 ${
                  i === 0 ? "bg-accent-bg" : "bg-border"
                }`}
              />
              <summary className="flex cursor-pointer items-start justify-between gap-4 rounded-md">
                <span className="flex flex-col gap-[3px]">
                  <span className="text-[17px] font-semibold">{job.title}</span>
                  <span className="text-[14px] text-muted">
                    {job.org}
                    {job.link && (
                      <>
                        {", "}
                        <a
                          href={job.link.href}
                          target="_blank"
                          rel="noopener"
                          className="font-semibold text-accent no-underline hover:underline"
                        >
                          {job.link.label}
                        </a>
                      </>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <span className="text-[13px] font-semibold whitespace-nowrap text-accent">
                    {job.period}
                  </span>
                  <Icon
                    name="chevron"
                    size={16}
                    strokeWidth={2}
                    className="text-muted transition-transform duration-200 group-open:rotate-180"
                  />
                </span>
              </summary>
              <ul className="mt-3 flex list-disc flex-col gap-1 pl-[18px] text-[14px] leading-[1.6] text-muted">
                {job.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <div className="grid max-w-[820px] grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2.5 rounded-[14px] border border-border px-5 py-[18px]">
            <p className="text-[13px] font-semibold text-accent">{t("educationTitle")}</p>
            {education.map((edu) => (
              <p key={edu.degree} className="text-[14px] leading-[1.5]">
                <strong className="font-semibold">{edu.degree}</strong>
                <br />
                <span className="text-muted">{edu.school}</span>
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 rounded-[14px] border border-border px-5 py-[18px]">
            <p className="text-[13px] font-semibold text-accent">{t("languagesTitle")}</p>
            <ul className="flex flex-wrap gap-1.5">
              {languages.map((lang) => (
                <li key={lang}>
                  <Tag size="md">{lang}</Tag>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
