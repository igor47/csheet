import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import { create as createItemEffect } from "@src/db/item_effects"
import type { User } from "@src/db/users"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { computeCharacter } from "@src/services/computeCharacter"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { itemFactory } from "@src/test/factories/item"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("weapons in hand", () => {
  const testCtx = useTestApp()
  let user: User
  let character: Character

  async function weaponRow(name: string) {
    const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
    const document = await parseHtml(response)
    const info = expectElement(document, "#character-info")
    const button = Array.from(info.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === name
    )
    if (!button) throw new Error(`no weapon in hand named ${name}`)
    // the row holding the weapon's name, damage, and attack bonus
    return button.parentElement!.parentElement!
  }

  function attackBadge(row: Element) {
    const badge = row.querySelector("[data-attack-bonus]")
    if (!badge) throw new Error("no attack bonus shown")
    return badge
  }

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
  })

  describe("a level 1 fighter with STR 16 wielding a longsword", () => {
    beforeEach(async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 1, strength: 16, dexterity: 12 },
        testCtx.db
      )
      await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "Longsword",
          category: "weapon",
          martial: true,
          wielded: true,
          damage: [
            { dice: [8], type: "slashing" },
            { dice: [10], type: "slashing", versatile: true },
          ],
        },
        testCtx.db
      )
    })

    test("is proficient, and hits at STR +3 plus proficiency +2", async () => {
      const badge = attackBadge(await weaponRow("Longsword"))
      expect(badge.getAttribute("data-proficient")).toBe("true")
      expect(badge.textContent).toContain("+5 to hit")
      expect(badge.getAttribute("title")).toBe("Proficient. To hit: STR +3, proficiency +2")
    })

    test("adds STR to the damage, spelled out", async () => {
      const row = await weaponRow("Longsword")
      expect(row.textContent).toContain("1d8 + 3 STR slashing, 1d10 + 3 STR slashing (2-handed)")
    })

    describe("with a +1 enchantment on the sword and a ring of accuracy", () => {
      beforeEach(async () => {
        const [sword] = await testCtx.db`SELECT id FROM items WHERE name = 'Longsword'`
        await createItemEffect(testCtx.db, {
          item_id: sword.id,
          target: "attack",
          op: "add",
          value: 1,
          applies: "wielded",
        })
        await createItemEffect(testCtx.db, {
          item_id: sword.id,
          target: "damage",
          op: "add",
          value: 1,
          applies: "wielded",
        })
        const ring = await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Ring of Accuracy",
            category: "jewelry",
            worn: true,
          },
          testCtx.db
        )
        await createItemEffect(testCtx.db, {
          item_id: ring.id,
          target: "attack",
          op: "add",
          value: 1,
          applies: "worn",
        })
      })

      test("adds the item bonuses", async () => {
        const row = await weaponRow("Longsword")
        expect(attackBadge(row).textContent).toContain("+7 to hit")
        expect(row.textContent).toContain("1d8 + 3 STR + 1 from Longsword slashing")
      })
    })
  })

  describe("a wizard with DEX 14 and STR 8", () => {
    beforeEach(async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 1, strength: 8, dexterity: 14 },
        testCtx.db
      )
    })

    describe("wielding a longsword", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Longsword",
            category: "weapon",
            wielded: true,
            damage: [{ dice: [8], type: "slashing" }],
          },
          testCtx.db
        )
      })

      test("isn't proficient, so gets no proficiency bonus", async () => {
        const row = await weaponRow("Longsword")
        const badge = attackBadge(row)
        expect(badge.getAttribute("data-proficient")).toBe("false")
        expect(badge.textContent).toContain("-1 to hit")
        expect(row.textContent).toContain("1d8 - 1 STR slashing")
      })
    })

    describe("wielding a dagger", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Dagger",
            category: "weapon",
            finesse: true,
            thrown: true,
            normal_range: 20,
            long_range: 60,
            wielded: true,
            damage: [{ dice: [4], type: "piercing" }],
          },
          testCtx.db
        )
      })

      test("is proficient and uses DEX, since daggers are finesse weapons", async () => {
        const badge = attackBadge(await weaponRow("Dagger"))
        expect(badge.getAttribute("data-proficient")).toBe("true")
        expect(badge.textContent).toContain("+4 to hit")
        expect(badge.getAttribute("title")).toContain("DEX +2")
      })
    })

    describe("wielding a custom weapon", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Grandpa's Boomstick",
            category: "weapon",
            martial: true,
            normal_range: 30,
            long_range: 90,
            wielded: true,
            damage: [{ dice: [10], type: "piercing" }],
          },
          testCtx.db
        )
      })

      test("goes by its category and range: a martial ranged weapon, not proficient", async () => {
        const row = await weaponRow("Grandpa's Boomstick")
        const badge = attackBadge(row)
        expect(badge.getAttribute("data-proficient")).toBe("false")
        expect(badge.textContent).toContain("+2 to hit")
      })

      describe("once the wizard learns it", () => {
        beforeEach(async () => {
          await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
          const form = new FormData()
          form.append("add_kind", "weapon")
          form.append("add_names", "Grandpa's Boomstick")
          form.append("is_check", "false")
          await makeRequest(testCtx.app, `/characters/${character.id}/edit/proficiencies`, {
            user,
            method: "POST",
            body: form,
          })
        })

        test("is proficient with it", async () => {
          const badge = attackBadge(await weaponRow("Grandpa's Boomstick"))
          expect(badge.getAttribute("data-proficient")).toBe("true")
          expect(badge.textContent).toContain("+4 to hit")
        })
      })
    })

    describe("wearing chain mail", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Chain Mail",
            category: "armor",
            armor_type: "heavy",
            armor_class: 16,
            worn: true,
          },
          testCtx.db
        )
      })

      test("warns that the wizard isn't proficient with it", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
        const document = await parseHtml(response)
        const warning = expectElement(document, "#armor-proficiency-warning")
        expect(warning.textContent).toContain("Chain Mail (Heavy Armor)")
      })

      test("says so in the AC's hover text too", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
        const document = await parseHtml(response)
        const ac = Array.from(document.querySelectorAll("#character-info .border.rounded")).find(
          (el) => el.textContent?.includes("Armor Class")
        )!
        expect(ac.getAttribute("title")).toContain("Not proficient with Chain Mail (Heavy Armor)")
      })
    })
  })

  describe("an SRD 5.2 monk wielding a scimitar and a longsword", () => {
    beforeEach(async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "monk", level: 1, ruleset: SRD52_ID, dexterity: 16 },
        testCtx.db
      )
      for (const name of ["Scimitar", "Longsword"]) {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name,
            category: "weapon",
            wielded: true,
            damage: [{ dice: [6], type: "slashing" }],
          },
          testCtx.db
        )
      }
    })

    test("is proficient with the scimitar, a light martial weapon", async () => {
      const badge = attackBadge(await weaponRow("Scimitar"))
      expect(badge.getAttribute("data-proficient")).toBe("true")
    })

    test("isn't proficient with the longsword", async () => {
      const badge = attackBadge(await weaponRow("Longsword"))
      expect(badge.getAttribute("data-proficient")).toBe("false")
    })
  })

  describe("a fighter in chain mail", () => {
    beforeEach(async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 1 },
        testCtx.db
      )
      await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "Chain Mail",
          category: "armor",
          armor_type: "heavy",
          armor_class: 16,
          worn: true,
        },
        testCtx.db
      )
    })

    test("has no armor warning", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
      const document = await parseHtml(response)
      expect(document.querySelector("#armor-proficiency-warning")).toBeNull()
    })
  })

  describe("a flame tongue longsword with a flat bonus", () => {
    beforeEach(async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 1, strength: 16 },
        testCtx.db
      )
      await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "Flame Tongue Longsword",
          category: "weapon",
          martial: true,
          wielded: true,
          damage: [
            { dice: [8], type: "slashing", flat_bonus: 3 },
            { dice: [10], type: "slashing", versatile: true },
            { dice: [6, 6], type: "fire" },
          ],
        },
        testCtx.db
      )
    })

    test("adds STR to the sword damage only, not the fire", async () => {
      const row = await weaponRow("Flame Tongue Longsword")
      expect(row.textContent).toContain("1d10 + 3 STR slashing (2-handed)")
      expect(row.textContent).toContain("2d6 fire")
      expect(row.textContent).not.toContain("2d6 + 3")
    })

    test("shows a flat bonus separately from STR, so a double count is visible", async () => {
      const row = await weaponRow("Flame Tongue Longsword")
      expect(row.textContent).toContain("1d8 + 3 STR + 3 bonus slashing")
    })
  })

  describe("damage rows in other orders", () => {
    async function wield(name: string, damage: Parameters<typeof itemFactory.create>[0]["damage"]) {
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 1, strength: 16 },
        testCtx.db
      )
      await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name,
          category: "weapon",
          martial: true,
          wielded: true,
          damage,
        },
        testCtx.db
      )
      return (await weaponRow(name)).textContent
    }

    test("puts STR on the weapon's own damage even when a rider was added first", async () => {
      const text = await wield("Flame Tongue Longsword", [
        { dice: [6, 6], type: "fire" },
        { dice: [8], type: "slashing" },
      ])
      expect(text).toContain("2d6 fire")
      expect(text).toContain("1d8 + 3 STR slashing")
    })

    test("with only versatile damage, puts STR on the physical damage, not the rider", async () => {
      const text = await wield("Odd Blade", [
        { dice: [10], type: "slashing", versatile: true },
        { dice: [6], type: "fire", versatile: true },
      ])
      expect(text).toContain("1d10 + 3 STR slashing (2-handed)")
      expect(text).toContain("1d6 fire (2-handed)")
    })
  })

  describe("non-weapon items with attack effects", () => {
    beforeEach(async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 1, strength: 10 },
        testCtx.db
      )
      await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "Club",
          category: "weapon",
          wielded: true,
          damage: [{ dice: [4], type: "bludgeoning" }],
        },
        testCtx.db
      )
      const wand = await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "Wand of the War Mage",
          category: "wand",
          wielded: true,
        },
        testCtx.db
      )
      await createItemEffect(testCtx.db, {
        item_id: wand.id,
        target: "attack",
        op: "add",
        value: 1,
        applies: "wielded",
      })
    })

    test("a wand's attack bonus, meant for spells, doesn't apply to weapons", async () => {
      const badge = attackBadge(await weaponRow("Club"))
      expect(badge.textContent).toContain("+2 to hit")
    })
  })

  describe("a monk with STR 10 and DEX 18", () => {
    for (const ruleset of ["srd51", "srd52"] as const) {
      describe(`in ${ruleset}`, () => {
        beforeEach(async () => {
          character = await characterFactory.create(
            { user_id: user.id, class: "monk", level: 1, ruleset, strength: 10, dexterity: 18 },
            testCtx.db
          )
          for (const name of ["Quarterstaff", "Greatclub"]) {
            await itemFactory.create(
              {
                character_id: character.id,
                user_id: user.id,
                name,
                category: "weapon",
                wielded: true,
                damage: [{ dice: [6], type: "bludgeoning" }],
              },
              testCtx.db
            )
          }
        })

        test("uses DEX with a quarterstaff, a monk weapon", async () => {
          const badge = attackBadge(await weaponRow("Quarterstaff"))
          expect(badge.textContent).toContain("+6 to hit")
        })

        test(`${ruleset === "srd51" ? "uses STR" : "uses DEX"} with a two-handed greatclub`, async () => {
          const badge = attackBadge(await weaponRow("Greatclub"))
          // 5.1 monk weapons can't be two-handed; 5.2 allows any simple melee weapon
          expect(badge.textContent).toContain(ruleset === "srd51" ? "+2 to hit" : "+6 to hit")
        })
      })
    }
  })

  describe("a fighter with STR 16 and DEX 10 throwing a net", () => {
    beforeEach(async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 1, strength: 16, dexterity: 10 },
        testCtx.db
      )
      await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "Net",
          category: "weapon",
          martial: true,
          thrown: true,
          normal_range: 5,
          long_range: 15,
          wielded: true,
        },
        testCtx.db
      )
    })

    test("uses DEX, since a net is a ranged weapon though it's thrown", async () => {
      const badge = attackBadge(await weaponRow("Net"))
      expect(badge.getAttribute("title")).toContain("DEX +0")
      expect(badge.textContent).toContain("+2 to hit")
    })
  })

  describe("a wizard with a shield", () => {
    async function infoFor(ruleset: "srd51" | "srd52") {
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 1, ruleset, dexterity: 10 },
        testCtx.db
      )
      await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "Shield",
          category: "shield",
          armor_modifier: 2,
          wielded: true,
        },
        testCtx.db
      )
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
      const document = await parseHtml(response)
      const ac = Array.from(document.querySelectorAll("#character-info .border.rounded")).find(
        (el) => el.textContent?.includes("Armor Class")
      )!
      return { document, ac }
    }

    test("in SRD 5.2 gets no AC from it without training, and says why", async () => {
      const { document, ac } = await infoFor("srd52")
      expect(ac.textContent).toContain("10")
      expect(ac.getAttribute("title")).toContain("Shield adds no AC without shield training")
      expect(expectElement(document, "#armor-proficiency-warning").textContent).toContain(
        "No training with Shield (Shields): it adds no AC."
      )
    })

    test("in SRD 5.2 gets no AC from a magic shield's bonus either", async () => {
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 1, ruleset: "srd52", dexterity: 10 },
        testCtx.db
      )
      const shield = await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "+1 Shield",
          category: "shield",
          armor_modifier: 2,
          wielded: true,
        },
        testCtx.db
      )
      await createItemEffect(testCtx.db, {
        item_id: shield.id,
        target: "ac",
        op: "add",
        value: 1,
        applies: "wielded",
      })
      const char = await computeCharacter(testCtx.db, character.id)
      expect(char!.armorClass).toBe(10)
    })

    test("in SRD 5.1 gets the AC, with the untrained-armor penalties", async () => {
      const { document, ac } = await infoFor("srd51")
      expect(ac.textContent).toContain("12")
      expect(expectElement(document, "#armor-proficiency-warning").textContent).toContain(
        "Not proficient with Shield (Shields): disadvantage"
      )
    })
  })
})
