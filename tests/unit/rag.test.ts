import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chunkDocument, embeddingText, parseDocument } from "@/lib/rag/documents";
import type { IndexChunk } from "@/lib/rag/index";
import { AnswerStream, cleanDashes } from "@/lib/rag/parse";
import { search, selectContext } from "@/lib/rag/retrieve";
import { sanitizeQuestion } from "@/lib/rag/sanitize";

const doc = (front: string, body: string) =>
  parseDocument(`---\n${front}\n---\n${body}`, "test.md");

describe("parseDocument", () => {
  it("reads front matter", () => {
    const d = doc(
      "title: Flatter.cz\nslug: flatter\nlang: en\nkind: project\npriority: 1\ndraft: true",
      "Hi",
    );
    expect(d).toMatchObject({
      title: "Flatter.cz",
      slug: "flatter",
      lang: "en",
      kind: "project",
      priority: 1,
      draft: true,
    });
  });

  it("fails on missing required fields", () => {
    expect(() => doc("title: X\nlang: en\nkind: faq", "")).toThrow(/slug/);
    expect(() => doc("title: X\nslug: x\nlang: de\nkind: faq", "")).toThrow(/lang/);
    expect(() => parseDocument("no front matter", "x.md")).toThrow(/front matter/);
  });
});

describe("chunkDocument", () => {
  const front = "title: Doc\nslug: doc\nlang: en\nkind: faq";

  it("keeps a Q&A pair together and labels it with its heading", () => {
    const chunks = chunkDocument(
      doc(front, "### Q: Is Jan remote?\n\nA: Yes.\n\n### Q: Where?\n\nA: Prague."),
    );
    expect(chunks).toHaveLength(2);
    expect(chunks[0]?.heading).toBe("Q: Is Jan remote?");
    expect(chunks[0]?.text).toContain("A: Yes.");
  });

  it("keeps a heading without body as a fact", () => {
    const chunks = chunkDocument(doc(front, "## Experience\n\n### IT Support (2012 to 2015)\n"));
    expect(chunks.map((c) => c.text).join(" ")).toContain("IT Support (2012 to 2015)");
  });

  it("splits long sections and prefixes the embedded text with the heading path", () => {
    const para = "word ".repeat(250).trim();
    const chunks = chunkDocument(doc(front, `## Long\n\n${para}\n\n${para}\n\n${para}`));
    expect(chunks.length).toBeGreaterThan(1);
    expect(embeddingText(chunks[0]!)).toMatch(/^Doc > Long\n/);
  });

  it("produces chunks for every real content document", () => {
    for (const file of ["content/cv/cv-en.md", "content/cv/cv-cs.md"]) {
      const chunks = chunkDocument(parseDocument(readFileSync(file, "utf8"), file));
      expect(chunks.length).toBeGreaterThan(4);
      expect(chunks.every((c) => c.text.length < 2000)).toBe(true);
    }
  });
});

describe("search and selectContext", () => {
  const chunk = (slug: string, embedding: number[], priority = 0): IndexChunk => ({
    id: slug,
    slug,
    title: slug,
    kind: "faq",
    lang: "en",
    priority,
    heading: "",
    text: "text",
    embedding,
  });

  it("ranks by similarity, caps chunks per document and applies the threshold", () => {
    const chunks = [
      chunk("a", [1, 0]),
      chunk("a", [0.99, 0.14]),
      chunk("a", [0.98, 0.2]),
      chunk("a", [0.97, 0.24]),
      chunk("b", [0, 1]),
    ];
    const hits = search([1, 0], chunks, 6, 3);
    expect(hits.map((h) => h.chunk.slug)).toEqual(["a", "a", "a", "b"]);
    expect(selectContext(hits, 0.9)).toHaveLength(4);
    expect(selectContext(search([0.5, 0.5], chunks), 0.9)).toEqual([]);
  });

  it("uses priority only as a small boost", () => {
    const hits = search([1, 0], [chunk("low", [0.9, 0.43]), chunk("cv", [0.89, 0.45], 2)]);
    expect(hits[0]?.chunk.slug).toBe("cv");
  });
});

describe("AnswerStream", () => {
  const run = (parts: string[]) => {
    let out = "";
    const s = new AnswerStream((t) => (out += t));
    parts.forEach((p) => s.push(p));
    return { out, result: s.end() };
  };

  it("streams text and parses the sources line", () => {
    const { out, result } = run(["Jan worked ", "at MSD from 2018.", "\nSOU", "RCES: 1, 3"]);
    expect(out.trim()).toBe("Jan worked at MSD from 2018.");
    expect(result).toEqual({ kind: "answer", sources: [1, 3] });
  });

  it("turns NO_ANSWER into a fallback without emitting anything", () => {
    const { out, result } = run(["NO_", "ANS", "WER"]);
    expect(out).toBe("");
    expect(result).toEqual({ kind: "fallback" });
  });

  it("hides a sources marker on the same line", () => {
    const { out, result } = run(["Yes, he does. SOURCES: 2"]);
    expect(out.trim()).toBe("Yes, he does.");
    expect(result).toEqual({ kind: "answer", sources: [2] });
  });

  it("falls back to the top sources when no sources line comes", () => {
    const { out, result } = run(["Short answer."]);
    expect(out).toBe("Short answer.");
    expect(result).toEqual({ kind: "answer", sources: null });
  });

  it("removes em and en dashes", () => {
    expect(cleanDashes("Prague — remote")).toBe("Prague, remote");
  });
});

describe("sanitizeQuestion", () => {
  it("accepts and normalises a normal question", () => {
    expect(sanitizeQuestion("  What   did Jan\ndo at MSD?​ ")).toEqual({
      ok: true,
      question: "What did Jan do at MSD?",
    });
    expect(sanitizeQuestion("Jaké má Jan zkušenosti s Next.js?").ok).toBe(true);
  });

  it("rejects empty, too long, non-string and junk input", () => {
    expect(sanitizeQuestion("").ok).toBe(false);
    expect(sanitizeQuestion(42).ok).toBe(false);
    expect(sanitizeQuestion("a".repeat(501)).ok).toBe(false);
    expect(sanitizeQuestion("{}[]<>!!!??? $$$ ###").ok).toBe(false);
  });
});
