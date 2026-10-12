/**
 * Reed eval suite (#86): plays scripted conversations through the real chat code against a
 * live model, with fixture characters in the scratch test database, and scores the outcome.
 * Calls the Anthropic API, so it's run by hand rather than in CI:
 *
 *   mise run eval                                   # every case, 3 trials, default model
 *   mise run eval --model claude-haiku-5-5 --trials 5
 *   mise run eval --case spells-                    # cases whose id contains "spells-"
 *   mise run eval --category rules
 *
 * Results are printed and saved as JSON under evals/results/.
 */
import { parseArgs } from "node:util"
import { createAnthropic } from "@ai-sdk/anthropic"
import { config } from "@src/config"
import { getDbForTests } from "@src/db"
import { CASES } from "./cases"
import { runTrial, type TrialResult } from "./harness"
import { CATEGORIES, type Category, type EvalCase } from "./types"

// $ per million tokens. Prompt-cache reads cost 0.1x input and writes 1.25x (5-minute cache)
const CACHE_READ_RATE = 0.1
const CACHE_WRITE_RATE = 1.25
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
}

const { values: args } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    model: { type: "string", default: config.aiModelName },
    trials: { type: "string", default: "3" },
    case: { type: "string" },
    category: { type: "string" },
    "max-output-tokens": { type: "string", default: "1024" },
    concurrency: { type: "string", default: "4" },
  },
})

function priceFor(model: string) {
  const key = Object.keys(PRICES).find((k) => model.startsWith(k))
  return key ? PRICES[key] : undefined
}

function costOf(results: TrialResult[], model: string): number | undefined {
  const price = priceFor(model)
  if (!price) return undefined
  const sum = (f: (r: TrialResult) => number) => results.reduce((n, r) => n + f(r), 0)
  const input =
    sum((r) => r.transcript.inputTokens) +
    sum((r) => r.transcript.cachedInputTokens) * CACHE_READ_RATE +
    sum((r) => r.transcript.cacheWriteInputTokens) * CACHE_WRITE_RATE
  const output = sum((r) => r.transcript.outputTokens)
  return (input * price.input + output * price.output) / 1e6
}

function positiveInt(name: string, value: string | undefined): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) {
    console.error(`--${name} must be a positive whole number, got ${value}`)
    process.exit(1)
  }
  return n
}

function failedCalls(r: TrialResult): number {
  return r.transcript.turns.flatMap((t) => t.calls).filter((c) => c.status === "failed").length
}

function pct(n: number, d: number): string {
  return d === 0 ? "-" : `${Math.round((100 * n) / d)}%`
}

function money(n: number | undefined): string {
  return n === undefined ? "?" : `$${n.toFixed(3)}`
}

/** Run tasks with at most `limit` in flight */
async function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]!()
    }
  })
  await Promise.all(workers)
  return results
}

function summarize(label: string, results: TrialResult[], model: string): string[] {
  const passed = results.filter((r) => r.pass).length
  const grounded = results.filter((r) => r.grounding.length > 0)
  const groundedPassed = grounded.filter((r) => r.grounding.every((c) => c.pass)).length
  const linksOk = results.filter((r) => r.links.pass).length
  const fails = results.reduce((n, r) => n + failedCalls(r), 0)
  const calls = results.reduce((n, r) => n + r.transcript.modelCalls, 0)
  const errored = results.reduce(
    (n, r) => n + r.transcript.turns.reduce((m, t) => m + t.errors, 0),
    0
  )
  return [
    label.padEnd(12),
    `${pct(passed, results.length)} (${passed}/${results.length})`.padEnd(14),
    (grounded.length
      ? `${pct(groundedPassed, grounded.length)} (${groundedPassed}/${grounded.length})`
      : "-"
    ).padEnd(14),
    pct(linksOk, results.length).padEnd(11),
    (results.length ? (fails / results.length).toFixed(1) : "-").padEnd(13),
    (results.length ? (calls / results.length).toFixed(1) : "-").padEnd(12),
    String(errored).padEnd(8),
    money(costOf(results, model)),
  ]
}

