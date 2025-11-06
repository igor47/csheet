import { z } from "zod"

/**
 * Form Field Schema Library
 *
 * Composable preprocessor wrappers for Zod schemas that handle form data coercion.
 * All coercion converts empty strings and undefined to `null`, matching DB/JSON semantics.
 *
 * ## Required vs Optional
 * - Required fields: Don't use `.nullable()` - null will fail validation
 * - Optional fields: Use `.nullable()` - null will pass validation
 *
 * ## Partial Validation
 * When using `.partial()` for live form validation:
 * - Required fields: empty → null → passes during check, fails during submit
 * - Optional fields: empty → null → passes always
 *
 * @example Required number field
 * ```typescript
 * NumberField(z.number().int().positive())
 * // Form: "" → null → FAILS (required)
 * // Form: "42" → 42 → PASSES
 * ```
 *
 * @example Optional number field
 * ```typescript
 * NumberField(z.number().int().positive().nullable())
 * // Form: "" → null → PASSES (optional)
 * // Form: "42" → 42 → PASSES
 * ```
 */

// =============================================================================
// Low-level coercion functions
// =============================================================================

/**
 * Coerce a value to a number or null.
 * Handles both string inputs (from HTMX forms) and number inputs (from LLM tools).
 *
 * @param val - The value to coerce
 * @returns number if valid, null if empty/undefined, original value if invalid (for Zod to error)
 */
export function coerceNumber(val: unknown): number | null | unknown {
  // Empty values become null
  if (val === "" || val === undefined || val === null) {
    return null
  }

  // Already a number
  if (typeof val === "number") {
    return val
  }

  // Try to parse as number
  if (typeof val === "string") {
    const trimmed = val.trim()
    if (trimmed === "") return null

    const num = Number(trimmed)
    // If NaN, return original value so Zod can produce a proper error
    return Number.isNaN(num) ? val : num
  }

  // Unknown type, let Zod handle it
  return val
}

/**
 * Coerce a value to a boolean.
 * Handles checkbox inputs ("on" when checked, undefined when unchecked).
 *
 * @param val - The value to coerce
 * @returns true for "on"/"true", false for everything else
 */
export function coerceBoolean(val: unknown): boolean {
  if (val === "true" || val === "on" || val === true) {
    return true
  }
  return false
}

/**
 * Coerce a value to a string or null.
 * Converts empty strings to null for consistency.
 *
 * @param val - The value to coerce
 * @returns string if non-empty, null if empty/undefined
 */
export function coerceString(val: unknown): string | null {
  if (val === undefined || val === null) {
    return null
  }

  const str = String(val)
  return str.trim() === "" ? null : str
}

// =============================================================================
// Composable preprocessor wrappers
// =============================================================================

/**
 * Wraps a Zod number schema with form data coercion.
 *
 * Converts string numbers to actual numbers, empty strings/undefined to null.
 * Use `.nullable()` on the schema for optional fields.
 *
 * @example Required number with constraints
 * ```typescript
 * NumberField(
 *   z.number({
 *     error: (iss) => iss === undefined ? "Amount is required" : "Invalid number"
 *   })
 *   .int({ message: "Must be a whole number" })
 *   .positive({ message: "Must be greater than zero" })
 *   .max(999, { message: "Cannot exceed 999" })
 * )
 * ```
 *
 * @example Optional number
 * ```typescript
 * NumberField(z.number().int().nullable())
 * ```
 */
export function NumberField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(coerceNumber, schema)
}

/**
 * Wraps a Zod string schema with form data coercion.
 *
 * Converts empty strings/undefined to null.
 * Use `.nullable()` on the schema for optional fields.
 *
 * @example Required string
 * ```typescript
 * StringField(z.string().min(1, { message: "Name is required" }))
 * ```
 *
 * @example Optional string
 * ```typescript
 * StringField(z.string().nullable())
 * ```
 */
export function StringField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(coerceString, schema)
}

/**
 * Wraps a Zod boolean schema with form data coercion.
 *
 * Converts checkbox form values ("on"/undefined) to true/false.
 * Checkboxes are always boolean (never null), so no `.nullable()` needed.
 *
 * @example Checkbox field
 * ```typescript
 * BooleanField(z.boolean())
 * // Form: "on" → true
 * // Form: undefined → false
 * ```
 */
export function BooleanField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(coerceBoolean, schema)
}

/**
 * Wraps a Zod enum schema with form data coercion.
 *
 * Handles empty strings by converting to null.
 * Use `.nullable()` on the schema for optional enums (like select dropdowns with empty option).
 *
 * @example Required enum
 * ```typescript
 * EnumField(z.enum(["light", "medium", "heavy"]))
 * ```
 *
 * @example Optional enum (select with empty option)
 * ```typescript
 * EnumField(z.enum(["light", "medium", "heavy"]).nullable())
 * ```
 */
export function EnumField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => (val === "" || val === undefined ? null : val), schema)
}

