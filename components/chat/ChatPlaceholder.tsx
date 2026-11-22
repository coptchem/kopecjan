import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/lib/site";

/**
 * Inactive chat panel shown until the RAG assistant (milestones M2 to M4) is switched on.
 * Same layout as the live Chat component so the section does not jump when it goes live.
 */
export async function ChatPlaceholder() {
  const t = await getTranslations("chat");
  const chips = t.raw("chips") as string[];
  const mailto = "mailto:" + site.email;

  return (
    <div
      className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card"
      data-testid="chat-placeholder"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent-soft text-accent"
          >
            <Icon name="sparkle" />
          </span>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold">{t("title")}</span>
            <span className="text-[12px] text-muted">{t("subtitle")}</span>
          </div>
        </div>
        <span className="rounded-full bg-accent-soft px-[9px] py-1 text-[11px] font-semibold text-accent">
          {t("inactiveBadge")}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 bg-bg p-[18px]">
        <div className="flex max-w-[88%] items-start gap-2.5">
          <span
            aria-hidden="true"
            className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-accent-bg text-[11px] font-bold text-on-accent"
          >
            AI
          </span>
          <div className="rounded-[4px_14px_14px_14px] border border-border bg-surface px-3.5 py-2.5 text-[14px] leading-[1.55]">
            {t("welcome")}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pl-9" aria-hidden="true">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 py-[7px] text-[13px] font-medium text-muted"
            >
              {chip}
            </span>
          ))}
        </div>

        <div
          role="status"
          className="mt-auto flex items-start gap-2.5 rounded-xl border border-accent bg-accent-soft px-3.5 py-3 text-[14px] leading-[1.5]"
        >
          <Icon name="clock" className="mt-px shrink-0 text-accent" strokeWidth={2} />
          <div className="flex flex-col gap-2">
            <span>
              <strong className="font-semibold">{t("inactiveTitle")}</strong> {t("inactiveBody")}
            </span>
            <a
              href={mailto}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent no-underline"
            >
              {t("limitLink")}
              <Icon name="arrowRight" size={13} strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </div>

      <form className="flex flex-col gap-2 border-t border-border bg-card px-3.5 py-3">
        <label htmlFor="ask-input" className="sr-only">
          {t("label")}
        </label>
        <div className="flex items-center gap-2">
          <input
            id="ask-input"
            type="text"
            disabled
            placeholder={t("inactivePlaceholder")}
            className="h-11 min-w-0 flex-1 rounded-[10px] border border-border bg-surface px-3.5 text-[14px] text-muted placeholder:text-muted"
          />
          <button
            type="submit"
            disabled
            aria-label={t("send")}
            className="inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-[10px] bg-chip text-muted"
          >
            <Icon name="send" strokeWidth={2} />
          </button>
        </div>
        <span className="text-[11px] text-muted">{t("hint")}</span>
      </form>
    </div>
  );
}
