import { create as createTrait, TraitSourceSchema } from "@src/db/char_traits"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { ToolExecutorResult } from "@src/tools"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const AddTraitApiSchema = z.object({
  character_id: z.string(),
  name: z
    .string()
    .min(1, "Trait name is required")
    .describe("The name of the trait/feature (e.g., 'Darkvision', 'Action Surge')"),
  description: z
    .string()
    .min(1, "Trait description is required")
    .describe("The description of what the trait does"),
  source: TraitSourceSchema.describe(
    "The source of the trait: 'species', 'lineage', 'background', 'class', 'subclass', or 'feat'"
  ),
  source_detail: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe("Additional detail about the source (e.g., the class name, feat name)"),
  level: z
    .number()
    .int()
    .nullable()
    .optional()
    .default(null)
    .describe("The level at which this trait was gained (optional)"),
  note: z.string().nullable().optional().default(null).describe("Optional note about the trait"),
})

type AddTraitData = Partial<z.infer<typeof AddTraitApiSchema>>

export type AddTraitResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Add a trait to a character
 * Can be called with isCheck for validation or without for persistence
 */
export async function addTrait(db: SQL, data: Record<string, string>): Promise<AddTraitResult> {
  const errors: Record<string, string> = {}
  const values = data as AddTraitData
  const isCheck = data.is_check === "true"

  // Soft validation for is_check
  if (!values.character_id && !isCheck) {
    errors.character_id = "Character ID is required"
  }

  if (!values.name) {
    if (!isCheck) {
      errors.name = "Trait name is required"
    }
  } else if (values.name.trim().length === 0) {
    errors.name = "Trait name is required"
  }

  if (!values.description) {
    if (!isCheck) {
      errors.description = "Trait description is required"
    }
  } else if (values.description.trim().length === 0) {
    errors.description = "Trait description is required"
  }

  if (!values.source && !isCheck) {
    errors.source = "Trait source is required"
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Full validation with Zod
  const result = AddTraitApiSchema.safeParse({
    ...values,
    level: values.level ? Number(values.level) : null,
  })

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Persist the trait
  await createTrait(db, result.data)

  return { complete: true }
}

// Vercel AI SDK tool definition
export const addTraitToolName = "add_trait" as const
export const addTraitTool = tool({
  name: addTraitToolName,
  description: `Add a trait, feature, or feat to the character. This can be used for custom traits, feats gained, or features from magic items.`,
  inputSchema: AddTraitApiSchema.omit({ character_id: true }),
})

/**
 * Execute the add_trait tool from AI assistant
 */
export async function executeAddTrait(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
): Promise<ToolExecutorResult> {
  const data: Record<string, string> = {
    character_id: char.id,
    name: parameters.name?.toString() || "",
    description: parameters.description?.toString() || "",
    source: parameters.source?.toString() || "",
    source_detail: parameters.source_detail?.toString() || "",
    level: parameters.level?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  const result = await addTrait(db, data)

  if (!result.complete) {
    const errorMessage = Object.values(result.errors).join(", ")
    return {
      status: "failed",
      error: errorMessage || "Failed to add trait",
    }
  }

  return {
    status: "success",
  }
}

/**
 * Format approval message for add_trait tool calls
 */
export function formatAddTraitApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { name, source, source_detail, note } = parameters

  let message = `Add trait: ${name}`
  if (source_detail) {
    message += ` (from ${source_detail})`
  } else if (source) {
    message += ` (from ${source})`
  }

  if (note) {
    message += `\n${note}`
  }

  return message
}
