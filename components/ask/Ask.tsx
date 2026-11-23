import { getTranslations } from "next-intl/server";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ChatPlaceholder } from "@/components/chat/ChatPlaceholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { features } from "@/lib/features";
import { HowItWorks } from "./HowItWorks";

export async function Ask() {
  const t = await getTranslations("ask");

  return (
    <Section id="ask" surface className="md:py-[72px]" aria-labelledby="ask-title">
      <div className="flex flex-col gap-8">
        <SectionHeading id="ask-title" title={t("title")} subtitle={t("subtitle")} />
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            {features.chatEnabled ? <ChatPanel /> : <ChatPlaceholder />}
            <p className="text-[13px] text-muted">{t("note")}</p>
          </div>
          <HowItWorks />
        </div>
      </div>
    </Section>
  );
}
