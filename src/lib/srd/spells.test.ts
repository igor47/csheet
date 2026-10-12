import { describe, expect, test } from "bun:test"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { getSpells, type Spell } from "@src/lib/dnd/spells"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import {
  getSrdSpells,
  normalizeSpellName,
  type SrdSpellText,
  toCastingTime,
  toComponents,
  toDuration,
} from "@src/lib/srd/spells"
import { buildSrd51Spells } from "../../../utils/generate-srd51-spells"

/** The header fields both catalogs must agree with the SRD on */
function headline(spell: Spell) {
  return {
    level: spell.level as number,
    school: spell.school,
    classes: [...spell.classes].sort(),
    ritual: spell.ritual ?? false,
    castingTime: spell.castingTime.type,
    verbal: spell.components.verbal,
    somatic: spell.components.somatic,
    material: spell.components.material !== undefined,
    duration: spell.duration.type,
  }
}

function srdHeadline(text: SrdSpellText) {
  const components = toComponents(text.components)
  return {
    level: text.level,
    school: text.school,
    classes: text.classes,
    ritual: text.ritual,
    castingTime: toCastingTime(text.castingTime).type,
    verbal: components.verbal,
    somatic: components.somatic,
    material: components.material !== undefined,
    duration: toDuration(text.duration).type,
  }
}

describe.each([SRD51_ID, SRD52_ID] as RulesetId[])("the %s spell catalog", (ruleset) => {
  const catalog = getSpells(ruleset)

  test("has unique ids", () => {
    const ids = catalog.map((s) => s.id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  test("has every SRD spell, and only homebrew spells besides", async () => {
    const srdNames = (await getSrdSpells(ruleset)).map((s) => normalizeSpellName(s.name))
    const catalogNames = catalog.map((s) => normalizeSpellName(s.name))
    expect(srdNames.filter((n) => !catalogNames.includes(n))).toEqual([])

    const extras = catalog.filter((s) => !srdNames.includes(normalizeSpellName(s.name)))
    for (const spell of extras) expect(spell.source).toBe("Homebrew")
  })

  test("matches the SRD's level, school, classes, casting time, components and duration", async () => {
    const byName = new Map(catalog.map((s) => [normalizeSpellName(s.name), s]))
    for (const text of await getSrdSpells(ruleset)) {
      const spell = byName.get(normalizeSpellName(text.name))!
      expect({ name: text.name, ...headline(spell) }).toEqual({
        name: text.name,
        ...srdHeadline(text),
      })
    }
  })
})

describe("the SRD 5.1 catalog", () => {
  test("is up to date with the generator (re-run utils/generate-srd51-spells.ts)", async () => {
    const { spells, missing } = await buildSrd51Spells()
    expect(missing).toEqual([])
    expect(getSpells(SRD51_ID)).toEqual(spells)
  })

  test("keeps the SRD 5.2.1 id for spells in both editions", () => {
    const ids52 = new Map(getSpells(SRD52_ID).map((s) => [normalizeSpellName(s.name), s.id]))
    for (const spell of getSpells(SRD51_ID)) {
      const id52 = ids52.get(normalizeSpellName(spell.name))
      if (id52) expect(spell.id).toBe(id52)
    }
  })

  test("uses the 5.1 mechanics where the editions differ", () => {
    const cureWounds = getSpells(SRD51_ID).find((s) => s.name === "Cure Wounds")!
    expect(cureWounds.healingDice).toEqual([8])
    const chillTouch = getSpells(SRD51_ID).find((s) => s.name === "Chill Touch")!
    expect(chillTouch.resolution).toEqual({ kind: "attack", attackType: "rangedSpell" })
    expect(chillTouch.damage).toEqual([{ type: "necrotic", dice: [8] }])
  })
})
