import { describe, expect, test } from "bun:test"
import { useTestApp } from "@src/test/app"
import { makeRequest } from "@src/test/http"

describe("IP blocklist middleware", () => {
  const testCtx = useTestApp()

  test("blocks a request from a banned IPv4 range with a 403 page", async () => {
    const res = await makeRequest(testCtx.app, "/login", {
      headers: { "x-forwarded-for": "192.210.150.10" },
    })

    expect(res.status).toBe(403)
    const body = await res.text()
    expect(body).toContain("Request blocked")
    expect(body).toContain("github.com/igor47/csheet/issues")
  })

  test("blocks a request from a banned IPv6 range", async () => {
    const res = await makeRequest(testCtx.app, "/login", {
      headers: { "x-forwarded-for": "2602:fa5d::8b" },
    })

    expect(res.status).toBe(403)
  })

  test("uses the last XFF entry, so a spoofed prefix cannot evade the block", async () => {
    const res = await makeRequest(testCtx.app, "/login", {
      headers: { "x-forwarded-for": "8.8.8.8, 192.210.150.10" },
    })

    expect(res.status).toBe(403)
  })

  test("ignores a blocked IP that appears only in a spoofable earlier position", async () => {
    const res = await makeRequest(testCtx.app, "/login", {
      headers: { "x-forwarded-for": "192.210.150.10, 8.8.8.8" },
    })

    expect(res.status).toBe(200)
  })

  test("allows requests with no XFF header", async () => {
    const res = await makeRequest(testCtx.app, "/login")

    expect(res.status).toBe(200)
  })

  test("allows requests from non-blocked IPs", async () => {
    const res = await makeRequest(testCtx.app, "/login", {
      headers: { "x-forwarded-for": "8.8.8.8" },
    })

    expect(res.status).toBe(200)
  })

  test("does not block health checks (they bypass the middleware stack)", async () => {
    const res = await makeRequest(testCtx.app, "/healthz", {
      headers: { "x-forwarded-for": "192.210.150.10" },
    })

    expect(res.status).toBe(200)
  })

  test("blocks POST /login before any handler logic runs", async () => {
    const formData = new FormData()
    formData.append("email", "victim@example.com")

    const res = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
      headers: { "x-forwarded-for": "198.12.69.94" },
    })

    expect(res.status).toBe(403)
  })
})
