/**
 * Parsing and chunking of the markdown documents in content/ (see docs/04-rag-spec.md).
 * Pure functions, shared by scripts/build-index.ts and the unit tests.
 */

export const KINDS = ["cv", "project", "experience", "faq", "how-i-work", "about"] as const;
export type Kind = (typeof KINDS)[number];
export type Lang = "en" | "cs";

export type FrontMatter = {
  title: string;
  slug: string;
  lang: Lang;
  kind: Kind;
  url?: string;
  priority: number;
  draft: boolean;
};

export type Doc = FrontMatter & { body: string; file: string };

export type RawChunk = {
  slug: string;
  title: string;
  kind: Kind;
  lang: Lang;
  url?: string;
  priority: number;
  heading: string;
  text: string;
};

/** Minimal front matter reader: flat `key: value` pairs, which is all docs/06 uses. */
export function parseDocument(source: string, file: string): Doc {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`${file}: missing front matter`);
  const fields: Record<string, string> = {};
  for (const line of (match[1] ?? "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx < 0) throw new Error(`${file}: bad front matter line "${trimmed}"`);
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .replace(/\s+#.*$/, "")
      .trim()
      .replace(/^["']|["']$/g, "");
    fields[key] = value;
  }

  for (const key of ["title", "slug", "lang", "kind"]) {
    if (!fields[key]) throw new Error(`${file}: front matter is missing "${key}"`);
  }
  const lang = fields.lang;
  if (lang !== "en" && lang !== "cs") throw new Error(`${file}: lang must be en or cs`);
  const kind = fields.kind as Kind;
  if (!KINDS.includes(kind)) throw new Error(`${file}: unknown kind "${fields.kind}"`);
  if (!/^[a-z0-9-]+$/.test(fields.slug ?? "")) throw new Error(`${file}: slug must be kebab-case`);
  const priority = fields.priority ? Number(fields.priority) : 0;
  if (!Number.isFinite(priority) || priority < 0 || priority > 2) {
    throw new Error(`${file}: priority must be 0, 1 or 2`);
  }

  return {
    title: fields.title!,
    slug: fields.slug!,
    lang,
    kind,
    url: fields.url || undefined,
    priority,
    draft: fields.draft === "true",
    body: match[2] ?? "",
    file,
  };
}

/** Rough token estimate (about 4 characters per token), good enough for chunk sizing. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const MIN_TOKENS = 80;
const MAX_TOKENS = 400;

type Section = { path: string[]; paragraphs: string[]; qa: boolean };

/**
 * Splits a document on ## and ### headings, then on blank lines inside a section.
 * Small paragraphs are merged up to MAX_TOKENS; a "### Q:" section is never split.
 */
export function chunkDocument(doc: Doc): RawChunk[] {
  const sections: Section[] = [];
  let h2 = "";
  let current: Section = { path: [], paragraphs: [], qa: false };
  let buffer: string[] = [];

  const flushParagraph = () => {
    const text = buffer.join("\n").trim();
    if (text) current.paragraphs.push(text);
    buffer = [];
  };
  const startSection = (path: string[], qa: boolean) => {
    flushParagraph();
    // A ### heading without a body is still a fact (for example a job title with dates).
    if (!current.paragraphs.length && current.path.length > 1) {
      current.paragraphs.push(current.path.at(-1)!);
    }
    if (current.paragraphs.length) sections.push(current);
    current = { path, paragraphs: [], qa };
  };

  for (const line of doc.body.split(/\r?\n/)) {
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      const text = heading[2]!.trim();
      if (level === 1) startSection([], false);
      else if (level === 2) {
        h2 = text;
        startSection([text], false);
      } else {
        const qa = /^Q:/i.test(text);
        startSection(h2 ? [h2, text] : [text], qa);
        if (qa) buffer.push(text);
      }
      continue;
    }
    if (line.trim() === "") flushParagraph();
    else buffer.push(line);
  }
  startSection([], false);

  const chunks: RawChunk[] = [];
  const emit = (path: string[], text: string) => {
    chunks.push({
      slug: doc.slug,
      title: doc.title,
      kind: doc.kind,
      lang: doc.lang,
      url: doc.url,
      priority: doc.priority,
      heading: path.join(" > "),
      text,
    });
  };

  for (const section of sections) {
    if (section.qa) {
      emit(section.path, section.paragraphs.join("\n"));
      continue;
    }
    let acc = "";
    for (const paragraph of section.paragraphs) {
      const joined = acc ? `${acc}\n\n${paragraph}` : paragraph;
      if (acc && estimateTokens(joined) > MAX_TOKENS) {
        emit(section.path, acc);
        acc = paragraph;
      } else {
        acc = joined;
      }
    }
    if (acc) emit(section.path, acc);
  }

  // Merge small chunks into the previous one when both sit under the same ## heading, so that
  // short ### entries (degrees, short jobs) end up together under the section name.
  const top = (heading: string) => heading.split(" > ")[0] ?? "";
  const merged: RawChunk[] = [];
  for (const chunk of chunks) {
    const prev = merged.at(-1);
    const small =
      estimateTokens(chunk.text) < MIN_TOKENS || estimateTokens(prev?.text ?? "") < MIN_TOKENS;
    if (
      prev &&
      top(prev.heading) === top(chunk.heading) &&
      !/Q:/i.test(chunk.heading) &&
      !/Q:/i.test(prev.heading) &&
      small &&
      estimateTokens(`${prev.text}\n\n${chunk.text}`) <= MAX_TOKENS
    ) {
      const sub = chunk.heading.split(" > ").slice(1).join(" > ");
      const prevSub = prev.heading.split(" > ").slice(1).join(" > ");
      if (prev.heading !== top(prev.heading)) {
        prev.text = `${prevSub && prevSub !== prev.text ? `${prevSub}\n` : ""}${prev.text}`;
        prev.heading = top(prev.heading);
      }
      prev.text = `${prev.text}\n\n${sub && sub !== chunk.text ? `${sub}\n` : ""}${chunk.text}`;
    } else {
      merged.push({ ...chunk });
    }
  }
  return merged;
}

/** The text that is embedded: document title and heading path give short chunks context. */
export function embeddingText(chunk: Pick<RawChunk, "title" | "heading" | "text">): string {
  const path = [chunk.title, chunk.heading].filter(Boolean).join(" > ");
  return `${path}\n${chunk.text}`;
}
