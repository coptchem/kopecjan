/**
 * Fails when an em dash (U+2014) or en dash (U+2013) appears in user-facing text
 * (messages/ and content/). Warns, without failing, when a "[...]" placeholder
 * remains in messages/ (for example the IČO in the footer).
 *
 * Usage: pnpm check-dashes
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export type Hit = { file: string; line: number; column: number; char: string };

const DASHES = /[–—]/g;
const PLACEHOLDER = /\[[^\]\n]*\]/g;

export function findDashes(text: string, file = "<text>"): Hit[] {
  const hits: Hit[] = [];
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(DASHES)) {
      hits.push({ file, line: i + 1, column: (m.index ?? 0) + 1, char: m[0] });
    }
  });
  return hits;
}

/**
 * Placeholders look like "[YOUR IČO]". In JSON dictionaries only string values are scanned,
 * so one-line arrays such as ["React", "Vite"] are not reported.
 */
export function findPlaceholders(text: string, file = "<text>"): Hit[] {
  const hits: Hit[] = [];
  const lines = text.split("\n");
  const scan = (value: string) => {
    for (const m of value.matchAll(PLACEHOLDER)) {
      const line = lines.findIndex((l) => l.includes(m[0]));
      const column = line >= 0 ? (lines[line]?.indexOf(m[0]) ?? 0) + 1 : 0;
      hits.push({ file, line: line + 1, column, char: m[0] });
    }
  };
  if (file.endsWith(".json")) {
    const walk = (v: unknown): void => {
      if (typeof v === "string") scan(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.values(v).forEach(walk);
    };
    try {
      walk(JSON.parse(text));
    } catch {
      scan(text);
    }
  } else {
    scan(text);
  }
  return hits;
}

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

export function run(root = process.cwd()): { errors: Hit[]; warnings: Hit[] } {
  const files = [
    ...walk(join(root, "messages"), [".json"]),
    ...walk(join(root, "content"), [".md"]),
  ];
  const errors: Hit[] = [];
  const warnings: Hit[] = [];
  for (const file of files) {
    const rel = relative(root, file);
    const text = readFileSync(file, "utf8");
    errors.push(...findDashes(text, rel));
    if (rel.startsWith("messages")) warnings.push(...findPlaceholders(text, rel));
  }
  return { errors, warnings };
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/check-dashes.ts");
if (isMain) {
  const { errors, warnings } = run();
  for (const w of warnings) {
    console.warn(`warning: placeholder ${w.char} left in ${w.file}:${w.line}:${w.column}`);
  }
  if (errors.length > 0) {
    for (const e of errors) {
      const name = e.char === "—" ? "em dash" : "en dash";
      console.error(`error: ${name} in ${e.file}:${e.line}:${e.column}`);
    }
    console.error(`check-dashes: ${errors.length} problem(s). Use commas, colons or "to" / "až".`);
    process.exit(1);
  }
  console.log(`check-dashes: OK (${warnings.length} placeholder warning(s))`);
}
