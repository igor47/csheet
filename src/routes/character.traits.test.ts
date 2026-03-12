import { beforeEach, describe, expect, test } from "bun:test"
import type { CharTrait } from "@src/db/char_traits"
import { create as createTrait } from "@src/db/char_traits"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /characters/:id/traits/:traitId/edit", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/traits/trait-id/edit")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character
    let customTrait: CharTrait

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
      customTrait = await createTrait(testCtx.db, {
        character_id: character.id,
        name: "Lucky Charm",
        description: "Once per day, reroll a d20",
        source: "custom",
        source_detail: null,
        level: null,
        note: "Found in a dungeon",
      })
    })

    test("returns 200 for custom trait", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/traits/${customTrait.id}/edit`,
        { user }
      )

      expect(response.status).toBe(200)
    })

    test("renders edit form with pre-populated values", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/traits/${customTrait.id}/edit`,
        { user }
      )

      const document = await parseHtml(response)
      const title = expectElement(document, ".modal-title")
      expect(title.textContent).toBe("Edit Custom Trait")

      const nameInput = expectElement(document, "#name") as HTMLInputElement
      expect(nameInput.getAttribute("value")).toBe("Lucky Charm")

      const descriptionTextarea = expectElement(document, "#description")
      expect(descriptionTextarea.textContent).toBe("Once per day, reroll a d20")

      const noteInput = expectElement(document, "#note") as HTMLInputElement
      expect(noteInput.getAttribute("value")).toBe("Found in a dungeon")
    })

    test("renders Save Changes button", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/traits/${customTrait.id}/edit`,
        { user }
      )

      const document = await parseHtml(response)
      const submitButton = expectElement(document, "button[type='submit']")
      expect(submitButton.textContent).toContain("Save Changes")
    })

    describe("when trait is not custom", () => {
      let speciesTrait: CharTrait

      beforeEach(async () => {
        speciesTrait = await createTrait(testCtx.db, {
          character_id: character.id,
          name: "Darkvision",
          description: "Can see in dim light",
          source: "species",
          source_detail: "elf",
          level: null,
          note: null,
        })
      })

      test("renders edit form with error", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${speciesTrait.id}/edit`,
          { user }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const alert = expectElement(document, ".alert-danger")
        expect(alert.textContent).toContain("Only custom traits can be edited")
      })
    })

    describe("when trait does not exist", () => {
      test("renders edit form with error", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/nonexistent/edit`,
          { user }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const alert = expectElement(document, ".alert-danger")
        expect(alert.textContent).toContain("Trait not found")
      })
    })

    describe("when character belongs to another user", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("redirects to /characters", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}/edit`,
          { user: otherUser }
        )

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })
    })
  })
})

describe("POST /characters/:id/traits/:traitId/edit", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const formData = new FormData()
      formData.append("name", "Updated Trait")
      formData.append("description", "Updated description")

      const response = await makeRequest(testCtx.app, "/characters/test-id/traits/trait-id/edit", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character
    let customTrait: CharTrait

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
      customTrait = await createTrait(testCtx.db, {
        character_id: character.id,
        name: "Lucky Charm",
        description: "Once per day, reroll a d20",
        source: "custom",
        source_detail: null,
        level: null,
        note: "Found in a dungeon",
      })
    })

    describe("with valid data", () => {
      test("updates the trait in database", async () => {
        const formData = new FormData()
        formData.append("name", "Super Lucky Charm")
        formData.append("description", "Twice per day, reroll a d20")
        formData.append("note", "Upgraded!")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}/edit`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)

        // Verify database was updated
        const updatedTrait = await testCtx.db`
          SELECT * FROM char_traits WHERE id = ${customTrait.id}
        `
        expect(updatedTrait[0].name).toBe("Super Lucky Charm")
        expect(updatedTrait[0].description).toBe("Twice per day, reroll a d20")
        expect(updatedTrait[0].note).toBe("Upgraded!")
      })

      test("returns updated TraitsPanel with OOB swap", async () => {
        const formData = new FormData()
        formData.append("name", "Super Lucky Charm")
        formData.append("description", "Twice per day, reroll a d20")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}/edit`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)

        const panel = expectElement(document, "#traits-panel")
        expect(panel.attributes.getNamedItem("hx-swap-oob")?.value).toBe("true")
      })

      test("closes the modal", async () => {
        const formData = new FormData()
        formData.append("name", "Super Lucky Charm")
        formData.append("description", "Twice per day, reroll a d20")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}/edit`,
          { user, method: "POST", body: formData }
        )

        expect(response.headers.get("HX-Trigger")).toContain("closeDetailModal")
      })

      test("can clear the note", async () => {
        const formData = new FormData()
        formData.append("name", "Lucky Charm")
        formData.append("description", "Once per day, reroll a d20")
        formData.append("note", "")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}/edit`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)

        const updatedTrait = await testCtx.db`
          SELECT * FROM char_traits WHERE id = ${customTrait.id}
        `
        expect(updatedTrait[0].note).toBeNull()
      })
    })

    describe("with invalid data", () => {
      test("shows error when name is empty", async () => {
        const formData = new FormData()
        formData.append("name", "")
        formData.append("description", "Some description")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}/edit`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain("Trait name is required")
      })

      test("shows error when description is empty", async () => {
        const formData = new FormData()
        formData.append("name", "Some Name")
        formData.append("description", "")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}/edit`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain("Trait description is required")
      })
    })

    describe("when trait is not custom", () => {
      let speciesTrait: CharTrait

      beforeEach(async () => {
        speciesTrait = await createTrait(testCtx.db, {
          character_id: character.id,
          name: "Darkvision",
          description: "Can see in dim light",
          source: "species",
          source_detail: "elf",
          level: null,
          note: null,
        })
      })

      test("renders edit form with error", async () => {
        const formData = new FormData()
        formData.append("name", "Updated Darkvision")
        formData.append("description", "See even better")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${speciesTrait.id}/edit`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const alert = expectElement(document, ".alert-danger")
        expect(alert.textContent).toContain("Only custom traits can be edited")
      })
    })

    describe("when character belongs to another user", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("redirects to /characters", async () => {
        const formData = new FormData()
        formData.append("name", "Updated Trait")
        formData.append("description", "Updated description")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}/edit`,
          { user: otherUser, method: "POST", body: formData }
        )

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })
    })
  })
})

