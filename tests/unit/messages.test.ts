import { describe, expect, it } from "vitest";
import cs from "../../messages/cs.json";
import en from "../../messages/en.json";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Flattens an object into "a.b.0.c" paths; array lengths must match too. */
function shape(value: Json, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => shape(v, `${prefix}${i}.`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => shape(v, `${prefix}${k}.`));
  }
  return [prefix.replace(/\.$/, "")];
}

describe("messages", () => {
  it("en.json and cs.json have the same keys and array lengths", () => {
    expect(shape(cs as Json).sort()).toEqual(shape(en as Json).sort());
  });

  it("ICU arguments match between locales", () => {
    const args = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    expect(args(cs.chat.counter)).toEqual(args(en.chat.counter));
    expect(args(cs.chat.limitTitle)).toEqual(args(en.chat.limitTitle));
    expect(args(cs.chat.limitBody)).toEqual(args(en.chat.limitBody));
    expect(args(cs.footer.copyright)).toEqual(args(en.footer.copyright));
  });
});
