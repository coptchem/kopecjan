import { describe, expect, it } from "vitest";
import { findDashes, findPlaceholders, run } from "../../scripts/check-dashes";

describe("check-dashes", () => {
  it("finds em and en dashes with position", () => {
    const hits = findDashes("ok\n2018 – 2024\nfoo — bar", "x.json");
    expect(hits).toEqual([
      { file: "x.json", line: 2, column: 6, char: "–" },
      { file: "x.json", line: 3, column: 5, char: "—" },
    ]);
  });

  it("ignores hyphens and middle dots", () => {
    expect(findDashes("full-stack · remote, 2018 to 2024")).toEqual([]);
  });

  it("finds bracket placeholders", () => {
    expect(findPlaceholders("IČO [YOUR IČO]").map((h) => h.char)).toEqual(["[YOUR IČO]"]);
  });

  it("ignores JSON arrays but finds placeholders inside JSON strings", () => {
    const json = JSON.stringify({
      tags: ["React", "Vite"],
      copyright: "© {year} · IČO [YOUR IČO]",
    });
    expect(findPlaceholders(json, "x.json").map((h) => h.char)).toEqual(["[YOUR IČO]"]);
  });

  it("the repository has no placeholders left in messages/", () => {
    const { warnings } = run();
    expect(warnings).toEqual([]);
  });

  it("the repository has no dashes in messages/ or content/", () => {
    const { errors } = run();
    expect(errors).toEqual([]);
  });
});
