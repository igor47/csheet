# Reed, the chat assistant

Reed edits the character through the same services as the forms, via tool calls the player approves.
Read this before touching `src/ai/`, `src/tools.ts`, `services/toolExecution.ts`,
`services/computeChat.ts`, or the chat routes.

## Storage

A chat is a `chat_id` on `chat_messages` rows: one `system` message (the prompt at the time the chat
started), then alternating `user` and `assistant` messages. An assistant message carries
`tool_calls` (an array, in the order the model made them) and `tool_results` (a map from tool call
id → `{ status: "success" | "failed" | "rejected", data?, error? }`), plus `usage` and `error`.
A tool call with no entry in `tool_results` is unresolved.

`computeChat(db, chatId)` folds the rows into what the UI and the model need: `messages` (for the
`ChatBox`), `llmInstructions` + `llmMessages` (the model's view, with tool results and rejections
rendered as the model should see them), `shouldStream` (the last message is from the user, or an
assistant turn's tool calls have all resolved and the model should continue),
`unresolvedToolCalls`, and the error state used for retries.

## The loop

1. `POST /characters/:id/chat` saves the user message (`prepareChatRequest`) and returns the
   `ChatBox`, which opens the SSE stream.
2. `GET …/stream` runs `executeChatRequest`: `streamText` with the system prompt, the message
   window, and `TOOL_DEFINITIONS`; text streams to the client; the assistant message is saved with
   its `tool_calls` and empty `tool_results`.
3. `advanceToolCalls(db, char, messageId)` walks the calls in order:
   - a **read-only** tool (no `formatApprovalMessage`) runs immediately, so later calls see its
     result;
   - a tool that **needs approval** is validated (`executeTool` with `isCheck = true`), and the loop
     stops: the UI shows an approval card. A validation failure is recorded as `failed` with the
     field errors, so the model can correct itself;
   - after a `failed` call, the remaining calls are marked failed with
     `SKIPPED_TOOL_CALL_ERROR` rather than run, since they may depend on it. A `rejected` call does
     not stop the rest.
4. `POST …/tool/:toolCallId/approve` runs the tool for real (`executeTool`, `isCheck = false`),
   stores the result, calls `advanceToolCalls` again, and returns the panels + `ChatBox`.
   `/reject` records `rejected`.
5. When every call is resolved, `shouldStream` is true again and the client re-opens the stream for
   the model's next turn.

The model is told a rejected call was *declined by the player*, not that it failed.

## Tools

`src/tools.ts` is the registry; each entry comes from a service's tool triple (see
[write-path.md](write-path.md#reeds-tools)). `TOOL_DEFINITIONS` is what the model sees;
`TOOL_EXECUTORS` and `isReadOnly(name)` drive execution. Read-only tools: `character_status` (the
whole `ComputedCharacter` minus traits, with a spell-slot summary), `character_traits`,
`character_beasts`, `lookup_spell`, `lookup_beast`, `lookup_item_template`, `search_rules`,
`read_rule`. Everything else is a write and needs approval.

The system prompt (`ai/prompts.ts`) is deliberately short, identity only; the model is told to call
`character_status` for numbers rather than having them in the prompt, and to look rules up with
`search_rules`/`read_rule` and link to them. Model and settings: `config.aiModelName`
(`claude-haiku-5-5` by default), thinking disabled, 2048 max output tokens (`ai/chat.ts`); the
evals can override these.

## Evals

`evals/` runs scripted conversations through the real code against the live API with every approval
granted, then checks the character and the reply. `mise run eval` (`--model`, `--trials`, `--case`,
`--category`) uses its own `*_eval_test` database so it can run beside the tests. Cases live in
`evals/cases/` by category; checks in `evals/checks.ts`. Add a case when a tool's description or
the prompt changes, or from a real failure (paraphrased, with a rebuilt character; no player data).
Results land in `evals/results/` (gitignored).
