# The write path: services, validation, tools

Every change to a character goes through one service function, whether it comes from an HTMX form
or from Reed. Read this before adding or changing a service.

## Shape of a service

`src/services/<verb><Noun>.ts` exports:

```ts
export const UpdateHitPointsApiSchema = z.object({ ... })          // the form's fields
export async function updateHitPoints(db, char, data): Promise<UpdateHitPointsResult>
export const updateHitPointsToolName = "update_hit_points" as const  // Reed's tool, if any
export const updateHitPointsTool = { description, inputSchema } satisfies ToolSpec
export async function executeUpdateHitPoints(db, char, parameters, isCheck?)
export function formatUpdateHitPointsApproval(parameters, char): string
```

- `db: SQL` first, so tests and transactions can pass theirs.
- `char: ComputedCharacter` is the character the route authorized with. It is a snapshot; see
  *Locking* below.
- `data` is **form data**: `Record<string, string>` (or `any` for forms with arrays/objects from
  `parseBody`). Reed's typed parameters are converted to the same shape by `toFormData`
  (`lib/toolSpec.ts`), so one validation path serves both. Don't add a second, typed entry point.
- Returns `ServiceResult<T>` (`lib/serviceResult.ts`):
  `{ complete: true, result }` or `{ complete: false, values, errors }`. `values` is the submitted
  data, echoed back so the form re-renders filled in; `errors` maps field name → message.

## Validation and `is_check`

Edit forms validate live. `ModalForm` posts on every `change` with `is_check=true`; the submit button
posts with `is_check=false`. Services handle both in the same function:

1. **Coerce and type-check**: `Schema.partial().safeParse(data)`. Fields are wrapped in
   `NumberField` / `StringField` / `Checkbox` / `ArrayField` from `lib/formSchemas.ts`, which turn
   `""` into `null` and accept numbers as well as strings. `.partial()` lets missing fields through
   during a check. Return `zodToFormErrors(error)` if anything present is invalid.
2. **Business rules** against `char`: bounds ("cannot restore more than N"), ownership of a die or
   slot, class requirements. Collect into `errors`. Required-ness is enforced here by hand:
   `else if (!values.is_check) errors.amount = "Amount is required"`.
3. If `is_check` or any errors: return `{ complete: false, values: data, errors }`.
4. **Full parse**: `Schema.safeParse(data)`; required fields are enforced now.
5. **Write**.

Components call `ignoreCheckEmptyErrors(values, errors)` so a check doesn't flag fields the player
hasn't reached. Messages come from the Zod schema (`error: (iss) => iss.input == null ? "Amount is
required" : "Must be a valid number"`); write them for a player, not a developer.

This flow is consistent across services but handles "required" in three places; a simpler
single-pass version is planned ([plans/2026-10-architecture-cleanup.md](plans/2026-10-architecture-cleanup.md#3-one-validation-path)). Until that
lands, copy the stages above exactly; don't invent a fourth variant.

## Writing

- Every row a service writes gets a `note` saying why, in the player's terms: the form's note field
  if given, otherwise the service's description ("Took a short rest", "Wild Shape overflow: …").
- A service that writes more than one row wraps the writes in `beginOrSavepoint(db, async (tx) =>
  …)` (`src/db.ts`), and uses `tx` for every write inside.
- **Locking.** `char` was computed before the request's writes, possibly before another request's
  (a double-click, or Reed and the sheet at once). Services that depend on current values wrap their
  work in `withLockedCharacter(db, char, (tx, fresh) => …)` (`services/hitPointChanges.ts`): it
  opens a transaction, takes `SELECT … FOR UPDATE` on the character row, recomputes the character,
  and runs the body against the fresh copy. HP, death saves and hit dice use it today; it is the
  target for all writes ([plans/2026-10-architecture-cleanup.md](plans/2026-10-architecture-cleanup.md#2-every-write-locks-and-recomputes)).
- A **read path never writes**. `computeCharacter`, `authorize*`, history routes, and read-only
  tools don't insert, even to "fix up" old data. Old data is fixed by a backfill script.
- Services don't render and don't know about Hono. Return data; the route decides what to show.

## Authorization

`authorizeCharacter(c, id)` → `{ allowed: true, character, accessType }` or `{ allowed: false,
reason }`; `handleUnallowed(c, reason)` renders the right redirect/404. Use `authorizeCharacterView`
for pages a campaign DM may see and `authorizeCharacterLightbox` for party members. Every character
route starts with one of these; chat routes check `char.user_id` directly.

## Reed's tools

A service that Reed may call exports the tool triple above. `src/tools.ts` registers it:

```ts
registerTool({ name, tool, executor, formatApprovalMessage })
```

`registerTool` parses the model's parameters with `tool.inputSchema` before calling the executor, so
executors receive typed input (`ToolInput<typeof tool>`). The executor converts to form data
(`toFormData`) and calls the service with `isCheck`. A tool without `formatApprovalMessage` is
**read-only** and runs without the player's approval; one with it is shown as an approval card and
only validated (`isCheck = true`) until approved. Keep `inputSchema` as `ApiSchema.omit({ is_check:
true })` so the two can't drift.

Tool descriptions are prompts: say when to use the tool, give two or three concrete examples, and
state what the system will refuse, so the model doesn't guess. See [reed.md](reed.md) for the loop.

## Adding a write operation: checklist

1. Table change? Migration + db module (ledger by default, see [data-model.md](data-model.md)).
2. Service file with the shape above; `beginOrSavepoint`/`withLockedCharacter` around the writes.
3. Route: authorize → service → re-render form on `complete: false`, panels on `complete: true`
   ([htmx-ui.md](htmx-ui.md)).
4. Edit form component and, if the panel shows history, a history component and a branch in the
   `/characters/:id/history/:field` route.
5. Tool triple + `registerTool` if Reed should be able to do it; add an eval case if it's a common
   player request.
6. Integration tests through the route (and through the tool route if there is one).
7. Existing characters need the new data? Backfill service + `utils/` script + mise task.
