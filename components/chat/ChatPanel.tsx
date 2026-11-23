import { getLocale, getTranslations } from "next-intl/server";
import { site } from "@/lib/site";
import { Chat, type ChatStrings } from "./Chat";

const KEYS = [
  "title",
  "subtitle",
  "counter",
  "welcome",
  "writing",
  "sources",
  "fallback",
  "contactJan",
  "askElse",
  "errorTitle",
  "errorBody",
  "invalidTitle",
  "invalidBody",
  "retry",
  "limitTitle",
  "limitBody",
  "dailyTitle",
  "dailyBody",
  "limitLink",
  "label",
  "placeholder",
  "limitPlaceholder",
  "send",
  "stop",
  "hint",
] as const satisfies readonly Exclude<keyof ChatStrings, "chips">[];

/**
 * Server wrapper: passes only the chat strings to the client component (raw, with their
 * {placeholders}), so the page does not ship the whole dictionary.
 */
export async function ChatPanel() {
  const t = await getTranslations("chat");
  const locale = await getLocale();
  const strings = Object.fromEntries(KEYS.map((k) => [k, t.raw(k) as string])) as Omit<
    ChatStrings,
    "chips"
  >;
  const limit = Number(process.env.RATE_LIMIT_PER_HOUR) || 10;

  return (
    <Chat
      strings={{ ...strings, chips: t.raw("chips") as string[] }}
      locale={locale}
      email={site.email}
      limit={limit}
    />
  );
}
