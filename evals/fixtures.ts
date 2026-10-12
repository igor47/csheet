import type { User } from "@src/db/users"
import type { ClassNameType } from "@src/lib/dnd"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { computeCharacter } from "@src/services/computeCharacter"
import { characterFactory } from "@src/test/factories/character"
import { TOOL_EXECUTORS } from "@src/tools"
import type { SQL } from "bun"

type Abilities = Partial<
  Record<"strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma", number>
>

export interface CharacterSpec extends Abilities {
  ruleset?: RulesetId
  species?: string
  class: ClassNameType
  level: number
  subclass?: string
  coins?: { pp?: number; gp?: number; ep?: number; sp?: number; cp?: number }
  /** Wizard spellbook spell ids */
  spellbook?: string[]
  /** Spells to prepare, as [class, spell id, cantrip or spell] */
  prepared?: [ClassNameType, string, "cantrip" | "spell"][]
  /** Hit points lost */
  damage?: number
}

/**
 * Run a tool the way an approved call would, so fixtures go through the same validation as Reed
 */
// biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
async function apply(db: SQL, characterId: string, tool: string, params: Record<string, any>) {
  const char = await computeCharacter(db, characterId)
  const executor = TOOL_EXECUTORS[tool]
  if (!char || !executor) throw new Error(`fixture: cannot run ${tool}`)
  const result = await executor(db, char, params)
  if (!result.complete) {
    throw new Error(`fixture: ${tool} ${JSON.stringify(params)} failed: ${JSON.stringify(result)}`)
  }
}

/** Build a character for an eval case */
export async function makeCharacter(db: SQL, user: User, spec: CharacterSpec) {
  const character = await characterFactory.create(
    {
      user_id: user.id,
      ruleset: spec.ruleset ?? SRD51_ID,
      species: spec.species ?? "human",
      class: spec.class,
      level: spec.level,
      subclass: spec.subclass,
      strength: spec.strength,
      dexterity: spec.dexterity,
      constitution: spec.constitution,
      intelligence: spec.intelligence,
      wisdom: spec.wisdom,
      charisma: spec.charisma,
    },
    db
  )

  if (spec.coins) {
    await apply(db, character.id, "update_coins", { ...spec.coins, note: "Starting coins" })
  }
  for (const spellId of spec.spellbook ?? []) {
    await apply(db, character.id, "learn_spell", { spell_id: spellId })
  }
  for (const [cls, spellId, type] of spec.prepared ?? []) {
    await apply(db, character.id, "prepare_spell", {
      class: cls,
      spell_id: spellId,
      spell_type: type,
    })
  }
  if (spec.damage) {
    await apply(db, character.id, "update_hit_points", { action: "lose", amount: spec.damage })
  }

  return character
}
