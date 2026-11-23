"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ask, prepareProof } from "./client";
import { Composer } from "./Composer";
import { Message } from "./Message";
import { initialState, reducer, statusOf, type ErrorKind } from "./reducer";
import { SourceChips } from "./SourceChips";

export type ChatStrings = {
  title: string;
  subtitle: string;
  /** "{used} / {limit} questions" */
  counter: string;
  welcome: string;
  chips: string[];
  writing: string;
  sources: string;
  fallback: string;
  contactJan: string;
  askElse: string;
  errorTitle: string;
  errorBody: string;
  invalidTitle: string;
  invalidBody: string;
  retry: string;
  /** "You have reached the limit of {limit} questions per hour." */
  limitTitle: string;
  /** "... in about {minutes} minutes ..." */
  limitBody: string;
  dailyTitle: string;
  dailyBody: string;
  limitLink: string;
  label: string;
  placeholder: string;
  limitPlaceholder: string;
  send: string;
  stop: string;
  hint: string;
};

type Props = { strings: ChatStrings; locale: string; email: string; limit: number };

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));

export function Chat({ strings: t, locale, email, limit }: Props) {
  const [state, dispatch] = useReducer(reducer, limit, initialState);
  const [website, setWebsite] = useState("");
  const status = statusOf(state);
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.turns, status]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = useCallback(
    async (raw: string) => {
      const question = raw.replace(/\s+/g, " ").trim();
      if (!question || statusOf(state) === "streaming" || state.limit) return;
      const id = nextId.current++;
      const controller = new AbortController();
      abortRef.current = controller;
      dispatch({ type: "ask", id, question });

      try {
        const result = await ask(
          question,
          locale,
          website,
          controller.signal,
          (event) => {
            switch (event.type) {
              case "token":
                dispatch({ type: "token", id, text: event.text });
                break;
              case "sources":
                dispatch({ type: "sources", id, items: event.items });
                break;
              case "fallback":
                dispatch({ type: "fallback", id });
                break;
              case "done":
                dispatch({ type: "done", id });
                break;
              case "error":
                dispatch({
                  type: "error",
                  id,
                  error: event.code === "timeout" ? "timeout" : "upstream",
                });
                break;
            }
          },
          (lim, remaining) => dispatch({ type: "quota", limit: lim, remaining }),
        );
        if (result.kind === "limited") {
          dispatch({
            type: "limited",
            id,
            limit: {
              kind: result.daily ? "daily" : "client",
              retryAfterSeconds: result.retryAfterSeconds,
            },
          });
        } else if (result.kind === "invalid") {
          dispatch({ type: "error", id, error: "invalid" });
        } else if (result.kind === "error") {
          dispatch({ type: "error", id, error: "upstream" });
        } else {
          dispatch({ type: "done", id });
        }
      } catch {
        if (controller.signal.aborted) dispatch({ type: "stopped", id });
        else dispatch({ type: "error", id, error: "network" });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        prepareProof();
      }
    },
    [state, locale, website],
  );

  const stop = () => abortRef.current?.abort();
  const askElse = () => {
    dispatch({ type: "askElse" });
    inputRef.current?.focus();
  };

  const used = state.quota.limit - state.quota.remaining;
  const minutes = Math.max(1, Math.ceil((state.limit?.retryAfterSeconds ?? 0) / 60));
  const showChips = state.turns.length === 0 && status !== "ratelimit";
  const lastTurn = state.turns.at(-1);

  const errorText = (kind: ErrorKind | undefined) =>
    kind === "invalid" ? (
      <>
        <strong className="font-semibold">{t.invalidTitle}</strong> {t.invalidBody}
      </>
    ) : (
      <>
        <strong className="font-semibold">{t.errorTitle}</strong> {t.errorBody}
      </>
    );

  return (
    <div
      className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-card"
      data-testid="chat"
      data-status={status}
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
            <span className="text-[14px] font-semibold">{t.title}</span>
            <span className="text-[12px] text-muted">{t.subtitle}</span>
          </div>
        </div>
        <span
          className="shrink-0 rounded-full bg-chip px-[9px] py-1 text-[11px] font-semibold text-muted"
          data-testid="chat-counter"
        >
          {fill(t.counter, { used, limit: state.quota.limit })}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex max-h-[520px] flex-1 flex-col gap-3.5 overflow-y-auto bg-bg p-[18px]"
        aria-live="polite"
        aria-busy={status === "streaming"}
      >
        <Message role="assistant">{t.welcome}</Message>

        {showChips && (
          <ul className="flex flex-wrap gap-2 pl-9">
            {t.chips.map((chip) => (
              <li key={chip}>
                <button
                  type="button"
                  onClick={() => submit(chip)}
                  className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-border bg-card px-3 py-[7px] text-left text-[13px] font-medium text-text transition-colors hover:border-accent hover:text-accent"
                >
                  {chip}
                </button>
              </li>
            ))}
          </ul>
        )}

        {state.turns.map((turn) => (
          <div key={turn.id} className="flex flex-col gap-3.5">
            <Message role="user">{turn.question}</Message>
            {turn.status === "streaming" && (
              <>
                {turn.answer && (
                  <Message role="assistant">
                    <span className="whitespace-pre-wrap">{turn.answer}</span>
                    <span
                      aria-hidden="true"
                      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-[blink_1s_steps(2,start)_infinite] bg-accent motion-reduce:animate-none"
                    />
                  </Message>
                )}
                <div className="flex items-center gap-2 pl-9 text-[12px] text-muted" role="status">
                  <span aria-hidden="true" className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-[pulse-dot_1.2s_ease-in-out_infinite] rounded-full bg-accent motion-reduce:animate-none"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </span>
                  {t.writing}
                </div>
              </>
            )}
            {turn.status === "answered" && (
              <>
                <Message role="assistant">
                  <span className="whitespace-pre-wrap">{turn.answer}</span>
                </Message>
                <SourceChips label={t.sources} items={turn.sources} />
              </>
            )}
            {turn.status === "fallback" && (
              <div className="flex flex-col gap-2.5">
                <Message role="assistant">{t.fallback}</Message>
                {turn === lastTurn && !state.idle && (
                  <div className="flex flex-wrap gap-2 pl-9">
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent(turn.question.slice(0, 120))}`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] bg-accent-bg px-3 text-[13px] font-semibold text-on-accent no-underline"
                    >
                      <Icon name="mail" size={15} />
                      {t.contactJan}
                    </a>
                    <button
                      type="button"
                      onClick={askElse}
                      className="inline-flex min-h-9 cursor-pointer items-center rounded-[10px] border border-border bg-card px-3 text-[13px] font-semibold text-text hover:border-accent"
                    >
                      {t.askElse}
                    </button>
                  </div>
                )}
              </div>
            )}
            {turn.status === "error" && (
              <div className="flex flex-col gap-2.5">
                <Message role="assistant" tone="error">
                  {errorText(turn.error)}
                </Message>
                {turn === lastTurn && turn.error !== "invalid" && (
                  <div className="pl-9">
                    <button
                      type="button"
                      onClick={() => submit(turn.question)}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border border-border bg-card px-3 text-[13px] font-semibold text-text hover:border-accent"
                    >
                      <Icon name="retry" size={15} />
                      {t.retry}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {state.limit && (
          <div
            role="status"
            className="mt-auto flex items-start gap-2.5 rounded-xl border border-warn bg-warn-soft px-3.5 py-3 text-[14px] leading-[1.5]"
          >
            <Icon name="clock" className="mt-px shrink-0 text-warn" strokeWidth={2} />
            <div className="flex flex-col gap-2">
              <span>
                <strong className="font-semibold">
                  {state.limit.kind === "daily"
                    ? t.dailyTitle
                    : fill(t.limitTitle, { limit: state.quota.limit })}
                </strong>{" "}
                {state.limit.kind === "daily" ? t.dailyBody : fill(t.limitBody, { minutes })}
              </span>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent no-underline"
              >
                {t.limitLink}
                <Icon name="arrowRight" size={13} strokeWidth={2.2} />
              </a>
            </div>
          </div>
        )}
      </div>

      <Composer
        inputRef={inputRef}
        value={state.input}
        onChange={(value) => dispatch({ type: "input", value })}
        onSubmit={() => submit(state.input)}
        onStop={stop}
        onFocus={prepareProof}
        streaming={status === "streaming"}
        limited={status === "ratelimit"}
        website={website}
        onWebsite={setWebsite}
        strings={t}
      />
    </div>
  );
}
