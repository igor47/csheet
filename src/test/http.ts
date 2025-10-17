import type { User } from "@src/db/users"
import { genAuthCookieValue } from "@src/middleware/auth"
import type { Hono } from "hono"
import { parseHTML } from "linkedom"

/**
 * Make a request to the Hono app and return the response
 */
export async function makeRequest(
  app: Hono,
  path: string,
  options?: {
    method?: string
    headers?: Record<string, string>
    body?: string | FormData
    cookies?: string[]
    user?: User
  }
): Promise<Response> {
  const method = options?.method || "GET"
  const headers = new Headers(options?.headers || {})

  // Build cookies object
  const cookies = options?.cookies ? [...options.cookies] : []

  // Add auth cookie if user provided
  if (options?.user) {
    const cookieString = await genAuthCookieValue(options.user.id)
    const userIdCookie = cookieString.split(";")[0] // only need the "key=value" part

    const [name, encodedValue] = userIdCookie!.split("=")
    const decodedValue = decodeURIComponent(encodedValue!)
    const decodedCookie = `${name}=${decodedValue}`

    cookies.push(decodedCookie)
  }

  // Add cookies to header if any
  for (const cookie of cookies) {
    headers.append("Cookie", cookie)
  }

  const req = new Request(`http://localhost${path}`, {
    method,
    headers,
    body: options?.body,
  })

  return await app.fetch(req)
}

/**
 * Parse HTML response body into a DOM document
 */
export async function parseHtml(response: Response): Promise<Document> {
  const html = await response.text()

  if (!html || html.trim().length === 0) {
    throw new Error(`Cannot parse empty HTML response. Status: ${response.status}`)
  }

  const { document } = parseHTML(html)
  return document
}

/**
 * Assert that an element matching the selector exists in the document
 */
export function expectElement(document: Document, selector: string): Element {
  const element = document.querySelector(selector)
  if (!element) {
    throw new Error(
      `Expected element matching selector "${selector}" to exist, but it was not found`
    )
  }
  return element
}

/**
 * Get text content from an element (throws if not found)
 */
export function getElementText(document: Document, selector: string): string {
  const element = expectElement(document, selector)
  return element.textContent?.trim() || ""
}

/**
 * Check if an element matching the selector exists
 */
export function elementExists(document: Document, selector: string): boolean {
  return document.querySelector(selector) !== null
}

/**
 * Get all elements matching a selector
 */
export function getElements(document: Document, selector: string): Element[] {
  return Array.from(document.querySelectorAll(selector))
}
