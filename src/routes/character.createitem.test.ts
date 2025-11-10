import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { computeCharacterItems } from "@src/services/computeCharacterItems"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("POST /characters/:id/edit/newitem", () => {
  const testCtx = useTestApp()

  describe("when selecting a weapon template", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    test("populates damage die and damage type dropdowns", async () => {
      // Make a POST request to select the Dagger template
      const formData = new FormData()
      formData.append("template", "Dagger")
      formData.append("prev_template", "")

      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/newitem`, {
        user,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify the item name is populated
      const nameInput = expectElement(document, 'input[name="name"]') as HTMLInputElement
      expect(nameInput.value).toBe("Dagger")

      // Verify the category is populated
      const categorySelect = expectElement(document, 'select[name="category"]') as HTMLSelectElement
      expect(categorySelect.value).toBe("weapon")

      // Verify the damage die value dropdown is populated (Dagger uses d4)
      const dieValueSelect = expectElement(
        document,
        'select[name="damage.0.die_value"]'
      ) as HTMLSelectElement
      expect(dieValueSelect.value).toBe("4")

      // Verify the damage type dropdown is populated (Dagger is piercing)
      const damageTypeSelect = expectElement(
        document,
        'select[name="damage.0.type"]'
      ) as HTMLSelectElement
      expect(damageTypeSelect.value).toBe("piercing")

      // Verify the number of dice input is populated
      const numDiceInput = expectElement(
        document,
        'input[name="damage.0.num_dice"]'
      ) as HTMLInputElement
      expect(numDiceInput.value).toBe("1")
    })
  })

  describe("when selecting a thrown weapon template with range", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    test("populates weapon_type, normal_range and long_range fields", async () => {
      // Make a POST request to select the Javelin template
      const formData = new FormData()
      formData.append("template", "Javelin")
      formData.append("prev_template", "")

      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/newitem`, {
        user,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify the weapon type is set to thrown
      const weaponTypeThrownRadio = expectElement(
        document,
        'input[name="weapon_type"][value="thrown"]'
      ) as HTMLInputElement
      expect(weaponTypeThrownRadio.hasAttribute("checked")).toBe(true)

      // Verify the normal range is populated (Javelin has 30ft)
      const normalRangeInput = expectElement(
        document,
        'input[name="normal_range"]'
      ) as HTMLInputElement
      expect(normalRangeInput.value).toBe("30")

      // Verify the long range is populated (Javelin has 120ft)
      const longRangeInput = expectElement(document, 'input[name="long_range"]') as HTMLInputElement
      expect(longRangeInput.value).toBe("120")
    })
  })

  describe("when creating items", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    describe("with valid data", () => {
      test("creates a simple weapon in the database", async () => {
        const formData = new FormData()
        formData.append("name", "Club")
        formData.append("category", "weapon")
        formData.append("weapon_type", "melee")
        formData.append("damage_row_count", "1")
        formData.append("damage.0.num_dice", "1")
        formData.append("damage.0.die_value", "4")
        formData.append("damage.0.type", "bludgeoning")
        formData.append("light", "true")
        formData.append("martial", "false")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/newitem`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        // Should return success (the inventory panel)
        expect(response.status).toBe(200)

        // Verify the item was created and appears in character's inventory
        const items = await computeCharacterItems(testCtx.db, character.id)
        expect(items.length).toBe(1)

        const item = items[0]
        if (!item) throw new Error("Item not found")
        expect(item.name).toBe("Club")
        expect(item.category).toBe("weapon")

        // Verify damage
        expect(item.damage.length).toBe(1)
        expect(item.damage[0]?.dice).toEqual([4]) // 1d4
        expect(item.damage[0]?.type).toBe("bludgeoning")
        expect(item.damage[0]?.versatile).toBe(false)
        expect(item.humanReadableDamage).toContain("1d4 bludgeoning")
      })

      test("creates a weapon with versatile damage", async () => {
        const formData = new FormData()
        formData.append("name", "Quarterstaff")
        formData.append("category", "weapon")
        formData.append("weapon_type", "melee")
        formData.append("damage_row_count", "2")
        formData.append("damage.0.num_dice", "1")
        formData.append("damage.0.die_value", "6")
        formData.append("damage.0.type", "bludgeoning")
        formData.append("damage.1.num_dice", "1")
        formData.append("damage.1.die_value", "8")
        formData.append("damage.1.type", "bludgeoning")
        formData.append("damage.1.versatile", "true")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/newitem`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        const items = await computeCharacterItems(testCtx.db, character.id)
        expect(items.length).toBe(1)

        const item = items[0]
        if (!item) throw new Error("Item not found")
        expect(item.name).toBe("Quarterstaff")

        // Verify both damage entries were created
        expect(item.damage.length).toBe(2)

        // First damage entry (normal) - 1d6
        expect(item.damage[0]?.dice).toEqual([6])
        expect(item.damage[0]?.type).toBe("bludgeoning")
        expect(item.damage[0]?.versatile).toBe(false)

        // Second damage entry (versatile) - 1d8
        expect(item.damage[1]?.dice).toEqual([8])
        expect(item.damage[1]?.type).toBe("bludgeoning")
        expect(item.damage[1]?.versatile).toBe(true)
      })

      test("creates a ranged weapon with ammunition", async () => {
        const formData = new FormData()
        formData.append("name", "Shortbow")
        formData.append("category", "weapon")
        formData.append("weapon_type", "ranged")
        formData.append("damage_row_count", "1")
        formData.append("damage.0.num_dice", "1")
        formData.append("damage.0.die_value", "6")
        formData.append("damage.0.type", "piercing")
        formData.append("normal_range", "80")
        formData.append("long_range", "320")
        formData.append("starting_ammo", "20")
        formData.append("two_handed", "true")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/newitem`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        const items = await computeCharacterItems(testCtx.db, character.id)
        expect(items.length).toBe(1)

        const item = items[0]
        if (!item) throw new Error("Item not found")
        expect(item.name).toBe("Shortbow")
        expect(item.normal_range).toBe(80)
        expect(item.long_range).toBe(320)

        // Verify ammunition charges were created
        expect(Number(item.currentCharges)).toBe(20)
        expect(Number(item.ammunition)).toBe(20)
        expect(item.chargeLabel).toBe("ammunition")
      })

      test("creates armor with properties", async () => {
        const formData = new FormData()
        formData.append("name", "Chain Mail")
        formData.append("category", "armor")
        formData.append("armor_type", "heavy")
        formData.append("armor_class", "16")
        formData.append("armor_class_dex", "false")
        formData.append("min_strength", "13")
        formData.append("stealth_disadvantage", "true")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/newitem`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        const items = await computeCharacterItems(testCtx.db, character.id)
        expect(items.length).toBe(1)

        const item = items[0]
        if (!item) throw new Error("Item not found")
        expect(item.name).toBe("Chain Mail")
        expect(item.category).toBe("armor")
        expect(item.armor_type).toBe("heavy")
        expect(item.armor_class).toBe(16)
        expect(item.armor_class_dex).toBe(false)

        // Verify stealth disadvantage effect was created
        expect(item.effects.length).toBeGreaterThan(0)
        const stealthEffect = item.effects.find((e) => e.target === "stealth")
        expect(stealthEffect).toBeDefined()
        expect(stealthEffect?.op).toBe("disadvantage")
      })

      test("creates a shield with armor modifier", async () => {
        const formData = new FormData()
        formData.append("name", "Shield")
        formData.append("category", "shield")
        formData.append("armor_modifier", "2")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/newitem`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        const items = await computeCharacterItems(testCtx.db, character.id)
        expect(items.length).toBe(1)

        const item = items[0]
        if (!item) throw new Error("Item not found")
        expect(item.name).toBe("Shield")
        expect(item.category).toBe("shield")
        expect(item.armor_modifier).toBe(2)
      })
    })

    describe("with invalid data", () => {
      test("returns validation error for missing name", async () => {
        const formData = new FormData()
        formData.append("category", "weapon")
        formData.append("weapon_type", "melee")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/newitem`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        const document = await parseHtml(response)

        // Should show the form with an error
        const errorDiv = expectElement(document, ".invalid-feedback")
        expect(errorDiv.textContent).toContain("required")
      })

      test("returns validation error for weapon missing damage", async () => {
        const formData = new FormData()
        formData.append("name", "Broken Sword")
        formData.append("category", "weapon")
        formData.append("weapon_type", "melee")
        formData.append("damage_row_count", "0")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/newitem`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        // Verify the item was NOT created
        const items = await computeCharacterItems(testCtx.db, character.id)
        const brokenSword = items.find((i) => i.name === "Broken Sword")
        expect(brokenSword).toBeUndefined()
      })

      test("returns validation error for ranged weapon missing range", async () => {
        const formData = new FormData()
        formData.append("name", "Broken Bow")
        formData.append("category", "weapon")
        formData.append("weapon_type", "ranged")
        formData.append("damage_row_count", "1")
        formData.append("damage.0.num_dice", "1")
        formData.append("damage.0.die_value", "6")
        formData.append("damage.0.type", "piercing")
        // Missing normal_range

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/newitem`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        // Verify the item was NOT created
        const items = await computeCharacterItems(testCtx.db, character.id)
        const brokenBow = items.find((i) => i.name === "Broken Bow")
        expect(brokenBow).toBeUndefined()
      })
    })
  })

  describe("authorization", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    test("redirects to login when not authenticated", async () => {
      const formData = new FormData()
      formData.append("name", "Unauthorized Item")
      formData.append("category", "weapon")

      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/newitem`, {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })

    test.skip("prevents creating items for another user's character", async () => {
      const otherUser = await userFactory.create({}, testCtx.db)
      const otherCharacter = await characterFactory.create({ user_id: otherUser.id }, testCtx.db)

      const formData = new FormData()
      formData.append("name", "Stolen Item")
      formData.append("category", "weapon")
      formData.append("weapon_type", "melee")
      formData.append("damage_row_count", "1")
      formData.append("damage.0.num_dice", "1")
      formData.append("damage.0.die_value", "4")
      formData.append("damage.0.type", "bludgeoning")

      const _response = await makeRequest(
        testCtx.app,
        `/characters/${otherCharacter.id}/edit/newitem`,
        {
          user, // Using first user to try to create item for other user's character
          method: "POST",
          body: formData,
        }
      )

      // The endpoint should handle this gracefully
      // Verify the item does NOT appear in the other character's inventory
      const otherCharItems = await computeCharacterItems(testCtx.db, otherCharacter.id)
      const stolenItem = otherCharItems.find((i) => i.name === "Stolen Item")
      expect(stolenItem).toBeUndefined()
    })
  })
})
