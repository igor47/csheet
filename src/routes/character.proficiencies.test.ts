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
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

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

  describe("importing a fighter 2 / rogue 2", () => {
    async function importWith(fields: Record<string, string>) {
      const form = new FormData()
      for (const [key, value] of Object.entries({
        name: "Tied Tamsin",
        species: "human",
        background: "acolyte",
        ruleset: SRD51_ID,
        classes_fighter: "on",
        levels_fighter: "2",
        classes_rogue: "on",
        levels_rogue: "2",
        ability_strength: "14",
        ability_dexterity: "12",
        ability_constitution: "14",
        ability_intelligence: "10",
        ability_wisdom: "15",
        ability_charisma: "8",
        max_hp: "30",
        is_check: "false",
        ...fields,
      })) {
        form.append(key, value)
      }
      const response = await makeRequest(testCtx.app, "/characters/import", {
        user,
        method: "POST",
        body: form,
      })
      expect(response.status).toBe(204)
      return response.headers.get("HX-Redirect")!.split("/").pop()!
    }

    test("offers a starting class, defaulting to the first in class order on a tie", async () => {
      const form = new FormData()
      for (const [key, value] of Object.entries({
        classes_fighter: "on",
        levels_fighter: "2",
        classes_rogue: "on",
        levels_rogue: "2",
        is_check: "true",
      })) {
        form.append(key, value)
      }
      const response = await makeRequest(testCtx.app, "/characters/import", {
        user,
        method: "POST",
        body: form,
      })
      const document = await parseHtml(response)
      const selected = expectElement(document, "select[name='starting_class'] option[selected]")
      expect(selected.getAttribute("value")).toBe("fighter")
    })

    async function liveCheck(fields: Record<string, string>) {
      const form = new FormData()
      for (const [key, value] of Object.entries({ is_check: "true", ...fields })) {
        form.append(key, value)
      }
      const response = await makeRequest(testCtx.app, "/characters/import", {
        user,
        method: "POST",
        body: form,
      })
      return parseHtml(response)
    }

    test("keeps the default following the levels until the player picks one", async () => {
      const document = await liveCheck({
        classes_fighter: "on",
        levels_fighter: "2",
        classes_rogue: "on",
        levels_rogue: "3",
        // the default from the last render, posted back unchosen
        starting_class: "fighter",
        starting_class_chosen: "false",
      })
      const selected = expectElement(document, "select[name='starting_class'] option[selected]")
      expect(selected.getAttribute("value")).toBe("rogue")
    })

    test("keeps the player's pick when levels change", async () => {
      const document = await liveCheck({
        classes_fighter: "on",
        levels_fighter: "2",
        classes_rogue: "on",
        levels_rogue: "3",
        starting_class: "fighter",
        starting_class_chosen: "true",
      })
      const selected = expectElement(document, "select[name='starting_class'] option[selected]")
      expect(selected.getAttribute("value")).toBe("fighter")
    })

    test("falls back to the default when the chosen class is unchecked", async () => {
      const document = await liveCheck({
        classes_fighter: "on",
        levels_fighter: "2",
        classes_wizard: "on",
        levels_wizard: "1",
        starting_class: "rogue",
        starting_class_chosen: "true",
      })
      const select = expectElement(document, "select[name='starting_class']")
      expect(select.classList.contains("is-invalid")).toBe(false)
      const selected = expectElement(document, "select[name='starting_class'] option[selected]")
      expect(selected.getAttribute("value")).toBe("fighter")
    })

    test("without a choice, starts as a fighter, with heavy armor", async () => {
      const characterId = await importWith({})
      const profs = await proficiencyNames(testCtx.db, characterId)
      expect(profs.armor).toEqual(["heavy armor", "light armor", "medium armor", "shields"])
    })

    test("starting as a rogue gets no heavy armor from the fighter multiclass", async () => {
      const characterId = await importWith({ starting_class: "rogue" })
      const profs = await proficiencyNames(testCtx.db, characterId)
      expect(profs.armor).toEqual(["light armor", "medium armor", "shields"])
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

describe("the Proficiencies & Languages panel", () => {
  const testCtx = useTestApp()
  let user: User
  let character: Character

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
    character = await characterFactory.create(
      { user_id: user.id, class: "fighter", level: 1, species: "dwarf", background: "soldier" },
      testCtx.db
    )
  })

  describe("GET /characters/:id", () => {
    test("shows proficiencies grouped by kind", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
      const document = await parseHtml(response)

      const panel = expectElement(document, "#proficiencies-panel")
      const weapons = expectElement(
        panel as unknown as Document,
        "[data-proficiency-kind='weapon']"
      )
      expect(weapons.textContent).toContain("Martial Weapons")
      expect(weapons.textContent).toContain("Battleaxe")
      const languages = expectElement(
        panel as unknown as Document,
        "[data-proficiency-kind='language']"
      )
      expect(languages.textContent).toContain("Dwarvish")
      expect(panel.textContent).toContain("Vehicles (land)")
    })

    test("says where each one came from", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
      const document = await parseHtml(response)

      const shields = expectElement(document, "#proficiencies-panel [data-proficiency='shields']")
      expect(shields.getAttribute("title")).toBe("From Fighter (class)")
    })

    test("hints that chosen proficiencies are added by hand", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
      const document = await parseHtml(response)

      expect(expectElement(document, "#proficiencies-choices-hint").textContent).toContain(
        "add them with Edit Proficiencies"
      )
    })

    test("no longer has the placeholder box in the skills panel", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
      const document = await parseHtml(response)

      expect(document.querySelector("#skills-panel textarea")).toBeNull()
    })
  })

  describe("GET /characters/:id/history/proficiencies", () => {
    test("is refused for someone else, and writes nothing", async () => {
      const before = await findProficiencyEvents(testCtx.db, character.id)
      const stranger = await userFactory.create({}, testCtx.db)
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/history/proficiencies`,
        { user: stranger }
      )

      expect(response.status).not.toBe(200)
      expect(await findProficiencyEvents(testCtx.db, character.id)).toEqual(before)
    })

    test("lists the granted proficiencies with their source", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/history/proficiencies`,
        { user }
      )
      const document = await parseHtml(response)
      const shields = Array.from(document.querySelectorAll("tbody tr")).find((row) =>
        row.textContent?.includes("Shields")
      )!

      expect(shields.textContent).toContain("Fighter (class)")
    })
  })

  describe("GET /characters/:id/edit/proficiencies", () => {
    test("renders the edit form with a remove checkbox per proficiency", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/proficiencies`,
        { user }
      )
      const document = await parseHtml(response)

      expect(expectElement(document, ".modal-title").textContent).toBe("Edit Proficiencies")
      expectElement(document, "input[name='remove:armor:heavy armor'][type='checkbox']")
      expectElement(document, "select[name='add_kind']")
      expectElement(document, "datalist#proficiency-suggestions option[value='longsword']")
    })
  })

  describe("POST /characters/:id/edit/proficiencies", () => {
    async function submit(fields: Record<string, string>) {
      const form = new FormData()
      for (const [key, value] of Object.entries({ is_check: "false", ...fields })) {
        form.append(key, value)
      }
      return makeRequest(testCtx.app, `/characters/${character.id}/edit/proficiencies`, {
        user,
        method: "POST",
        body: form,
      })
    }

    describe("adding tools", () => {
      let response: Response

      beforeEach(async () => {
        response = await submit({
          add_kind: "tool",
          add_names: "Smith's Tools, poisoner's kit",
          source_detail: "Downtime training",
          note: "Learned from the blacksmith",
        })
      })

      test("adds them and refreshes the panel", async () => {
        expect(response.headers.get("HX-Trigger")).toBe("closeDetailModal")
        const document = await parseHtml(response)
        const panel = expectElement(document, "#proficiencies-panel[hx-swap-oob='true']")
        expect(panel.textContent).toContain("Smith's Tools")
        expect(panel.textContent).toContain("Poisoner's Kit")
      })

      test("records them as added by hand, with the source and note", async () => {
        const events = await findProficiencyEvents(testCtx.db, character.id)
        expect(events.find((e) => e.name === "smith's tools")).toMatchObject({
          action: "add",
          source_detail: "Downtime training",
          note: "Learned from the blacksmith",
        })
      })

      test("shows them in the history", async () => {
        const history = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/proficiencies`,
          { user }
        )
        const document = await parseHtml(history)
        const firstRow = expectElement(document, "tbody tr")
        expect(firstRow.textContent).toContain("Added")
        expect(document.body.textContent).toContain("Learned from the blacksmith")
      })
    })

    describe("removing a proficiency", () => {
      beforeEach(async () => {
        await submit({ "remove:armor:heavy armor": "on" })
      })

      test("removes it", async () => {
        const profs = await proficiencyNames(testCtx.db, character.id)
        expect(profs.armor).not.toContain("heavy armor")
        expect(profs.armor).toContain("medium armor")
      })

      test("can be added back by hand", async () => {
        await submit({ add_kind: "armor", add_names: "heavy" })
        const char = await computeCharacter(testCtx.db, character.id)
        expect(char!.proficiencies.find((p) => p.name === "heavy armor")).toMatchObject({
          source: "custom",
        })
      })
    })

    test("rejects adding one the character already has", async () => {
      const response = await submit({ add_kind: "weapon", add_names: "Battleaxes" })
      const document = await parseHtml(response)

      expect(document.body.textContent).toContain("Already proficient with Battleaxe")
    })

    test("rejects removing and adding back the same one as no change", async () => {
      const before = await findProficiencyEvents(testCtx.db, character.id)
      const response = await submit({
        "remove:armor:heavy armor": "on",
        add_kind: "armor",
        add_names: "Heavy Armor",
      })
      const document = await parseHtml(response)

      expect(document.body.textContent).toContain("Add or remove at least one proficiency")
      expect(await findProficiencyEvents(testCtx.db, character.id)).toEqual(before)
    })

    test("rejects a name that doesn't fit the kind", async () => {
      const response = await submit({ add_kind: "weapon", add_names: "shields" })
      const document = await parseHtml(response)

      expect(document.body.textContent).toContain("Shields is an armor proficiency")
    })

    test("rejects an empty change", async () => {
      const response = await submit({})
      const document = await parseHtml(response)

      expect(document.body.textContent).toContain("Add or remove at least one proficiency")
    })

    test("doesn't save anything during live validation", async () => {
      const before = await findProficiencyEvents(testCtx.db, character.id)
      await submit({ is_check: "true", add_kind: "language", add_names: "Giant" })

      expect(await findProficiencyEvents(testCtx.db, character.id)).toEqual(before)
    })
  })
})
