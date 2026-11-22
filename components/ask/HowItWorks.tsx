import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { Step } from "@/lib/messages";

export async function HowItWorks() {
  const t = await getTranslations("ask");
  const steps = t.raw("steps") as Step[];
  const tags = t.raw("tags") as string[];

  return (
    <Card as="aside" aria-label={t("howTitle")} className="flex flex-col gap-[18px] p-6">
      <h3 className="text-[16px] font-semibold">{t("howTitle")}</h3>
      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={step.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                    last ? "bg-accent-bg text-on-accent" : "bg-accent-soft text-accent"
                  }`}
                >
                  {i + 1}
                </span>
                {!last && (
                  <span aria-hidden="true" className="min-h-[18px] w-0.5 flex-1 bg-border" />
                )}
              </div>
              <div className={last ? "" : "pb-4"}>
                <p className="text-[14px] font-semibold">{step.title}</p>
                <p className="mt-0.5 text-[13px] leading-[1.5] text-muted">{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-1.5 border-t border-border pt-3.5">
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </Card>
  );
}
