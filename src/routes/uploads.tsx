import { getDb } from "@src/db"
import * as uploadsDb from "@src/db/uploads"
import { getFile } from "@src/services/s3"
import { completeUpload, initiateUpload } from "@src/services/uploads"
import { Hono } from "hono"
import { z } from "zod"

export const uploadsRoutes = new Hono()

// POST /uploads/initiate - Initiate an upload
uploadsRoutes.post("/uploads/initiate", async (c) => {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const db = getDb(c)

  try {
    // Parse request body
    const body = await c.req.json()
    const schema = z.object({
      content_type: z.string(),
      size_bytes: z.number(),
      original_filename: z.string().optional(),
    })

    const data = schema.parse(body)

    // Initiate upload
    const result = await initiateUpload(
      db,
      user.id,
      data.content_type,
      data.size_bytes,
      data.original_filename
    )

    return c.json({
      upload_id: result.upload.id,
      upload_url: result.uploadUrl,
      s3_key: result.upload.s3_key,
    })
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400)
    }
    return c.json({ error: "Failed to initiate upload" }, 500)
  }
})

// POST /uploads/:id/complete - Mark upload as complete
uploadsRoutes.post("/uploads/:id/complete", async (c) => {
  const user = c.get("user")
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const db = getDb(c)
  const uploadId = c.req.param("id")

  try {
    const upload = await completeUpload(db, uploadId, user.id)

    return c.json({
      upload_id: upload.id,
      status: upload.status,
      content_type: upload.content_type,
      size_bytes: upload.size_bytes,
      url: `/uploads/${upload.id}`,
    })
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400)
    }
    return c.json({ error: "Failed to complete upload" }, 500)
  }
})

// GET /uploads/:id - Serve upload file
uploadsRoutes.get("/uploads/:id", async (c) => {
  const db = getDb(c)
  const uploadId = c.req.param("id")

  try {
    // Find upload
    const upload = await uploadsDb.findById(db, uploadId)
    if (!upload) {
      return c.json({ error: "Upload not found" }, 404)
    }

    // Only serve completed uploads
    if (upload.status !== uploadsDb.UploadStatus.COMPLETE) {
      return c.json({ error: "Upload not complete" }, 400)
    }

    if (!upload.s3_key) {
      return c.json({ error: "Upload has no file" }, 404)
    }

    // Get file from S3
    const file = await getFile(upload.s3_key)

    // Set cache headers
    // Uploads are immutable - cache indefinitely
    c.header("Cache-Control", "public, max-age=31536000, immutable")
    // Vary on query params for future image resizing support
    c.header("Vary", "Accept, Accept-Encoding")

    // Set content type
    if (file.contentType) {
      c.header("Content-Type", file.contentType)
    }

    // Set content length if available
    if (file.contentLength) {
      c.header("Content-Length", file.contentLength.toString())
    }

    // Stream the file
    return c.body(file.body as ReadableStream)
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500)
    }
    return c.json({ error: "Failed to serve upload" }, 500)
  }
})
