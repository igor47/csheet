import { marked, type Tokens } from "marked"

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

/** Same-site paths ("/rules?...") and http(s) URLs; nothing else becomes a link. */
function isSafeHref(href: string): boolean {
  // browsers read "\" as "/" and drop tabs and newlines, so "/\evil.com" leaves the site
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
  if (/[\\\x00-\x20]/.test(href)) return false
  if (href.startsWith("/")) return !href.startsWith("//")
  return /^https?:\/\//i.test(href)
}

/**
 * Renders markdown we don't control (chat messages from users and the AI) to HTML.
 *
 * marked doesn't sanitize, so this escapes raw HTML instead of passing it
 * through, only links same-site paths and http(s) URLs (opening external
 * ones in a new tab), and shows images as their alt text.
 */
export function renderUntrustedMarkdown(
  markdown: string,
  { icon }: { icon?: string } = {}
): string {
  let isFirstParagraph = true
  const renderer = new marked.Renderer()

  renderer.html = ({ text }: Tokens.HTML | Tokens.Tag) => escapeHtml(text)

  renderer.link = function ({ href, title, tokens }: Tokens.Link) {
    const text = this.parser.parseInline(tokens)
    if (!isSafeHref(href)) return text

    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ""
    const externalAttrs = href.startsWith("/")
      ? ""
      : ' target="_blank" rel="noopener noreferrer nofollow"'
    return `<a href="${escapeHtml(href)}"${titleAttr}${externalAttrs}>${text}</a>`
  }

  renderer.image = ({ text }: Tokens.Image) => escapeHtml(text)

  if (icon) {
    renderer.paragraph = function ({ tokens }: Tokens.Paragraph) {
      const text = this.parser.parseInline(tokens)
      if (isFirstParagraph) {
        isFirstParagraph = false
        return `<p>${icon} ${text}</p>`
      }
      return `<p>${text}</p>`
    }
  }

  return marked.parse(markdown, {
    renderer,
    async: false,
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
  }) as string
}
