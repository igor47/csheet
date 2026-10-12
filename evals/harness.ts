import { type ChatRequestOptions, executeChatRequest, prepareChatRequest } from "@src/ai/chat"
import { findByChatId, setMessageRetry } from "@src/db/chat_messages"
import { computeCharacter } from "@src/services/computeCharacter"
import { computeChat } from "@src/services/computeChat"
import { advanceToolCalls, executeTool } from "@src/services/toolExecution"
import { userFactory } from "@src/test/factories/user"
import type { SQL } from "bun"
import { check, linksAreValid } from "./checks"
import type { Check, EvalCase, Outcome, RecordedCall, Transcript, Turn } from "./types"

// Model calls allowed per user turn, so a model stuck in a loop can't run up the bill
const MAX_MODEL_CALLS_PER_TURN = 12
// Errored turns are retried once, like a player pressing retry
const MAX_RETRIES_PER_TURN = 1

export interface TrialResult {
  caseId: string
  trial: number
  pass: boolean
  checks: Check[]
  grounding: Check[]
  /** Every link Reed wrote is a real rules section; reported separately from pass */
  links: Check
  transcript: Transcript
  /** Set if the trial crashed rather than Reed getting it wrong */
  crash?: string
  durationMs: number
}

async function getCharacter(db: SQL, id: string) {
  const char = await computeCharacter(db, id)
  if (!char) throw new Error(`character ${id} not found`)
  return char
}

/**
 * Send one user message and play the conversation out the way the chat routes do, with the
 * player approving every edit Reed proposes
 */
async function runTurn(
  db: SQL,
  characterId: string,
  chatId: string | null,
  message: string,
  options: ChatRequestOptions
): Promise<{ chatId: string; capped: boolean }> {
  const char = await getCharacter(db, characterId)
  const prepared = await prepareChatRequest(db, char, message, chatId)

  let modelCalls = 0
  let retries = 0
  while (true) {
    const chat = await computeChat(db, prepared.chatId)

    // approve the next edit, then run what follows it, as the approve route does
    const pending = chat.unresolvedToolCalls[0]
    if (pending) {
      await executeTool(db, await getCharacter(db, characterId), pending)
      await advanceToolCalls(db, await getCharacter(db, characterId), pending.messageId)
      continue
    }

    if (chat.shouldStream) {
      if (modelCalls >= MAX_MODEL_CALLS_PER_TURN) return { chatId: prepared.chatId, capped: true }
      modelCalls++
      await executeChatRequest(db, await getCharacter(db, characterId), chat, undefined, options)
      continue
    }

    if (chat.erroredMessage && retries < MAX_RETRIES_PER_TURN) {
      retries++
      await setMessageRetry(db, chat.erroredMessage.id)
      continue
    }

    break
  }

  return { chatId: prepared.chatId, capped: false }
}

/** Read the chat back out of the database, split into user turns */
async function readTranscript(db: SQL, chatId: string): Promise<Transcript> {
  const messages = await findByChatId(db, chatId, 1000)
  const transcript: Transcript = {
    turns: [],
    inputTokens: 0,
    outputTokens: 0,
    cachedInputTokens: 0,
    cacheWriteInputTokens: 0,
    modelCalls: 0,
  }

  let turn: Turn | null = null
  const replies: string[] = []
  for (const msg of messages) {
    if (msg.role === "user") {
      if (turn) turn.reply = replies.splice(0).join("\n\n")
      turn = { user: msg.content, reply: "", calls: [], errors: 0, capped: false }
      transcript.turns.push(turn)
      continue
    }
    if (msg.role !== "assistant" || !turn) continue

    // a stream error still called the model, but has no usage recorded
    if (msg.usage || msg.error?.type === "stream") transcript.modelCalls++
    if (msg.usage) {
      transcript.inputTokens += msg.usage.inputTokens
      transcript.outputTokens += msg.usage.outputTokens
      transcript.cachedInputTokens += msg.usage.cachedInputTokens ?? 0
      transcript.cacheWriteInputTokens += msg.usage.cacheWriteInputTokens ?? 0
    }
    if (msg.error) turn.errors++
    if (msg.content) replies.push(msg.content)
    for (const call of msg.tool_calls ?? []) {
      const result = msg.tool_results?.[call.id]
      const recorded: RecordedCall = {
        name: call.name,
        parameters: call.parameters,
        status: result?.status ?? "pending",
      }
      if (result?.status === "failed" && result.error) recorded.error = result.error
      turn.calls.push(recorded)
    }
  }
  if (turn) turn.reply = replies.join("\n\n")

  return transcript
}

/**
 * Run one trial of a case. Edits Reed makes really run, so later calls see them.
 *
 * This deliberately doesn't use a rolled-back transaction like the tests do: Postgres fixes
 * CURRENT_TIMESTAMP at the start of a transaction, so every row in a trial would share one
 * created_at, and code that compares timestamps (rests, wild shape, note backups) would behave
 * unlike prod. Each write commits on its own, as in prod, so this must only run against the
 * scratch test database
 */
export async function runTrial(
  db: SQL,
  evalCase: EvalCase,
  trial: number,
  options: ChatRequestOptions
): Promise<TrialResult> {
  const started = Date.now()
  try {
    const user = await userFactory.create({}, db)
    const { id: characterId } = await evalCase.setup(db, user)
    const before = await getCharacter(db, characterId)

    let chatId: string | null = null
    const capped: boolean[] = []
    for (const message of evalCase.turns) {
      const turn = await runTurn(db, characterId, chatId, message, options)
      chatId = turn.chatId
      capped.push(turn.capped)
    }

    const transcript = await readTranscript(db, chatId!)
    transcript.turns.forEach((t, i) => {
      t.capped = capped[i] ?? false
    })
    const outcome: Outcome = {
      before,
      after: await getCharacter(db, characterId),
      transcript,
      reply: transcript.turns.at(-1)?.reply ?? "",
      calls: transcript.turns.flatMap((t) => t.calls),
    }

    // a Reed stuck in a loop fails even if the sheet happens to come out right
    const checks = [
      ...(await evalCase.expect(outcome)),
      check(
        `finished each turn within ${MAX_MODEL_CALLS_PER_TURN} model calls`,
        !transcript.turns.some((t) => t.capped)
      ),
    ]
    const grounding = (await evalCase.grounding?.(outcome)) ?? []
    return {
      caseId: evalCase.id,
      trial,
      pass: checks.every((c) => c.pass),
      checks,
      grounding,
      links: await linksAreValid(outcome),
      transcript,
      durationMs: Date.now() - started,
    }
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err)
    return {
      caseId: evalCase.id,
      trial,
      pass: false,
      checks: [check("trial ran", false, message)],
      grounding: [],
      links: check("links point at real rules sections", false, "trial crashed"),
      transcript: {
        turns: [],
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        cacheWriteInputTokens: 0,
        modelCalls: 0,
      },
      crash: message,
      durationMs: Date.now() - started,
    }
  }
}
