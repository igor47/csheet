import { beforeEach, describe, expect, test } from "bun:test"
import {
  create as createProficiencyEvent,
  findByCharacterId as findProficiencyEvents,
} from "@src/db/char_proficiencies"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { ulid } from "@src/lib/ids"
import { computeCharacter } from "@src/services/computeCharacter"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { makeRequest } from "@src/test/http"

async function proficiencyNames(db: Parameters<typeof computeCharacter>[0], characterId: string) {
  const char = await computeCharacter(db, characterId)
  const names = (kind: string) =>
    char!.proficiencies.filter((p) => p.kind === kind).map((p) => p.name)
  return {
    weapon: names("weapon"),
    armor: names("armor"),
    tool: names("tool"),
    language: names("language"),
  }
}

function newCharacterForm(fields: Record<string, string>): FormData {
  const form = new FormData()
  const base: Record<string, string> = {
    name: "Proficient Pat",
    species: "human",
    background: "sage",
    alignment: "Lawful Good",
    ruleset: SRD51_ID,
    ability_method: "standard-array",
    ability_str: "15",
    ability_dex: "14",
    ability_con: "13",
    ability_int: "12",
    ability_wis: "10",
    ability_cha: "8",
    is_check: "false",
  }
  for (const [key, value] of Object.entries({ ...base, ...fields })) {
    form.append(key, value)
  }
  return form
}

async function createViaForm(app: Parameters<typeof makeRequest>[0], user: User, form: FormData) {
  const response = await makeRequest(app, "/characters/new", { user, method: "POST", body: form })
  expect(response.status).toBe(204)
  return response.headers.get("HX-Redirect")!.split("/").pop()!
}

