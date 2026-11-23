/**
 * Retrieval check against tests/rag/questions.json (docs/04-rag-spec.md, Evaluation).
 * No LLM call: every answerable question must have an expected slug in the top 3 and pass
 * the threshold; every off-topic question must fall below it.
 *
 * Usage: pnpm test:rag            (Linux or the Docker wrapper on Windows)
 *        pnpm test:rag --verbose  prints the scores, used to tune RAG_SCORE_THRESHOLD
 */
import { readFileSync } from "node:fs";
import { embedQuery } from "../lib/rag/embed";
import { loadIndex } from "../lib/rag/index";
import { search, threshold } from "../lib/rag/retrieve";

type Questions = {
  answerable: { q: string; expect: string[] }[];
  offTopic: string[];
  /** Borderline questions that may pass retrieval; the model must answer NO_ANSWER (checked live). */
  modelGuard?: string[];
};

async function main() {
  const verbose = process.argv.includes("--verbose");
  const questions = JSON.parse(readFileSync("tests/rag/questions.json", "utf8")) as Questions;
  const { chunks } = loadIndex();
  const min = threshold();
  const failures: string[] = [];
  const answerScores: number[] = [];
  const offScores: number[] = [];

  for (const { q, expect } of questions.answerable) {
    const hits = search(await embedQuery(q), chunks);
    const best = hits[0]?.similarity ?? 0;
    answerScores.push(best);
    const top3 = [...new Set(hits.slice(0, 3).map((h) => h.chunk.slug))];
    const ok = top3.some((s) => expect.includes(s)) && best >= min;
    if (!ok) failures.push(`answerable: "${q}" best=${best.toFixed(3)} top3=${top3.join(",")}`);
    if (verbose) console.log(`${ok ? "ok  " : "FAIL"} ${best.toFixed(3)} ${top3.join(",")}  ${q}`);
  }

  for (const q of questions.offTopic) {
    const hits = search(await embedQuery(q), chunks);
    const best = hits[0]?.similarity ?? 0;
    offScores.push(best);
    const ok = best < min;
    if (!ok) failures.push(`off-topic: "${q}" best=${best.toFixed(3)} passed the threshold`);
    if (verbose) console.log(`${ok ? "ok  " : "FAIL"} ${best.toFixed(3)} (off-topic)  ${q}`);
  }

  for (const q of questions.modelGuard ?? []) {
    const best = search(await embedQuery(q), chunks)[0]?.similarity ?? 0;
    if (verbose)
      console.log(
        `info ${best.toFixed(3)} (model guard, ${best < min ? "fallback" : "goes to the model"})  ${q}`,
      );
  }

  console.log(
    `test-rag: threshold ${min}, lowest answerable ${Math.min(...answerScores).toFixed(3)}, highest off-topic ${Math.max(...offScores).toFixed(3)}`,
  );
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log(`test-rag: ${questions.answerable.length + questions.offTopic.length} questions OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
