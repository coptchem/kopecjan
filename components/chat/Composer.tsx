import type { RefObject } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ChatStrings } from "./Chat";
import { MAX_LENGTH } from "./constants";

type Props = {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onFocus: () => void;
  streaming: boolean;
  limited: boolean;
  website: string;
  onWebsite: (value: string) => void;
  strings: Pick<
    ChatStrings,
    "label" | "placeholder" | "limitPlaceholder" | "send" | "stop" | "hint"
  >;
};

export function Composer({
  inputRef,
  value,
  onChange,
  onSubmit,
  onStop,
  onFocus,
  streaming,
  limited,
  website,
  onWebsite,
  strings: t,
}: Props) {
  const hasText = value.trim().length > 0;
  const disabled = streaming || limited;

  return (
    <form
      className="flex flex-col gap-2 border-t border-border bg-card px-3.5 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && hasText) onSubmit();
      }}
    >
      <label htmlFor="ask-input" className="sr-only">
        {t.label}
      </label>
      {/* Honeypot: hidden from people and assistive technology, bots tend to fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="ask-website">Website</label>
        <input
          id="ask-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => onWebsite(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          id="ask-input"
          name="question"
          type="text"
          autoComplete="off"
          maxLength={MAX_LENGTH}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={limited ? t.limitPlaceholder : t.placeholder}
          className="h-11 min-w-0 flex-1 rounded-[10px] border border-border bg-surface px-3.5 text-[14px] text-text outline-none placeholder:text-muted focus:border-accent focus:ring-[3px] focus:ring-accent-soft disabled:cursor-not-allowed disabled:text-muted"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={t.stop}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-accent-bg text-on-accent"
          >
            <Icon name="stop" strokeWidth={2} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !hasText}
            aria-label={t.send}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
              hasText && !disabled
                ? "cursor-pointer bg-accent-bg text-on-accent"
                : "cursor-not-allowed bg-chip text-muted"
            }`}
          >
            <Icon name="send" strokeWidth={2} />
          </button>
        )}
      </div>
      <span className="text-[11px] text-muted">{t.hint}</span>
    </form>
  );
}
