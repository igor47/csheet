import type { User } from "@src/db/users"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { SQL } from "bun"

export const CATEGORIES = [
  "leveling",
  "spells",
  "coins",
  "hit-points",
  "inventory",
  "rules",
] as const
export type Category = (typeof CATEGORIES)[number]

/** One tool call Reed made during a trial, with how it turned out */
export interface RecordedCall {
  name: string
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
  status: "success" | "failed" | "rejected" | "pending"
  error?: string
}

/** What happened during one user turn */
export interface Turn {
  user: string
  /** Everything Reed said during the turn, joined */
  reply: string
  calls: RecordedCall[]
  /** Assistant messages that errored (prep or stream failures) */
  errors: number
  /** Reed was still going when the turn hit the model-call cap */
  capped: boolean
}

export interface Transcript {
  turns: Turn[]
  /** Uncached input; cache reads and writes are counted separately */
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  cacheWriteInputTokens: number
  modelCalls: number
}

/** What a case's checks get to look at */
export interface Outcome {
  before: ComputedCharacter
  after: ComputedCharacter
  transcript: Transcript
  /** Reed's reply to the last user message */
  reply: string
  /** Every tool call across all turns, in order */
  calls: RecordedCall[]
}

export interface Check {
  name: string
  pass: boolean
  detail?: string
}

export interface EvalCase {
  id: string
  category: Category
  /** What went wrong in prod (or what this covers), and what Reed should do instead */
  description: string
  /** Build the character the conversation is about */
  setup: (db: SQL, user: User) => Promise<{ id: string }>
  /** The player's messages, sent in order; each runs until Reed stops calling tools */
  turns: string[]
  /** Did Reed get it right? Checks the character afterwards and/or the reply */
  expect: (o: Outcome) => Check[] | Promise<Check[]>
  /** Did Reed look it up rather than answer from memory? Reported separately */
  grounding?: (o: Outcome) => Check[] | Promise<Check[]>
}
