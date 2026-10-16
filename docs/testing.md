# Testing

Bun's test runner, through `mise run test` so the test database and buckets are set up. Tests are
integration tests: they make HTTP requests to the app and assert on the HTML or the database.

```bash
mise run test                                   # everything (randomized order)
mise run test src/routes/character.test.ts      # one file
mise run test --test-name-pattern "short rest"  # by name
```

`mise run test` recreates `POSTGRES_DB_TEST` (`csheet_test` by default), migrates it, sets
`NODE_ENV=test`, and unsets the Resend and Anthropic keys so nothing external is called.

## Structure

```ts
describe("POST /characters/:id/edit/hitpoints", () => {
  const testCtx = useTestApp()            // don't destructure: set in beforeEach

  describe("when the character is at full HP", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id, class: "fighter", level: 3 }, testCtx.db)
    })

    test("rejects healing", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/hitpoints`, {
        user,
        method: "POST",
        headers: { "HX-Request": "true", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ action: "restore", amount: "5", is_check: "false" }).toString(),
      })
      const document = await parseHtml(response)
      expect(getElementText(document, ".invalid-feedback")).toContain("Cannot restore")
    })
  })
})
```

- `useTestApp()` (`src/test/app.ts`) reserves a connection, runs `BEGIN`, builds the app with that
  connection injected, and `ROLLBACK`s after each test. Services that call `beginOrSavepoint` get a
  savepoint on the reserved connection, so their transactions nest inside the test's.
- Factories (`src/test/factories/`, fishery + faker) create rows through the db modules.
  `characterFactory.create({ user_id, class, level, ... }, db)` writes the levels, abilities and the
  proficiencies `addLevel` would have granted; pass `legacy: true` to get a character as stored
  before a feature existed, for testing backfills.
- `src/test/http.ts`: `makeRequest(app, path, { user, method, headers, body, cookies })` signs the
  auth cookie for `user`; `parseHtml`, `expectElement`, `getElementText`, `elementExists`,
  `getElements` for assertions.
- Nested `describe`s read as a specification: the outer block is the route or behavior, inner blocks
  are contexts ("when …", "with …"), tests are outcomes.

## What to test

- A new route: the unauthenticated case, the not-owner case, the validation-error re-render, and
  the successful write's effect on the database or the rendered sheet.
- A new tool: through the chat tool routes (`src/routes/chat.tools.test.ts`), not by calling the
  executor directly.
- Rule logic in `lib/dnd` that is a pure function (slot tables, death saves, proficiency grants) may
  have unit tests next to it; everything that touches the DB goes through HTTP.
- Backfills: the service, with a `legacy` character.
- Catalog data: id uniqueness and freshness against `refdocs/` (`src/lib/srd/spells.test.ts`).

## Gotchas

- `beforeEach` can't return a cleanup function in Bun; use `afterEach`.
- Don't use `*` imports in tests (or anywhere).
- Rows written in one transaction share `created_at`; assert order by `id`, or on the fold's
  result, not on timestamps.
- The AI SDK is not mocked; tests that would reach the model should assert on the stored
  messages/tool calls instead, and model behavior belongs in `evals/`.