async function main() {
  if (!config.anthropicApiKey) {
    console.error("ANTHROPIC_API_KEY is not set")
    process.exit(1)
  }
  const model = args.model!
  const trials = positiveInt("trials", args.trials)
  const concurrency = positiveInt("concurrency", args.concurrency)
  const maxOutputTokens = positiveInt("max-output-tokens", args["max-output-tokens"])

  let cases: EvalCase[] = CASES
  if (args.case) cases = cases.filter((c) => c.id.includes(args.case!))
  if (args.category) cases = cases.filter((c) => c.category === args.category)
  if (cases.length === 0) {
    console.error("No cases match")
    process.exit(1)
  }

  const options = {
    model: createAnthropic({ apiKey: config.anthropicApiKey })(model),
    maxOutputTokens,
  }
  console.log(`Running ${cases.length} cases x ${trials} trials on ${model}\n`)

  // trials commit their writes (see runTrial), so never point this at a real database
  if (!config.postgresDb.endsWith("_test")) {
    console.error(`Refusing to run against ${config.postgresDb}; use mise run eval`)
    process.exit(1)
  }
  const db = getDbForTests()
  const started = Date.now()
  const tasks = cases.flatMap((c) =>
    Array.from({ length: trials }, (_, i) => async () => {
      const result = await runTrial(db, c, i + 1, options)
      const mark = result.crash ? "CRASH" : result.pass ? "pass" : "FAIL"
      console.log(
        `  ${mark.padEnd(5)} ${c.id} #${i + 1} (${(result.durationMs / 1000).toFixed(0)}s)`
      )
      return result
    })
  )
  const results = await pool(tasks, concurrency)

  // per case, with the first failure's details
  console.log("\nCases")
  for (const c of cases) {
    const rs = results.filter((r) => r.caseId === c.id)
    const passed = rs.filter((r) => r.pass).length
    console.log(`  ${`${passed}/${rs.length}`.padEnd(5)} ${c.id}`)
    const failing = rs.find((r) => !r.pass)
    if (failing) {
      for (const chk of failing.checks.filter((x) => !x.pass)) {
        console.log(`          ✗ ${chk.name}${chk.detail ? `: ${chk.detail.split("\n")[0]}` : ""}`)
      }
      const bad = failing.transcript.turns
        .flatMap((t) => t.calls)
        .filter((x) => x.status === "failed")
      for (const call of bad.slice(0, 3)) {
        console.log(`          ! ${call.name}: ${call.error?.slice(0, 140)}`)
      }
    }
    const badLinks = rs.filter((r) => !r.links.pass)
    if (badLinks.length) {
      console.log(`          links: ${badLinks.length} bad, e.g. ${badLinks[0]!.links.detail}`)
    }
  }

  // per category and overall
  const header = [
    "",
    "pass",
    "looked up",
    "links ok",
    "failed calls",
    "model calls",
    "errors",
    "cost",
  ]
  const widths = [12, 14, 14, 11, 13, 12, 8, 0]
  console.log(`\n  ${header.map((h, i) => h.padEnd(widths[i]!)).join("")}`)
  const used = CATEGORIES.filter((cat: Category) => cases.some((c) => c.category === cat))
  for (const cat of used) {
    const ids = new Set(cases.filter((c) => c.category === cat).map((c) => c.id))
    console.log(
      `  ${summarize(
        cat,
        results.filter((r) => ids.has(r.caseId)),
        model
      ).join("")}`
    )
  }
  console.log(`  ${summarize("all", results, model).join("")}`)
  console.log("  (failed calls and model calls are per trial)")
  console.log(`\nTook ${((Date.now() - started) / 1000).toFixed(0)}s`)

  const outDir = `${import.meta.dir}/results`
  const outFile = `${outDir}/${new Date().toISOString().replaceAll(":", "-")}-${model}.json`
  await Bun.write(
    outFile,
    JSON.stringify(
      {
        model,
        trials,
        maxOutputTokens: options.maxOutputTokens,
        cost: costOf(results, model),
        results,
      },
      null,
      2
    )
  )
  console.log(`Saved ${outFile}`)
  process.exit(0)
}

await main()
