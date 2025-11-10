import { describe, test, expect, beforeEach } from "bun:test"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { characterFactory } from "@src/test/factories/character"
import { makeRequest, parseHtml, expectElement } from "@src/test/http"
import type { User } from "@src/db/users"
import type { Character } from "@src/db/characters"

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

			const response = await makeRequest(
				testCtx.app,
				`/characters/${character.id}/edit/newitem`,
				{
					user,
					method: "POST",
					body: formData,
				},
			)

			expect(response.status).toBe(200)

			const document = await parseHtml(response)

			// Verify the item name is populated
			const nameInput = expectElement(document, 'input[name="name"]') as HTMLInputElement
			expect(nameInput.value).toBe("Dagger")

			// Verify the category is populated
			const categorySelect = expectElement(
				document,
				'select[name="category"]',
			) as HTMLSelectElement
			expect(categorySelect.value).toBe("weapon")

			// Verify the damage die value dropdown is populated (Dagger uses d4)
			const dieValueSelect = expectElement(
				document,
				'select[name="damage.0.die_value"]',
			) as HTMLSelectElement
			expect(dieValueSelect.value).toBe("4")

			// Verify the damage type dropdown is populated (Dagger is piercing)
			const damageTypeSelect = expectElement(
				document,
				'select[name="damage.0.type"]',
			) as HTMLSelectElement
			expect(damageTypeSelect.value).toBe("piercing")

			// Verify the number of dice input is populated
			const numDiceInput = expectElement(
				document,
				'input[name="damage.0.num_dice"]',
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

			const response = await makeRequest(
				testCtx.app,
				`/characters/${character.id}/edit/newitem`,
				{
					user,
					method: "POST",
					body: formData,
				},
			)

			expect(response.status).toBe(200)

			const document = await parseHtml(response)

			// Verify the weapon type is set to thrown
			const weaponTypeThrownRadio = expectElement(
				document,
				'input[name="weapon_type"][value="thrown"]',
			) as HTMLInputElement
			expect(weaponTypeThrownRadio.hasAttribute("checked")).toBe(true)

			// Verify the normal range is populated (Javelin has 30ft)
			const normalRangeInput = expectElement(
				document,
				'input[name="normal_range"]',
			) as HTMLInputElement
			expect(normalRangeInput.value).toBe("30")

			// Verify the long range is populated (Javelin has 120ft)
			const longRangeInput = expectElement(
				document,
				'input[name="long_range"]',
			) as HTMLInputElement
			expect(longRangeInput.value).toBe("120")
		})
	})
})
