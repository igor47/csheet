import { z } from "zod"

export const BooleanFormFieldSchema = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => v === true || v === "true")

export const CheckboxFormFieldSchema = z
  .union([z.literal("on"), z.literal("off"), z.undefined()])
  .transform((v) => (v === "on" ? "on" : "off"))
  .default("off")

export const OptionalNullStringSchema = z.string().nullable().optional().default(null)

export const NumberFormFieldSchema = z.coerce
  .number()
  .refine((n) => !Number.isNaN(n), { message: "must be a number" })

export const NumericSelectFormFieldSchema = z
  .literal("")
  .transform(() => undefined)
  .or(NumberFormFieldSchema)

export function EmptyIsUndefined(v: unknown) {
  if (typeof v === "string" && v.trim() === "") {
    return undefined
  }
  return v
}

export function StringIsNumber(v: unknown) {
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isNaN(n) ? v : n
  }
  return v
}

export function StringNumberEnum<const T extends readonly number[]>(values: T) {
  return z
    .preprocess(
      (v) => StringIsNumber(EmptyIsUndefined(v)),
      z.union(values.map((n) => z.literal(n)))
    )
    .refine((v) => values.includes(v as (typeof values)[number]), {
      message: `Should be one of ${values.join(", ")}`,
    })
}

export function UnsetEnumSchema(zEnum: z.ZodEnum) {
  return z.preprocess((v) => EmptyIsUndefined(v), zEnum).optional()
}

function identity<T>(x: T): T {
  return x
}

export function RequiredStringNumberSchema(mod: (s: z.ZodNumber) => z.ZodNumber = identity) {
  return z.preprocess(
    (v) => StringIsNumber(EmptyIsUndefined(v)),
    mod(z.number({ error: (iss) => (iss === undefined ? "Field is required" : "Invalid number") }))
  )
}
