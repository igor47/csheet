import { BlockList, isIP } from "node:net"

// IP blocklist for abusive datacenter ranges. Matching is delegated to Node's
// built-in net.BlockList (implemented by Bun), which handles IPv4, IPv6, and
// v4-mapped addresses — we only supply the family via isIP().

/**
 * Datacenter/VPS network ranges observed abusing the login OTP flow as an
 * email-spam relay (see request-log correlation, 2026-07). These hosting
 * ranges have no legitimate users, so we block them outright.
 * Each entry is [network address, prefix length, family].
 */
export const BLOCKED_SUBNETS: ReadonlyArray<readonly [string, number, "ipv4" | "ipv6"]> = [
  ["2602:fa5d::", 32, "ipv6"],
  ["2602:fa87::", 32, "ipv6"],
  ["192.210.150.0", 24, "ipv4"],
  ["198.12.69.0", 24, "ipv4"],
  ["136.0.251.0", 24, "ipv4"],
  ["107.173.160.0", 24, "ipv4"],
  ["198.46.154.0", 24, "ipv4"],
  ["206.168.173.0", 24, "ipv4"],
]

const blocklist = new BlockList()
for (const [address, prefix, family] of BLOCKED_SUBNETS) {
  blocklist.addSubnet(address, prefix, family)
}

/**
 * True if `ip` is inside any blocked range. Unparseable input fails open
 * (returns false): a matcher bug must never lock out real users.
 */
export function isBlockedIp(ip: string): boolean {
  const addr = ip.trim()
  const family = isIP(addr) // 4, 6, or 0 (invalid)
  if (family === 4) return blocklist.check(addr, "ipv4")
  if (family === 6) return blocklist.check(addr, "ipv6")
  return false
}

/**
 * Extract the trustworthy client IP from an `X-Forwarded-For` header.
 *
 * On Cloud Run the platform appends the real client IP as the LAST entry (it
 * matches the `httpRequest.remoteIp` seen in Cloud Run logs); any earlier
 * entries are attacker-supplied and must not be trusted. So we take the last
 * non-empty entry. Returns null when the header is absent/empty.
 */
export function clientIpFromXff(xff: string | null | undefined): string | null {
  if (!xff) return null
  const parts = xff.split(",")
  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = parts[i]?.trim()
    if (candidate && candidate.length > 0) return candidate
  }
  return null
}
