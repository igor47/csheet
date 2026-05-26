#!/usr/bin/env bun
// Dump form field names from a PDF, for mapping work.
// Usage: bun bin/dump-pdf-fields.ts <path-to-pdf>

import { PDFDocument } from "pdf-lib"

const path = process.argv[2]
if (!path) {
  console.error("usage: bun bin/dump-pdf-fields.ts <path-to-pdf>")
  process.exit(1)
}

const bytes = await Bun.file(path).arrayBuffer()
const doc = await PDFDocument.load(bytes)
const form = doc.getForm()
const fields = form.getFields()

console.log(`# ${fields.length} fields in ${path}`)
for (const f of fields) {
  console.log(`${f.constructor.name.padEnd(18)}  ${f.getName()}`)
}
