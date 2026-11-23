import type { ReactNode } from "react";

type Props = {
  role: "user" | "assistant";
  tone?: "default" | "error";
  children: ReactNode;
};

/** One chat bubble: assistant left with the "AI" tile, visitor right on the accent colour. */
export function Message({ role, tone = "default", children }: Props) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[14px_4px_14px_14px] bg-accent-bg px-3.5 py-2.5 text-[14px] leading-[1.55] break-words text-on-accent">
          {children}
        </div>
      </div>
    );
  }
  const error = tone === "error";
  return (
    <div className="flex max-w-[88%] items-start gap-2.5">
      <span
        aria-hidden="true"
        className={`inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
          error ? "bg-danger text-on-accent" : "bg-accent-bg text-on-accent"
        }`}
      >
        {error ? "!" : "AI"}
      </span>
      <div
        className={`min-w-0 rounded-[4px_14px_14px_14px] border px-3.5 py-2.5 text-[14px] leading-[1.55] break-words ${
          error ? "border-danger bg-danger-soft" : "border-border bg-surface"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
