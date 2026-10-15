# Architecture cleanup, October 2026

A plan written on 2026-10-15 after a review of the architecture, when the docs in `docs/` were first
written. It records what the code did then, what it should do instead, and why, so the decisions
have a home and an agent working nearby knows the target. It is a point-in-time document and is not
edited as work lands: the linked issues carry the detailed designs and the current status, and the
other docs describe the code as it is and are updated when an item ships. Later plans go next to
this one, dated.

## 1. Events

**Now:** each write inserts rows into one or more history tables, but nothing links the rows one
action wrote. A short rest touches five tables; a Reed tool call's only trace is
`chat_messages.tool_results`. The history UI groups rows by identical timestamp and note to
approximate this. Undo would mean deleting rows by hand.

**Target:** a `char_events` ledger: `id, character_id, kind, actor, actor_id, note, details jsonb,
created_at`, where `kind` names the operation (`short_rest`, `update_hit_points`, `add_level`,
`import`, `backfill`, …), `actor` is `player | reed | import | backfill`, and `actor_id` is the user
id or tool call id. Every `char_*` table gets a nullable `event_id`. Services create the event inside
their transaction and pass its id to every row they write. Existing rows keep `event_id = null`.
This gives a grouped history view, undo of an event (delete its rows, for ledger tables), a record
of what Reed did and under whose approval, and the model for recorded-session import.

**Status:** planned, #119. Lands together with #2 (#120) as one pass over the write services.

## 2. Every write locks and recomputes

**Now:** services validate against the `ComputedCharacter` the route computed before the request's
writes (a time-of-check/time-of-use race). Some services wrap their writes in `beginOrSavepoint` or
`withLockedCharacter`; others write several rows with no transaction at all (#120 lists them).
`withLockedCharacter` (HP, death saves, hit dice) is the fix.

**Target:** every write service runs its validation and writes inside `withLockedCharacter(db,
char, (tx, fresh) => …)`, moved from `hitPointChanges.ts` to its own module. One transaction, one
lock per character, validation against the fresh copy. Document it as the rule in
[write-path.md](../write-path.md).

**Status:** planned, #120, with #1 (#119).

## 3. One validation path

**Now:** "required" is enforced three ways: `Schema.partial()` at stage 1, hand-written
`!is_check` checks at stage 2, `ignoreCheckEmptyErrors` in components; plus a full re-parse at
stage 4. Issues #54 and #57.

**Target:** a single `validateForm(schema, data, char, customValidate)` helper: full parse once;
when `is_check`, drop errors on fields the player hasn't filled; run business rules; return. No
`.partial()`, no manual required checks, no component-side filtering. Tool executors pass typed
parameters through (the coercers already accept numbers), closing #94.

**Status:** planned, #121, after #119 and #120 land (same files; avoid conflicts).

## 4. Re-render every panel after a write

**Now:** each route picks which panels to send as OOB swaps after a successful write. Forgetting one
is a recurring bug class (an HP change ending a Wild Shape touches six panels).

**Target:** one `renderCharacterUpdate(c, char)` helper that returns every panel (and
`CharacterInfo`) as OOB swaps plus the `closeDetailModal` trigger; every write route uses it.
Idiomorph keeps the DOM churn small.

**Status:** planned, #122.

## 5. computeCharacter pipeline

**Now:** one 600-line function loads ~15 tables sequentially and applies item effects in four
passes interleaved with the base math; the order is correct and undocumented except in
[data-model.md](../data-model.md#computecharacter). There is no place for class features that modify
derived stats (Unarmored Defense, monk speed: #109), conditions (#99), or class resources (#110).

**Target:** `loadCharacterRows` (all queries, `Promise.all`) → `computeBase(rows, ruleset)` (pure)
→ `applyModifiers(base, [speciesTraits, classFeatures, itemEffects, conditions])`, each a pure
`(char, ctx) => char`, the list being the one statement of order. Presentation strings
(`affectedAttributes` descriptions) move to components.

**Status:** deferred, #123; do it as the first step of #109.

## 6. Ledger/state guardrail

**Now:** the classification in [data-model.md](../data-model.md) is documentation only. Six ledger
modules still export an unused `deleteById` built on `DELETE FROM`, so the test below fails until
they are removed; land both together.

**Target:** a header comment in each `src/db/char_*.ts` naming it `ledger` or `state`; a small test
that reads those files and fails if a ledger module contains `UPDATE` or `DELETE FROM`; remove the
unused `deleteById`s.

**Status:** planned, #124; small, can go with #119.

## 7. char_rests becomes an event

**Now:** `char_rests` is a receipt duplicating what the HP, hit dice, slot and wild shape rows say.

**Target:** once events exist, a rest is an event of kind `short_rest`/`long_rest` with its summary
in `details`; stop writing `char_rests`, read history from events. Old rows stay.

**Status:** #125, after #119.

## Settled (no change planned)

- **Grants are stored, not derived.** Rejected the alternative (derive from ruleset data at read
  time, store overrides) for proficiencies in #117. Reason: the sheet must be stable when rulesets
  change or become customizable (#76), and "everything about the character is in its history" is
  the product.
- **Strings in.** Services take form data; Reed's tools convert to it. One validation path for both.
- **Integration tests through HTTP**, per-test transaction, factories.
- **Catalogs generated from refdocs with an overrides file**, ids stable forever (#116).
- **Backfills are simple scripts** run by hand after deploy; no locks or dry-run flags.
- **State tables stay mutable** (`char_wild_shape_uses`, `char_traits`, `char_notes`,
  `char_beasts_seen`). Not worth rewriting as ledgers now; declared as state instead.
