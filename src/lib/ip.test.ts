import { describe, expect, test } from "bun:test"
import { isIP } from "node:net"
import { BLOCKED_SUBNETS, clientIpFromXff, isBlockedIp } from "@src/lib/ip"

describe("isBlockedIp", () => {
  test("blocks real observed IPv4 attackers", () => {
    expect(isBlockedIp("192.210.150.68")).toBe(true)
    expect(isBlockedIp("198.12.69.94")).toBe(true)
    expect(isBlockedIp("136.0.251.127")).toBe(true)
  })

  test("blocks real observed IPv6 attackers", () => {
    expect(isBlockedIp("2602:fa5d::8b")).toBe(true)
    expect(isBlockedIp("2602:fa5d:1::16")).toBe(true)
    expect(isBlockedIp("2602:fa87:1:34::a")).toBe(true)
  })

  test("blocks boundary addresses within a /24", () => {
    expect(isBlockedIp("192.210.150.0")).toBe(true)
    expect(isBlockedIp("192.210.150.255")).toBe(true)
  })

  test("blocks the whole IPv6 /32", () => {
    expect(isBlockedIp("2602:fa5d::1")).toBe(true)
    expect(isBlockedIp("2602:fa5d:ffff:ffff::1")).toBe(true)
  })

  test("blocks the v4-mapped form of a blocked IPv4", () => {
    expect(isBlockedIp("::ffff:192.210.150.5")).toBe(true)
  })

  test("does not block adjacent ranges", () => {
    expect(isBlockedIp("192.210.151.1")).toBe(false)
    expect(isBlockedIp("192.210.149.255")).toBe(false)
    expect(isBlockedIp("2602:fa5e::1")).toBe(false)
    expect(isBlockedIp("2602:fa5c:ffff::1")).toBe(false)
  })

  test("does not block legitimate public addresses", () => {
    expect(isBlockedIp("8.8.8.8")).toBe(false)
    expect(isBlockedIp("2001:4860:4860::8888")).toBe(false)
  })

  test("fails open on unparseable input", () => {
    expect(isBlockedIp("")).toBe(false)
    expect(isBlockedIp("   ")).toBe(false)
    expect(isBlockedIp("not-an-ip")).toBe(false)
    expect(isBlockedIp("999.1.1.1")).toBe(false)
    expect(isBlockedIp("::gggg")).toBe(false)
  })

  test("tolerates surrounding whitespace", () => {
    expect(isBlockedIp("  192.210.150.68 ")).toBe(true)
  })

  test("every blocked subnet is a well-formed network address of its family", () => {
    for (const [address, prefix, family] of BLOCKED_SUBNETS) {
      const detected = isIP(address)
      expect(detected).toBe(family === "ipv4" ? 4 : 6)
      expect(prefix).toBeGreaterThan(0)
      expect(prefix).toBeLessThanOrEqual(family === "ipv4" ? 32 : 128)
    }
  })
})

describe("clientIpFromXff", () => {
  test("returns the single entry", () => {
    expect(clientIpFromXff("1.2.3.4")).toBe("1.2.3.4")
  })

  test("returns the LAST entry (the platform-appended client IP)", () => {
    expect(clientIpFromXff("1.2.3.4, 5.6.7.8")).toBe("5.6.7.8")
    expect(clientIpFromXff("8.8.8.8, 192.210.150.10")).toBe("192.210.150.10")
  })

  test("trims whitespace around entries", () => {
    expect(clientIpFromXff(" a , b ")).toBe("b")
  })

  test("skips trailing empty entries", () => {
    expect(clientIpFromXff("1.2.3.4,")).toBe("1.2.3.4")
    expect(clientIpFromXff("1.2.3.4, ,")).toBe("1.2.3.4")
  })

  test("returns null when absent or empty", () => {
    expect(clientIpFromXff(undefined)).toBeNull()
    expect(clientIpFromXff(null)).toBeNull()
    expect(clientIpFromXff("")).toBeNull()
    expect(clientIpFromXff("  ")).toBeNull()
  })
})
