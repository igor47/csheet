import type { ZodError } from "zod"
import { z } from "zod"

type FormErrors = Record<string, string>

function humanizeEnumError(error: string): string {
  // Transform enum errors from: expected one of "option1"|"option2"|"option3"
  // to: expected one of option1, option2, option3

  // First pass: replace "option"| with option,
  let result = error.replace(/"([^"]+)"\|/g, "$1, ")

  // Second pass: replace any remaining "option" (the last one) with option
  result = result.replace(/"([^"]+)"/g, "$1")

  return result
}

export function zodToFormErrors(zodError: ZodError): FormErrors {
  const fieldErrors = z.flattenError(zodError).fieldErrors as Record<string, string[]>
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, errors]) => {
      const humanizedErrors = errors.map(humanizeEnumError)
      return [field, humanizedErrors.join("; ")]
    })
  )
}
