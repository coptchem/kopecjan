import { Icon } from "@/components/ui/Icon";
import type { Source } from "./reducer";

/** Source chips under an answer: the CV opens the PDF, projects open their link or #projects. */
export function SourceChips({ label, items }: { label: string; items: Source[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-1.5 pl-9">
      <span className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
        {label}
      </span>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((s) => {
          const href = s.url ?? "#projects";
          const external = /^https?:/.test(href) || href.endsWith(".pdf");
          return (
            <li key={s.title}>
              <a
                href={href}
                {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-text no-underline hover:border-accent hover:text-accent"
              >
                <Icon name="file" size={13} />
                {s.title}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