describe("DELETE /characters/:id/traits/:traitId", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/traits/trait-id", {
        method: "DELETE",
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character
    let customTrait: CharTrait

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
      customTrait = await createTrait(testCtx.db, {
        character_id: character.id,
        name: "Lucky Charm",
        description: "Once per day, reroll a d20",
        source: "custom",
        source_detail: null,
        level: null,
        note: "Found in a dungeon",
      })
    })

    test("deletes the trait from database", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/traits/${customTrait.id}`,
        { user, method: "DELETE" }
      )

      expect(response.status).toBe(200)

      // Verify trait was deleted
      const deletedTrait = await testCtx.db`
        SELECT * FROM char_traits WHERE id = ${customTrait.id}
      `
      expect(deletedTrait.length).toBe(0)
    })

    test("returns updated TraitsPanel", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/traits/${customTrait.id}`,
        { user, method: "DELETE" }
      )

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      expectElement(document, "#traits-panel")
    })

    describe("when trait is not custom", () => {
      let speciesTrait: CharTrait

      beforeEach(async () => {
        speciesTrait = await createTrait(testCtx.db, {
          character_id: character.id,
          name: "Darkvision",
          description: "Can see in dim light",
          source: "species",
          source_detail: "elf",
          level: null,
          note: null,
        })
      })

      test("does not delete the trait", async () => {
        await makeRequest(testCtx.app, `/characters/${character.id}/traits/${speciesTrait.id}`, {
          user,
          method: "DELETE",
        })

        const trait = await testCtx.db`
          SELECT * FROM char_traits WHERE id = ${speciesTrait.id}
        `
        expect(trait.length).toBe(1)
      })

      test("re-renders the traits panel", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${speciesTrait.id}`,
          { user, method: "DELETE" }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        expectElement(document, "#traits-panel")
      })
    })

    describe("when trait does not exist", () => {
      test("re-renders the traits panel", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/nonexistent`,
          { user, method: "DELETE" }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        expectElement(document, "#traits-panel")
      })
    })

    describe("when character belongs to another user", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("redirects to /characters", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/traits/${customTrait.id}`,
          { user: otherUser, method: "DELETE" }
        )

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })

      test("does not delete the trait", async () => {
        await makeRequest(testCtx.app, `/characters/${character.id}/traits/${customTrait.id}`, {
          user: otherUser,
          method: "DELETE",
        })

        const trait = await testCtx.db`
          SELECT * FROM char_traits WHERE id = ${customTrait.id}
        `
        expect(trait.length).toBe(1)
      })
    })
  })
})

describe("TraitsPanel UI", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated and owns character", () => {
    let user: User
    let character: Character
    let customTrait: CharTrait
    let speciesTrait: CharTrait

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
      customTrait = await createTrait(testCtx.db, {
        character_id: character.id,
        name: "Lucky Charm",
        description: "Once per day, reroll a d20",
        source: "custom",
        source_detail: null,
        level: null,
        note: null,
      })
      speciesTrait = await createTrait(testCtx.db, {
        character_id: character.id,
        name: "Darkvision",
        description: "Can see in dim light",
        source: "species",
        source_detail: "elf",
        level: null,
        note: null,
      })
    })

    test("shows edit icon for custom traits", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

      const html = await response.text()
      // Edit button should be present for custom trait
      expect(html).toContain(`/characters/${character.id}/traits/${customTrait.id}/edit`)
      expect(html).toContain("bi-pencil")
    })

    test("shows delete icon for custom traits", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

      const html = await response.text()
      // Delete button should be present for custom trait
      expect(html).toContain(`hx-delete="/characters/${character.id}/traits/${customTrait.id}"`)
      expect(html).toContain("bi-trash")
    })

    test("does not show edit icon for species traits", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

      const html = await response.text()
      // Edit/delete buttons should NOT be present for species trait
      expect(html).not.toContain(`/characters/${character.id}/traits/${speciesTrait.id}/edit`)
    })

    test("does not show delete icon for species traits", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

      const html = await response.text()
      // Delete button should NOT be present for species trait
      expect(html).not.toContain(
        `hx-delete="/characters/${character.id}/traits/${speciesTrait.id}"`
      )
    })
  })
})
