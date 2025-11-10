import type { ZodError } from "zod"

type FormErrors = Record<string, string>

export function humanizeEnumError(error: string): string {
  // Transform enum errors from: expected one of "option1"|"option2"|"option3"
  // to: expected one of option1, option2, option3

  // First pass: replace first "option"| with option|
  let result = error.replace(/"([^"]+)"\|/, "$1|")

  // Second pass: replace any remaining |"option" with , option
  result = result.replace(/\|"([^"]+)"/g, ", $1")

  return result
}

// biome-ignore lint/suspicious/noExplicitAny: Zod error structure is complex and varies by error type
function flattenZodIssues(issue: any, errors: FormErrors) {
  // If this is a union error with nested errors, recursively process them
  if (issue.code === "invalid_union" && issue.unionErrors) {
    for (const unionError of issue.unionErrors) {
      for (const nestedIssue of unionError.issues) {
        flattenZodIssues(nestedIssue, errors)
      }
    }
    return
  }

  // Also handle the "errors" property (array of arrays of issues)
  if (issue.code === "invalid_union" && issue.errors && Array.isArray(issue.errors)) {
    for (const errorGroup of issue.errors) {
      if (Array.isArray(errorGroup)) {
        for (const nestedIssue of errorGroup) {
          flattenZodIssues(nestedIssue, errors)
        }
      }
    }
    return
  }

  // Convert path array like ["dice", 0, "roll"] to "dice.0.roll"
  const fieldName = issue.path.join(".")
  const message = humanizeEnumError(issue.message)

  // Skip empty field names (root-level union errors)
  if (!fieldName) return

  // If multiple errors on same field, join with semicolon
  if (errors[fieldName]) {
    errors[fieldName] += `; ${message}`
  } else {
    errors[fieldName] = message
  }
}

export function zodToFormErrors(zodError: ZodError): FormErrors {
  const errors: FormErrors = {}

  for (const issue of zodError.issues) {
    flattenZodIssues(issue, errors)
  }

  return errors
}

export function ignoreCheckEmptyErrors(
  // biome-ignore lint/suspicious/noExplicitAny: values can be complicated (e.g. arrays, nested objects)
  values: Record<string, any>,
  errors: FormErrors
): FormErrors {
  if (values.is_check !== "true") {
    return errors
  }

  const filteredErrors: FormErrors = {}
  for (const [field, message] of Object.entries(errors)) {
    // If field is missing or empty in values, skip the error
    if (values[field] === undefined || values[field] === "") {
      continue
    }
    filteredErrors[field] = message
  }
  return filteredErrors
}
