import { describe, expect, test } from "bun:test"
import { renderUntrustedMarkdown } from "@src/lib/markdown"

describe("renderUntrustedMarkdown", () => {
  test("renders ordinary markdown", () => {
    const html = renderUntrustedMarkdown("**Grappled** means your speed is 0.\n\n- one\n- two")
    expect(html).toContain("<strong>Grappled</strong>")
    expect(html).toContain("<li>one</li>")
  })

  describe("raw HTML", () => {
    test("escapes block-level HTML", () => {
      const html = renderUntrustedMarkdown("<script>alert(1)</script>")
      expect(html).not.toContain("<script>")
      expect(html).toContain("&lt;script&gt;")
    })

    test("escapes inline HTML", () => {
      const html = renderUntrustedMarkdown("hello <img src=x onerror=alert(1)> there")
      expect(html).not.toContain("<img")
      expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
    })
  })

  describe("links", () => {
    test("links same-site paths in the same tab", () => {
      const html = renderUntrustedMarkdown(
        "See [Grappled](/rules?ruleset=srd52&section=rules-glossary/grappled)."
      )
      expect(html).toContain(
        '<a href="/rules?ruleset=srd52&amp;section=rules-glossary/grappled">Grappled</a>'
      )
    })

    test("opens http(s) links in a new tab without passing the opener", () => {
      const html = renderUntrustedMarkdown("[docs](https://example.com/a)")
      expect(html).toContain('href="https://example.com/a"')
      expect(html).toContain('target="_blank" rel="noopener noreferrer nofollow"')
    })

    test("drops paths that browsers would send off-site", () => {
      for (const href of ["/\\evil.example", "</\t/evil.example>", "</\n/evil.example>"]) {
        const html = renderUntrustedMarkdown(`[click me](${href})`)
        expect(html).not.toContain("<a")
        expect(html).toContain("click me")
      }
    })

    test("drops javascript: and protocol-relative links, keeping the text", () => {
      for (const href of ["javascript:alert(1)", "//evil.example/x", "data:text/html,hi"]) {
        const html = renderUntrustedMarkdown(`[click me](${href})`)
        expect(html).not.toContain("<a")
        expect(html).toContain("click me")
      }
    })
  })

  test("shows images as their alt text", () => {
    const html = renderUntrustedMarkdown("![a tracking pixel](https://evil.example/p.png)")
    expect(html).not.toContain("<img")
    expect(html).toContain("a tracking pixel")
  })

  test("prefixes the first paragraph with an icon", () => {
    const html = renderUntrustedMarkdown("first\n\nsecond", { icon: "<i></i>" })
    expect(html).toBe("<p><i></i> first</p><p>second</p>")
  })
})
