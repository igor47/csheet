import { z } from "zod"

export const BooleanFormFieldSchema = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => v === true || v === "true")

export const OptionalNullStringSchema = z.string().nullable().optional().default(null)

export const NumberFormFieldSchema = z.coerce
  .number()
  .refine((n) => !isNaN(n), { message: "must be a number" })
