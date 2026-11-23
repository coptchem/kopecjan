/**
 * Streaming post-processing of the model output (docs/04-rag-spec.md, Response handling):
 *
 * - the first characters are held back until it is clear the answer is not NO_ANSWER
 * - the last line is held back until the stream ends, so a "SOURCES: 1, 3" line never
 *   reaches the visitor and can be parsed into source chips
 * - em and en dashes are replaced, in case the model uses one anyway
 */
import { NO_ANSWER } from "./prompt";

const SOURCES_LINE = /^\s*SOURCES:\s*([\d,\s]*)\s*$/i;
const HOLD_START = NO_ANSWER.length + 2;

export function cleanDashes(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ", ").replace(/,\s*,/g, ",");
}

export type ParseResult = { kind: "answer"; sources: number[] | null } | { kind: "fallback" };

export class AnswerStream {
  private started = false;
  private pending = "";
  private emitted = "";

  constructor(private readonly emit: (text: string) => void) {}

  push(delta: string): void {
    this.pending += delta;
    if (!this.started) {
      const trimmed = this.pending.trimStart();
      if (trimmed.length < HOLD_START && NO_ANSWER.startsWith(trimmed.slice(0, NO_ANSWER.length))) {
        return;
      }
      if (trimmed.startsWith(NO_ANSWER)) return;
      this.started = true;
      this.pending = trimmed;
    }
    // Hold back from a "SOURCES:" marker (or a tail that could become one) to the end.
    const marker = this.pending.toUpperCase().lastIndexOf("SOURCES:");
    const holdFrom = marker >= 0 ? marker : this.tailStart(this.pending);
    this.flush(this.pending.slice(0, holdFrom));
    this.pending = this.pending.slice(holdFrom);
  }

  end(): ParseResult {
    const rest = this.pending.trim();
    if (!this.started) {
      if (!rest || rest.startsWith(NO_ANSWER)) return { kind: "fallback" };
      this.started = true;
    }
    const match = SOURCES_LINE.exec(rest);
    if (match) {
      const numbers = (match[1] ?? "")
        .split(/[,\s]+/)
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0);
      return { kind: "answer", sources: numbers };
    }
    if (rest) this.flush(this.pending);
    this.pending = "";
    if (!this.emitted.trim()) return { kind: "fallback" };
    return { kind: "answer", sources: null };
  }

  private tailStart(text: string): number {
    const marker = "SOURCES:";
    for (let len = Math.min(marker.length, text.length); len > 0; len--) {
      if (marker.startsWith(text.slice(-len).toUpperCase())) return text.length - len;
    }
    return text.length;
  }

  private flush(text: string): void {
    if (!text) return;
    const clean = cleanDashes(text);
    this.emitted += clean;
    this.emit(clean);
  }
}