describe("granting proficiencies", () => {
  const testCtx = useTestApp()
  let user: User

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
  })

  describe("creating a fighter", () => {
    let characterId: string

    beforeEach(async () => {
      characterId = await createViaForm(
        testCtx.app,
        user,
        newCharacterForm({
          class: "fighter",
          class_proficiency_athletics: "true",
          class_proficiency_perception: "true",
        })
      )
    })

    test("grants the fighter's weapons and armor", async () => {
      const profs = await proficiencyNames(testCtx.db, characterId)
      expect(profs.weapon).toEqual(["martial weapons", "simple weapons"])
      expect(profs.armor).toEqual(["heavy armor", "light armor", "medium armor", "shields"])
    })

    test("grants the species' languages", async () => {
      const profs = await proficiencyNames(testCtx.db, characterId)
      expect(profs.language).toEqual(["common"])
    })

    describe("then multiclassing into rogue", () => {
      beforeEach(async () => {
        const form = new FormData()
        form.append("class", "rogue")
        form.append("hit_die_roll", "5")
        const response = await makeRequest(testCtx.app, `/characters/${characterId}/edit/class`, {
          user,
          method: "POST",
          body: form,
        })
        expect(response.status).toBe(200)
      })

      test("grants only the rogue's multiclassing proficiencies", async () => {
        const profs = await proficiencyNames(testCtx.db, characterId)
        expect(profs.tool).toEqual(["thieves' tools"])
        expect(profs.language).toEqual(["common", "thieves' cant"])
        // rapiers come with the rogue's starting proficiencies, not its multiclassing ones
        expect(profs.weapon).not.toContain("rapier")
      })
    })
  })

  describe("creating a wizard and multiclassing into fighter", () => {
    let characterId: string

    beforeEach(async () => {
      characterId = await createViaForm(
        testCtx.app,
        user,
        newCharacterForm({
          class: "wizard",
          background: "criminal",
          species: "dwarf",
          lineage: "hill dwarf",
          class_proficiency_arcana: "true",
          class_proficiency_history: "true",
        })
      )
      const form = new FormData()
      form.append("class", "fighter")
      form.append("hit_die_roll", "7")
      await makeRequest(testCtx.app, `/characters/${characterId}/edit/class`, {
        user,
        method: "POST",
        body: form,
      })
    })

    test("has the wizard's weapons, the fighter's multiclass weapons, and the dwarf's", async () => {
      const profs = await proficiencyNames(testCtx.db, characterId)
      expect(profs.weapon).toEqual(
        expect.arrayContaining(["dagger", "quarterstaff", "martial weapons", "battleaxe"])
      )
    })

    test("doesn't get heavy armor, which multiclassing fighters don't learn", async () => {
      const profs = await proficiencyNames(testCtx.db, characterId)
      expect(profs.armor).toEqual(["light armor", "medium armor", "shields"])
    })

    test("has the background's tools and the species' languages", async () => {
      const profs = await proficiencyNames(testCtx.db, characterId)
      expect(profs.tool).toEqual(["thieves' tools"])
      expect(profs.language).toEqual(["common", "dwarvish"])
    })

    test("says where each proficiency came from", async () => {
      const char = await computeCharacter(testCtx.db, characterId)
      const find = (name: string) => char!.proficiencies.find((p) => p.name === name)
      expect(find("martial weapons")).toMatchObject({ source: "class", source_detail: "fighter" })
      expect(find("dagger")).toMatchObject({ source: "class", source_detail: "wizard" })
      expect(find("battleaxe")).toMatchObject({ source: "species", source_detail: "dwarf" })
    })

    test("records them in the character's history, with their source", async () => {
      const events = await findProficiencyEvents(testCtx.db, characterId)
      expect(events.find((e) => e.name === "martial weapons")).toMatchObject({
        action: "add",
        source: "class",
        source_detail: "fighter",
      })
      expect(events.find((e) => e.name === "dwarvish")).toMatchObject({
        action: "add",
        source: "species",
        source_detail: "dwarf",
      })
    })
  })

  describe("creating an SRD 5.2 rogue", () => {
    let characterId: string

    beforeEach(async () => {
      characterId = await createViaForm(
        testCtx.app,
        user,
        newCharacterForm({
          ruleset: SRD52_ID,
          class: "rogue",
          background: "criminal",
          species: "elf",
          lineage: "high elf",
          background_ability_dex_bonus: "2",
          background_ability_con_bonus: "1",
          class_proficiency_acrobatics: "true",
          class_proficiency_insight: "true",
          class_proficiency_perception: "true",
          class_proficiency_persuasion: "true",
        })
      )
    })

    test("grants the 5.2 rogue's weapons", async () => {
      const profs = await proficiencyNames(testCtx.db, characterId)
      expect(profs.weapon).toEqual(["martial weapons (finesse or light)", "simple weapons"])
      expect(profs.language).toEqual(["common", "thieves' cant"])
    })
  })

  describe("importing a multiclass character", () => {
    let characterId: string

    beforeEach(async () => {
      const form = new FormData()
      for (const [key, value] of Object.entries({
        name: "Imported Ida",
        species: "halfling",
        lineage: "lightfoot",
        background: "acolyte",
        ruleset: SRD51_ID,
        classes_cleric: "on",
        levels_cleric: "3",
        subclass_cleric: "life domain",
        classes_barbarian: "on",
        levels_barbarian: "1",
        ability_strength: "14",
        ability_dexterity: "12",
        ability_constitution: "14",
        ability_intelligence: "10",
        ability_wisdom: "15",
        ability_charisma: "8",
        max_hp: "30",
        is_check: "false",
      })) {
        form.append(key, value)
      }
      const response = await makeRequest(testCtx.app, "/characters/import", {
        user,
        method: "POST",
        body: form,
      })
      expect(response.status).toBe(204)
      characterId = response.headers.get("HX-Redirect")!.split("/").pop()!
    })

    test("grants the main class fully and the other as a multiclass", async () => {
      const profs = await proficiencyNames(testCtx.db, characterId)
      // cleric: all armor and simple weapons; barbarian multiclass: shields, simple, martial
      expect(profs.armor).toEqual(["heavy armor", "light armor", "medium armor", "shields"])
      expect(profs.weapon).toEqual(["martial weapons", "simple weapons"])
      expect(profs.language).toEqual(["common", "halfling"])
    })
  })

  describe("a character created before proficiencies were tracked", () => {
    let character: Character

    beforeEach(async () => {
      // the factory writes levels directly, the way old characters were stored
      character = await characterFactory.create(
        {
          user_id: user.id,
          class: "wizard",
          level: 2,
          species: "elf",
          lineage: "wood elf",
          legacy: true,
          background: "urchin",
        },
        testCtx.db
      )
      await testCtx.db`
        INSERT INTO char_levels (id, character_id, class, level, hit_die_roll)
        VALUES (${ulid()}, ${character.id}, 'fighter', 1, 6)
      `
    })

    test("has none until it's backfilled", async () => {
      const profs = await proficiencyNames(testCtx.db, character.id)
      expect(profs).toEqual({ weapon: [], armor: [], tool: [], language: [] })
    })

    test("writes nothing on read, even with several loads at once (no write-on-read backfill)", async () => {
      await Promise.all([
        makeRequest(testCtx.app, `/characters/${character.id}`, { user }),
        computeCharacter(testCtx.db, character.id),
        computeCharacter(testCtx.db, character.id),
      ])
      expect(await findProficiencyEvents(testCtx.db, character.id)).toEqual([])
    })

    test("writes nothing when a non-owner tries to view it (no write-on-read backfill)", async () => {
      const stranger = await userFactory.create({}, testCtx.db)
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, {
        user: stranger,
      })
      expect(response.status).not.toBe(200)
      expect(await findProficiencyEvents(testCtx.db, character.id)).toEqual([])
    })
  })

  describe("a manual removal, then multiclassing into a class that grants it", () => {
    let character: Character

    beforeEach(async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 1, species: "human", background: "sage" },
        testCtx.db
      )
      await createProficiencyEvent(testCtx.db, {
        character_id: character.id,
        kind: "armor",
        name: "light armor",
        action: "remove",
        source: "custom",
        source_detail: null,
        note: "DM ruling",
      })
      const form = new FormData()
      form.append("class", "rogue")
      form.append("hit_die_roll", "5")
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/class`, {
        user,
        method: "POST",
        body: form,
      })
      expect(response.status).toBe(200)
    })

    test("doesn't grant the removed proficiency again", async () => {
      const profs = await proficiencyNames(testCtx.db, character.id)
      expect(profs.armor).toEqual([])
      // the rest of the multiclass set still arrives
      expect(profs.tool).toEqual(["thieves' tools"])
    })
  })
})
