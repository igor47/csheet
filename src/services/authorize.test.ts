import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { authorizeCharacter, handleUnallowed } from "./authorize"

describe("authorizeCharacter", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("returns not_authenticated reason", async () => {
      // Create a user for the character but not for the request
      const user = await userFactory.create({}, testCtx.db)
      const character = await characterFactory.create({ user_id: user.id }, testCtx.db)

      // Create a mock context without a user
      const mockContext = {
        var: {},
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any

      const result = await authorizeCharacter(mockContext, character.id)

      expect(result.allowed).toBe(false)
      if (!result.allowed) {
        expect(result.reason).toBe("not_authenticated")
      }
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("when character does not exist", () => {
      test("returns character_not_found reason", async () => {
        const mockContext = {
          var: { user },
          get: () => testCtx.db,
          // biome-ignore lint/suspicious/noExplicitAny: test mock
        } as any

        const result = await authorizeCharacter(mockContext, "00000000-0000-0000-0000-000000000000")

        expect(result.allowed).toBe(false)
        if (!result.allowed) {
          expect(result.reason).toBe("character_not_found")
        }
      })
    })

    describe("when character belongs to another user", () => {
      let otherUser: User
      let character: Character

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
        character = await characterFactory.create({ user_id: otherUser.id }, testCtx.db)
      })

      test("returns not_owner reason", async () => {
        const mockContext = {
          var: { user },
          get: () => testCtx.db,
          // biome-ignore lint/suspicious/noExplicitAny: test mock
        } as any

        const result = await authorizeCharacter(mockContext, character.id)

        expect(result.allowed).toBe(false)
        if (!result.allowed) {
          expect(result.reason).toBe("not_owner")
        }
      })
    })

    describe("when character belongs to the user", () => {
      let character: Character

      beforeEach(async () => {
        character = await characterFactory.create({ user_id: user.id }, testCtx.db)
      })

      test("returns allowed with character", async () => {
        const mockContext = {
          var: { user },
          get: () => testCtx.db,
          // biome-ignore lint/suspicious/noExplicitAny: test mock
        } as any

        const result = await authorizeCharacter(mockContext, character.id)

        expect(result.allowed).toBe(true)
        if (result.allowed) {
          expect(result.character.id).toBe(character.id)
          expect(result.character.name).toBe(character.name)
        }
      })
    })
  })
})

describe("handleUnallowed", () => {
  const testCtx = useTestApp()

  describe("with not_authenticated reason", () => {
    test("returns 401 status", async () => {
      const mockContext = {
        var: { isHtmx: true },
        header: () => {},
        body: (_: null, status: number) => ({ status }),
        get: () => testCtx.db,
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any

      const response = await handleUnallowed(mockContext, "not_authenticated")

      expect(response.status).toBe(401)
    })

    test("uses HX-Redirect header for HTMX requests", async () => {
      let redirectHeader = ""
      const mockContext = {
        var: { isHtmx: true },
        header: (name: string, value: string) => {
          if (name === "HX-Redirect") redirectHeader = value
        },
        body: (_: null, status: number) => ({ status }),
        get: () => testCtx.db,
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any

      await handleUnallowed(mockContext, "not_authenticated")

      expect(redirectHeader).toBe("/login")
    })

    test("uses standard redirect for non-HTMX requests", async () => {
      let redirectUrl = ""
      const headers: Record<string, string> = {}
      const mockContext = {
        var: { isHtmx: false },
        header: (name: string, value: string) => {
          headers[name] = value
        },
        redirect: (url: string) => {
          redirectUrl = url
          return { status: 302 }
        },
        get: () => testCtx.db,
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any

      await handleUnallowed(mockContext, "not_authenticated")

      expect(redirectUrl).toBe("/login")
    })
  })

  describe("with character_not_found reason", () => {
    test("returns 404 status", async () => {
      const mockContext = {
        var: { isHtmx: true },
        header: () => {},
        body: (_: null, status: number) => ({ status }),
        get: () => testCtx.db,
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any

      const response = await handleUnallowed(mockContext, "character_not_found")

      expect(response.status).toBe(404)
    })

    test("redirects to /characters", async () => {
      let redirectHeader = ""
      const mockContext = {
        var: { isHtmx: true },
        header: (name: string, value: string) => {
          if (name === "HX-Redirect") redirectHeader = value
        },
        body: (_: null, status: number) => ({ status }),
        get: () => testCtx.db,
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any

      await handleUnallowed(mockContext, "character_not_found")

      expect(redirectHeader).toBe("/characters")
    })
  })

  describe("with not_owner reason", () => {
    test("returns 403 status", async () => {
      const mockContext = {
        var: { isHtmx: true },
        header: () => {},
        body: (_: null, status: number) => ({ status }),
        get: () => testCtx.db,
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any

      const response = await handleUnallowed(mockContext, "not_owner")

      expect(response.status).toBe(403)
    })

    test("redirects to /characters", async () => {
      let redirectHeader = ""
      const mockContext = {
        var: { isHtmx: true },
        header: (name: string, value: string) => {
          if (name === "HX-Redirect") redirectHeader = value
        },
        body: (_: null, status: number) => ({ status }),
        get: () => testCtx.db,
        // biome-ignore lint/suspicious/noExplicitAny: test mock
      } as any

      await handleUnallowed(mockContext, "not_owner")

      expect(redirectHeader).toBe("/characters")
    })
  })
})
