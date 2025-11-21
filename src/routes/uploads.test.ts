import { beforeEach, describe, expect, test } from "bun:test"
import type { Upload } from "@src/db/uploads"
import { MAX_UPLOAD_SIZE, UploadStatus } from "@src/db/uploads"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { uploadFactory } from "@src/test/factories/upload"
import { userFactory } from "@src/test/factories/user"
import { makeRequest } from "@src/test/http"

describe("POST /uploads/initiate", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login", async () => {
      const response = await makeRequest(testCtx.app, "/uploads/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: "image/jpeg",
          size_bytes: 1000,
        }),
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("with valid request", () => {
      test("returns upload ID and presigned URL", async () => {
        const response = await makeRequest(testCtx.app, "/uploads/initiate", {
          user,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: "image/jpeg",
            size_bytes: 1000,
            original_filename: "avatar.jpg",
          }),
        })

        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data.upload_id).toBeDefined()
        expect(data.upload_url).toBeDefined()
        expect(data.s3_key).toContain("uploads/")
      })
    })

    describe("with unsupported type", () => {
      test("returns 400", async () => {
        const response = await makeRequest(testCtx.app, "/uploads/initiate", {
          user,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: "application/pdf",
            size_bytes: 1000,
          }),
        })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain("Unsupported file type")
      })
    })

    describe("with file too large", () => {
      test("returns 400", async () => {
        const response = await makeRequest(testCtx.app, "/uploads/initiate", {
          user,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: "image/jpeg",
            size_bytes: MAX_UPLOAD_SIZE + 10,
          }),
        })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain("too big")
      })
    })
  })
})

describe("POST /uploads/:id/complete", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login", async () => {
      const response = await makeRequest(testCtx.app, "/uploads/test-id/complete", {
        method: "POST",
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let upload: Upload

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("with a pending upload", () => {
      beforeEach(async () => {
        upload = await uploadFactory.create(
          {
            user_id: user.id,
            status: UploadStatus.PENDING,
            content_type: "image/jpeg",
          },
          testCtx.db
        )

        // Update s3_key directly since factory creates pending uploads
        await testCtx.db`
          UPDATE uploads
          SET s3_key = ${`uploads/${upload.id}.jpeg`}
          WHERE id = ${upload.id}
        `
      })

      test("returns error when file not uploaded to S3", async () => {
        // User initiated upload but never uploaded file to S3
        const response = await makeRequest(testCtx.app, `/uploads/${upload.id}/complete`, {
          user,
          method: "POST",
        })

        // Should fail because file doesn't exist in S3
        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain("File not found in storage")
      })
    })

    describe("with non-existent upload", () => {
      test("returns 400", async () => {
        const response = await makeRequest(testCtx.app, "/uploads/non-existent/complete", {
          user,
          method: "POST",
        })

        expect(response.status).toBe(400)
      })
    })

    describe("with another user's upload", () => {
      beforeEach(async () => {
        const otherUser = await userFactory.create({}, testCtx.db)
        upload = await uploadFactory.create({ user_id: otherUser.id }, testCtx.db)
      })

      test("returns 400", async () => {
        const response = await makeRequest(testCtx.app, `/uploads/${upload.id}/complete`, {
          user,
          method: "POST",
        })

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain("Unauthorized")
      })
    })
  })
})

describe("GET /uploads/:id", () => {
  const testCtx = useTestApp()

  describe("with a completed upload", () => {
    let user: User
    let upload: Upload

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      upload = await uploadFactory.create(
        {
          user_id: user.id,
          status: UploadStatus.PENDING,
          content_type: "image/jpeg",
        },
        testCtx.db
      )

      // Mark as complete with s3_key
      await testCtx.db`
        UPDATE uploads
        SET status = ${UploadStatus.COMPLETE},
            s3_key = ${`uploads/${upload.id}.jpeg`},
            completed_at = NOW()
        WHERE id = ${upload.id}
      `
    })

    test("returns error when file not in S3", async () => {
      // Upload marked complete but file doesn't exist in S3
      const response = await makeRequest(testCtx.app, `/uploads/${upload.id}`, { user })

      // Should fail because file doesn't exist in S3
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  describe("with a pending upload", () => {
    let user: User
    let upload: Upload

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      upload = await uploadFactory.create(
        {
          user_id: user.id,
          status: UploadStatus.PENDING,
        },
        testCtx.db
      )
    })

    test("returns 400", async () => {
      const response = await makeRequest(testCtx.app, `/uploads/${upload.id}`, { user })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain("not complete")
    })
  })

  describe("with non-existent upload", () => {
    test("redirects to login when not authenticated", async () => {
      const response = await makeRequest(testCtx.app, "/uploads/non-existent")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })
})
