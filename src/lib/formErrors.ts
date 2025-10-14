import type { ZodError } from "zod"
import { z } from "zod"

type FormErrors = Record<string, string>

export function zodToFormErrors(zodError: ZodError): FormErrors {
  const fieldErrors = z.flattenError(zodError).fieldErrors as Record<string, string[]>
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, errors]) => [field, errors.join(";")])
  )
}
