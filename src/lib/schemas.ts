import { z } from "zod"
import {
  Checkbox,
  coerceNumber,
  NumberField,
  NumericEnumField,
  OptionalString,
} from "./formSchemas"

/**
 * Legacy Schema Helpers
 *
 * This file provides backward compatibility with the old schema helpers.
 * New code should use the composable helpers from formSchemas.ts instead.
 *
 * @deprecated Most exports in this file are deprecated. Use formSchemas.ts instead.
 */

// =============================================================================
// Re-exports from formSchemas (for backward compatibility)
// =============================================================================

/**
 * @deprecated Use `Checkbox()` from formSchemas.ts instead
 */
export const BooleanFormFieldSchema = Checkbox()

/**
 * @deprecated Use `OptionalString()` from formSchemas.ts instead
 */
export const OptionalNullStringSchema = OptionalString()

/**
 * NumberFormFieldSchema - Basic number field with coercion
 *
 * NOTE: This export previously didn't exist and was imported in 11 files causing errors.
 * This is now defined using the new NumberField helper.
 *
 * @deprecated Use `NumberField(z.number())` from formSchemas.ts instead
 */
export const NumberFormFieldSchema = NumberField(z.number())

// =============================================================================
// Legacy helpers (kept for backward compatibility)
// =============================================================================

/**
 * @deprecated Internal helper. Use coerceString from formSchemas.ts instead.
 */
export function EmptyIsUndefined(v: unknown) {
  if (typeof v === "string" && v.trim() === "") {
    return undefined
  }
  return v
}

/**
 * @deprecated Internal helper. Use coerceNumber from formSchemas.ts instead.
 */
export function StringIsNumber(v: unknown) {
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isNaN(n) ? v : n
  }
  return v
}

/**
 * Create an enum schema that accepts string numbers and converts them to number literals.
 *
 * @example
 * ```typescript
 * StringNumberEnum([0, 1, 2])
 * // Form: "1" → 1
 * // Form: "" → undefined → fails if required
 * ```
 *
 * @deprecated Use `NumericEnumField(z.union([z.literal(0), z.literal(1), z.literal(2)]).nullable())`
 * from formSchemas.ts instead
 */
export function StringNumberEnum<const T extends readonly number[]>(values: T) {
  return NumericEnumField(
    z.union(values.map((n) => z.literal(n)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]])
  )
}

/**
 * Make an enum schema optional with empty string → undefined preprocessing.
 *
 * @example
 * ```typescript
 * UnsetEnumSchema(z.enum(["light", "medium", "heavy"]))
 * // Form: "light" → "light"
 * // Form: "" → undefined → passes (optional)
 * ```
 *
 * @deprecated Use `EnumField(z.enum([...]).nullable())` from formSchemas.ts instead
 */
export function UnsetEnumSchema(zEnum: z.ZodTypeAny) {
  return z.preprocess((v) => (v === "" || v === undefined ? null : v), zEnum.nullable())
}

/**
 * Create a required number field with string-to-number preprocessing.
 *
 * @param mod - Optional modifier function to add constraints
 *
 * @example
 * ```typescript
 * RequiredStringNumberSchema()
 * RequiredStringNumberSchema((s) => s.int().positive())
 * ```
 *
 * @deprecated Use `NumberField(z.number().int().positive())` from formSchemas.ts instead
 */
export function RequiredStringNumberSchema(mod: (s: z.ZodNumber) => z.ZodNumber = (s) => s) {
  return z.preprocess(
    coerceNumber,
    mod(
      z.number({
        error: (iss) => (iss === undefined ? "Field is required" : "Invalid number"),
      })
    )
  )
}