/**
 * Wraps a Zod enum schema with number coercion for numeric enums.
 *
 * Converts string numbers to actual numbers, empty strings to null.
 * Useful for select dropdowns with numeric values.
 *
 * @example Numeric enum (select with number options)
 * ```typescript
 * NumericEnumField(z.enum([0, 1, 2]))
 * // Form: "1" → 1
 * // Form: "" → null
 * ```
 */
export function NumericEnumField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(coerceNumber, schema)
}

// =============================================================================
// Convenience builders (shortcuts for common patterns)
// =============================================================================

/**
 * Shortcut for a checkbox field.
 * Always returns true (checked) or false (unchecked).
 *
 * @example
 * ```typescript
 * Checkbox()
 * // Form: "on" → true
 * // Form: undefined → false
 * ```
 */
export function Checkbox() {
  return BooleanField(z.boolean())
}

/**
 * Shortcut for a required number field.
 * Empty values will fail validation.
 *
 * @example
 * ```typescript
 * RequiredNumber()
 * // Form: "42" → 42 → PASSES
 * // Form: "" → null → FAILS
 * ```
 */
export function RequiredNumber() {
  return NumberField(
    z.number({
      error: (iss) => (iss === undefined ? "This field is required" : "Must be a valid number"),
    })
  )
}

/**
 * Shortcut for an optional number field.
 * Empty values become null and pass validation.
 *
 * @example
 * ```typescript
 * OptionalNumber()
 * // Form: "42" → 42 → PASSES
 * // Form: "" → null → PASSES
 * ```
 */
export function OptionalNumber() {
  return z.preprocess(coerceNumber, z.number().nullable())
}

/**
 * Shortcut for a required string field.
 * Empty values will fail validation.
 *
 * @example
 * ```typescript
 * RequiredString()
 * // Form: "hello" → "hello" → PASSES
 * // Form: "" → null → FAILS
 * ```
 */
export function RequiredString() {
  return StringField(
    z
      .string({
        error: (iss) => (iss === undefined ? "This field is required" : "Must be a valid string"),
      })
      .min(1, { message: "This field is required" })
  )
}

/**
 * Shortcut for an optional string field.
 * Empty values become null and pass validation.
 *
 * @example
 * ```typescript
 * OptionalString()
 * // Form: "hello" → "hello" → PASSES
 * // Form: "" → null → PASSES
 * ```
 */
export function OptionalString() {
  return z.preprocess(coerceString, z.string().nullable())
}

// =============================================================================
// Array field helpers (for parseBody({ all: true, dot: true }))
// =============================================================================

/**
 * Wraps a Zod array schema with form data coercion.
 *
 * Use this for fields with [] suffix that may have multiple values.
 * Handles both single values and arrays from parseBody({ all: true }).
 *
 * @example Array of numbers
 * ```typescript
 * ArrayField(z.array(z.coerce.number().int().min(1).max(5)))
 * // Form with name="arcane_slots[]":
 * // Single: "3" → [3]
 * // Multiple: ["1", "2", "3"] → [1, 2, 3]
 * // Empty: undefined → []
 * ```
 *
 * @example Array of strings
 * ```typescript
 * ArrayField(z.array(z.string()))
 * // Form with name="tags[]":
 * // Multiple: ["combat", "magic"] → ["combat", "magic"]
 * ```
 */
export function ArrayField<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val) => {
    if (val === undefined || val === null || val === "") {
      return []
    }
    return Array.isArray(val) ? val : [val]
  }, schema)
}

/**
 * Creates a schema for object arrays using dot notation.
 *
 * Use this for fields like "dice.0.die", "dice.0.roll", "dice.1.die", etc.
 * Requires parseBody({ dot: true }) to convert dot notation to nested objects.
 *
 * The schema handles partial objects and filters out incomplete entries.
 *
 * @example Hit dice with die value and roll
 * ```typescript
 * ObjectArrayField(z.object({
 *   die: z.coerce.number().refine(v => [6, 8, 10, 12].includes(v)),
 *   roll: z.coerce.number().int().positive()
 * }))
 * // Form with names: "dice.0.die", "dice.0.roll", "dice.1.die", "dice.1.roll"
 * // Input: { dice: [{ die: "8", roll: "5" }, { die: "10", roll: "7" }] }
 * // Output: [{ die: 8, roll: 5 }, { die: 10, roll: 7 }]
 * ```
 */
export function ObjectArrayField<T extends z.ZodObject<z.ZodRawShape>>(itemSchema: T) {
  return z.preprocess((val) => {
    let arr: unknown[] = []
    if (Array.isArray(val)) {
      arr = val
    } else if (typeof val === "object" && val !== null) {
      // Convert object with numeric keys to array
      for (const key of Object.keys(val)) {
        const index = Number(key)
        if (!Number.isNaN(index)) {
          arr[index] = (val as Record<string, unknown>)[key]
        }
      }
    }

    // Filter out null/undefined entries and validate each item
    return arr.filter((item) => item !== null && item !== undefined)
  }, z.array(itemSchema))
}
