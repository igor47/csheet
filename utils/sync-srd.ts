/**
 * Download the SRD markdown files from your5e/5e-srd-markdown into refdocs/.
 *
 * The files are vendored rather than installed as a dependency; bump
 * UPSTREAM_SHA and re-run this script to pick up upstream fixes.
 */

const UPSTREAM_REPO = "your5e/5e-srd-markdown"
const UPSTREAM_SHA = "f1f5060fd975aa2ffc3e4b336560ded479934d80"

const FILES = [
  { upstream: "dnd/51/SRD_CC_v5.1.md", local: "refdocs/SRD_CC_v5.1.md" },
  { upstream: "dnd/521/SRD_CC_v5.2.1.md", local: "refdocs/SRD_CC_v5.2.1.md" },
]

for (const file of FILES) {
  const url = `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${UPSTREAM_SHA}/${file.upstream}`
  const response = await fetch(url)
  if (!response.ok) {
    console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    process.exit(1)
  }
  const bytes = await Bun.write(file.local, await response.text())
  console.log(`${file.local}: ${bytes} bytes`)
}
