# Data model

A character is a `characters` row plus history. Almost nothing about a character is stored as a
current value: `computeCharacter` derives the sheet by folding the character's history tables and
applying the rules of its ruleset. Read this before adding a table, a column, or a derived stat.

## Why history tables

Players and Reed both edit the sheet, and the plan is for more of the edits to come from an agent
(live during play, or from a recorded session afterwards). Every change is a row that says what
happened and why (`note`), so the sheet can show its history per panel, mistakes can be undone by
removing rows, and the agent's work can be reviewed. See [plans/2026-10-architecture-cleanup.md](plans/2026-10-architecture-cleanup.md#1-events) for
the gap that remains: rows aren't yet grouped into the action that wrote them.

## Two kinds of character table

**Ledger**: append-only. Rows are only ever inserted; the current value is a *fold* over the rows
in `id` order. A ledger module (`src/db/char_*.ts`) exports `create`, `findByCharacterId` and a
`current*`/fold function, and must contain no `UPDATE`. (Some still export an unused `deleteById`;
undo will go through events instead, see [the plan](plans/2026-10-architecture-cleanup.md#1-events).)

**State**: mutable rows that *are* the current value, updated in place. Used where the thing has a
lifecycle of its own (an ongoing transformation) or is free text the player edits.

| Table | Kind | Fold / meaning | Written by |
|---|---|---|---|
| `characters` | state | identity: name, species, lineage, background, alignment, ruleset, `archived_at` | create, import, archive |
| `char_levels` | ledger | one row per class level gained, with `hit_die_roll`; current = highest level per class | create, import, `addLevel` |
| `char_abilities` | ledger | last row per ability wins (`score`, saving-throw `proficiency`) | create, import, `updateAbilities` |
| `char_skills` | ledger | last row per skill wins (`proficiency`: none/half/proficient/expert) | create, import, `updateSkills` |
| `char_proficiencies` | ledger | `add`/`remove` per (kind, name); `source` says why it was granted | create, import, `addLevel` via `grantProficiencies`, `updateProficiencies`, backfill |
| `char_traits` | state | a trait's text; `source`/`source_detail`/`level` say where it came from. Edited and deleted in place | create, import, `addLevel`, `addTrait`, `updateTrait` |
| `char_hp` | ledger | `SUM(delta)` added to max HP | `hitPointChanges` (damage/heal), rests, wild shape overflow |
| `char_death_saves` | ledger | events `down`/`success`/`failure`/`stable`/`dead`/`up`; fold since the last `up` (`lib/dnd/deathSaves.ts`) | `hitPointChanges`, `deathSaves` |
| `char_hit_dice` | ledger | `use`/`restore` per `die_value`, replayed against the dice levels grant | `updateHitDice`, rests |
| `char_spell_slots` | ledger | `use`/`restore` per `slot_level`, replayed against the slot table | `updateSpellSlots`, `castSpell`, rests |
| `char_spells_learned` | ledger | spell ids added to a wizard's spellbook | `learnSpell` |
| `char_spells_prepared` | ledger | `prepare`/`unprepare` per (class, spell) | `prepareSpell` |
| `char_coins` | ledger | each row is a full snapshot (pp/gp/ep/sp/cp); last row wins | `updateCoins` |
| `char_items` | ledger | last row per `item_id` wins; `worn`/`wielded`/`dropped_at` are on the row | `createItem`, `equipItem`, `dropItem` |
| `char_rests` | ledger | a receipt per rest: what it restored, `details` jsonb | `shortRest`, `longRest` |
| `char_beasts_seen` | state | beasts a druid can Wild Shape into; soft-deleted via `replaced_at`/`replaced_by` | `seeBeast`, `prepBeast` |
| `char_wild_shape_uses` | state | one row per transformation: `beast_hp`, `ended_at`, `recovered_at` updated in place | `activateWildShape`, `endWildShape`, HP changes, rests |
| `char_notes` | state | session notes; a new row per version, `is_backup`, `restored_from_id` | `saveNotes` |
| `character_avatars` | state | uploaded images and crops; `is_primary` | avatar routes |
| `items` | state | an item's definition (category, armor/weapon fields); `item_damage`, `item_effects` are its children | `createItem`, `updateItem` |
| `item_charges` | ledger | `SUM(delta)` per item | `manageCharge`, `castSpell` |

Everything else (`users`, `auth_tokens`, `campaigns`, `campaign_members`, `campaign_characters`,
`chat_messages`, `uploads`, `altcha_solutions`) is ordinary state.

### Rules for a new table

- Default to a ledger. Use state only when the row has its own lifecycle or is edited text.
- Every character table has `id varchar(26)` (ULID), `character_id`, `note text`, `created_at`,
  `updated_at`, and an index on `(character_id, id)` (plus the fold key if there is one, e.g.
  `(character_id, skill, id)`). Fold queries order by `id`, never `created_at`.
- Enumerations are `CHECK` constraints in the migration *and* a Zod enum in the db module.
- The db module parses rows through its Zod schema (`CharXSchema.parse({...row, created_at: new
  Date(...)})`) so callers get typed, validated objects.

## What is stored vs computed

**Stored (in history):** anything the character *gained or chose*: levels and hit die rolls,
ability scores, skill and saving-throw proficiencies, weapon/armor/tool/language proficiencies,
traits, spells learned and prepared, items, coins, and every use of a resource.

**Computed (pure rule formulas and tables):** proficiency bonus from total level, ability modifiers,
skill modifiers, AC from worn armor and shield, initiative, passive perception, max HP from hit die
rolls and CON, spell slots from the caster-level tables (including multiclass caster level), spell
save DC and attack bonus, wild shape limits, death-save state.

The line: if the ruleset *tells you a value* (slot table, hit die size, proficiency bonus), compute
it. If the ruleset *grants the character something* (a skill, a trait, a proficiency), write the
grant to history when it happens (creation, `addLevel`, import), and never derive it from ruleset
data at read time. Existing characters get a one-off backfill (`utils/backfill-proficiencies.ts` is
the model: a service with the logic and a test, a thin script with `--prod`, idempotent, run by hand
right after deploy from the deployed commit). This keeps the sheet stable when rulesets change and
keeps "everything about the character" in its history.

## computeCharacter

`services/computeCharacter.ts` loads every history table for the character (sequentially, ~15
queries), folds them, applies the ruleset, and returns a `ComputedCharacter`: the `Character` row
plus every derived field the sheet, the PDF, and Reed's `character_status` tool use.
`computeSpells` and `computeCharacterItems` are its two helpers.

Item effects are applied in a fixed order, interleaved with the base calculation. Keep this order
when adding to the function:

1. Effects targeting an **ability** (`add`/`set`/`proficiency`) change the raw score before
   modifiers are derived.
2. Effects granting **skill proficiency/expertise** change the proficiency level before skill
   modifiers are computed.
3. Effects **adding to a skill** modifier apply after it is computed.
4. Effects on **AC, speed, initiative, passive perception** apply last, after armor and species.

`armorClass`, `speed`, `initiative`, `passivePerception` are computed as base values first and
modified at the end. Unarmored Defense and class speed bonuses are not applied yet (issue #109);
the refactor planned for that is in [plans/2026-10-architecture-cleanup.md](plans/2026-10-architecture-cleanup.md#5-computecharacter-pipeline).

`computeCharacter` runs on every authorized request (`authorizeCharacter` calls it), and again
inside `withLockedCharacter` for writes. It is read-only: **nothing writes to the database on a read
path.**

## Rulesets and catalogs

A character has a `ruleset`: `srd51` (D&D 5e 2014) or `srd52` (5.2.1, the 2024 rules).
`getRuleset(id)` (`lib/dnd/rulesets.ts`) returns the `Ruleset` object (`lib/dnd.ts`): species,
classes, backgrounds, lineages/subclasses, and the spellcasting tables as functions. Anything
rules-related takes the character's ruleset; don't hardcode one.

Two kinds of rules data:

- **Rules** are code: `srd51.ts`, `srd52.ts`, `lib/dnd/*.ts` (slot tables, multiclass math, wild
  shape limits, death saves, proficiency grants). Hand-written, tested as code.
- **Catalogs** are data with stable ids that characters reference by id: spells (`lib/dnd/spells/`),
  beasts (`lib/dnd/beasts/`), item templates (`lib/dnd/itemTemplates/`). A catalog is per ruleset.
  **Ids never change**; if one must, write a migration that remaps the characters that use it
  (`migrations/20261012173005_remap_black_tentacles_spell_id.sql`). Where a catalog is generated
  from `refdocs/` (`utils/generate-srd51-spells.ts`), the generated file is checked in, hand
  corrections go in an overrides file (`utils/srd51-spell-overrides.ts`), and a test fails when
  the output is stale. Don't hand-edit a generated file.

`refdocs/` holds the SRD PDFs and vendored markdown (`mise run srd:sync`), which is the source of
truth for both, and what the rules browser (`/rules`) and Reed's `read_rule` tool read.

## Migrations

dbmate, in `migrations/`; `mise run dbmate new <name>` creates one, `mise run db:upgrade` applies
them, and `db/schema.sql` is regenerated (commit it; if `mise run dbmate up` only rewrote its
`\restrict` token, `jj restore` it). Migrations are plain SQL with `-- migrate:up` / `-- migrate:down`
and a comment saying why. Production migrations run as a Cloud Run job before the new revision
deploys (see [deploy.md](deploy.md)), so a migration must work against the previous code too:
add columns nullable or with defaults, and backfill afterwards with a script.
