import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { itemFactory } from "@src/test/factories/item"
import { userFactory } from "@src/test/factories/user"
import { expectElement, getElements, makeRequest, parseHtml } from "@src/test/http"

describe("POST /characters/:id/items/:itemId/edit", () => {
  const testCtx = useTestApp()

  describe("dynamic damage row behavior", () => {
    let user: User
    let character: Character
    let itemId: string

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)

      // Create a simple weapon item with one damage entry
      const item = await itemFactory.create(
        {
          character_id: character.id,
          user_id: user.id,
          name: "Test Sword",
          category: "weapon",
          weapon_type: "melee",
        },
        testCtx.db
      )
      itemId = item.id
    })

    test("renders form with initial damage row", async () => {
      // Make initial request with is_check to render the form
      const formData = new FormData()
      formData.append("is_check", "true")
      formData.append("damage_row_count", "1")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/items/${itemId}/edit`,
        {
          user,
          method: "POST",
          body: formData,
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify one damage row is rendered
      const numDiceInputs = getElements(document, 'input[name^="damage."][name$=".num_dice"]')
      expect(numDiceInputs.length).toBe(1)

      // Verify the damage row has the correct index
      const firstDamageInput = expectElement(
        document,
        'input[name="damage.0.num_dice"]'
      ) as HTMLInputElement
      expect(firstDamageInput).toBeDefined()
    })

    test("renders additional damage row when damage_row_count increases", async () => {
      // Simulate clicking "Add Damage" by posting with incremented damage_row_count
      const formData = new FormData()
      formData.append("is_check", "true")
      formData.append("damage_row_count", "2")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/items/${itemId}/edit`,
        {
          user,
          method: "POST",
          body: formData,
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify two damage rows are rendered
      const numDiceInputs = getElements(document, 'input[name^="damage."][name$=".num_dice"]')
      expect(numDiceInputs.length).toBe(2)

      // Verify both damage rows have correct indices
      const firstDamageInput = expectElement(document, 'input[name="damage.0.num_dice"]')
      const secondDamageInput = expectElement(document, 'input[name="damage.1.num_dice"]')
      expect(firstDamageInput).toBeDefined()
      expect(secondDamageInput).toBeDefined()
    })

    test("renders three damage rows when damage_row_count is 3", async () => {
      const formData = new FormData()
      formData.append("is_check", "true")
      formData.append("damage_row_count", "3")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/items/${itemId}/edit`,
        {
          user,
          method: "POST",
          body: formData,
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify three damage rows are rendered
      const numDiceInputs = getElements(document, 'input[name^="damage."][name$=".num_dice"]')
      expect(numDiceInputs.length).toBe(3)

      // Verify all damage rows have correct indices
      expectElement(document, 'input[name="damage.0.num_dice"]')
      expectElement(document, 'input[name="damage.1.num_dice"]')
      expectElement(document, 'input[name="damage.2.num_dice"]')
    })

    test("reduces damage rows when damage_row_count decreases", async () => {
      // First add multiple rows
      const formData1 = new FormData()
      formData1.append("is_check", "true")
      formData1.append("damage_row_count", "3")

      await makeRequest(testCtx.app, `/characters/${character.id}/items/${itemId}/edit`, {
        user,
        method: "POST",
        body: formData1,
      })

      // Now simulate clicking "Remove" by posting with decremented damage_row_count
      const formData2 = new FormData()
      formData2.append("is_check", "true")
      formData2.append("damage_row_count", "2")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/items/${itemId}/edit`,
        {
          user,
          method: "POST",
          body: formData2,
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify only two damage rows are rendered
      const numDiceInputs = getElements(document, 'input[name^="damage."][name$=".num_dice"]')
      expect(numDiceInputs.length).toBe(2)

      // Verify the third row is gone
      const thirdDamageInput = document.querySelector('input[name="damage.2.num_dice"]')
      expect(thirdDamageInput).toBeNull()
    })

    test("preserves damage values when adding rows", async () => {
      // Start with one row and populate it
      const formData1 = new FormData()
      formData1.append("is_check", "true")
      formData1.append("damage_row_count", "1")
      formData1.append("damage.0.num_dice", "2")
      formData1.append("damage.0.die_value", "6")
      formData1.append("damage.0.type", "slashing")

      await makeRequest(testCtx.app, `/characters/${character.id}/items/${itemId}/edit`, {
        user,
        method: "POST",
        body: formData1,
      })

      // Now add a second row
      const formData2 = new FormData()
      formData2.append("is_check", "true")
      formData2.append("damage_row_count", "2")
      formData2.append("damage.0.num_dice", "2")
      formData2.append("damage.0.die_value", "6")
      formData2.append("damage.0.type", "slashing")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/items/${itemId}/edit`,
        {
          user,
          method: "POST",
          body: formData2,
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify the first row's values are preserved
      const numDiceInput = expectElement(
        document,
        'input[name="damage.0.num_dice"]'
      ) as HTMLInputElement
      const dieValueSelect = expectElement(
        document,
        'select[name="damage.0.die_value"]'
      ) as HTMLSelectElement
      const typeSelect = expectElement(
        document,
        'select[name="damage.0.type"]'
      ) as HTMLSelectElement

      expect(numDiceInput.value).toBe("2")
      expect(dieValueSelect.value).toBe("6")
      expect(typeSelect.value).toBe("slashing")

      // Verify second row exists but is empty (new row)
      const secondNumDiceInput = expectElement(
        document,
        'input[name="damage.1.num_dice"]'
      ) as HTMLInputElement
      expect(secondNumDiceInput.value).toBe("1") // Default value
    })

    test("hidden input has correct ID for JavaScript access", async () => {
      const formData = new FormData()
      formData.append("is_check", "true")
      formData.append("damage_row_count", "1")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/items/${itemId}/edit`,
        {
          user,
          method: "POST",
          body: formData,
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify the hidden input has the correct ID that matches the button onclick handlers
      const hiddenInput = expectElement(
        document,
        "input#edititem-damage-row-count"
      ) as HTMLInputElement
      expect(hiddenInput.name).toBe("damage_row_count")
      expect(hiddenInput.value).toBe("1")
    })

    test("form has correct ID for JavaScript access", async () => {
      const formData = new FormData()
      formData.append("is_check", "true")
      formData.append("damage_row_count", "1")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/items/${itemId}/edit`,
        {
          user,
          method: "POST",
          body: formData,
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)

      // Verify the form has the correct ID that matches the button onclick handlers
      const form = expectElement(document, "form#edititem-form")
      expect(form.id).toBe("edititem-form")
    })
  })
})
