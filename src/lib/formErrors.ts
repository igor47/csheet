import type { ZodError } from "zod"

type FormErrors = Record<string, string>

function humanizeEnumError(error: string): string {
  // Transform enum errors from: expected one of "option1"|"option2"|"option3"
  // to: expected one of option1, option2, option3

  // First pass: replace first "option"| with option|
  let result = error.replace(/"([^"]+)"\|/g, "$1|")

  // Second pass: replace any remaining |"option" with , option
  result = result.replace(/\|"([^"]+)"/g, ", $1")

  return result
}

export function zodToFormErrors(zodError: ZodError): FormErrors {
  const errors: FormErrors = {}

  for (const issue of zodError.issues) {
    // Convert path array like ["dice", 0, "roll"] to "dice.0.roll"
    const fieldName = issue.path.join(".")
    const message = humanizeEnumError(issue.message)

    // If multiple errors on same field, join with semicolon
    if (errors[fieldName]) {
      errors[fieldName] += `; ${message}`
    } else {
      errors[fieldName] = message
    }
  }

  return errors
}
