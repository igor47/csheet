import { beginOrSavepoint } from "@src/db"
import { type Campaign, create as createCampaignDb, nameExistsForUser } from "@src/db/campaigns"
import type { User } from "@src/db/users"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { SQL } from "bun"
import { z } from "zod"

export type CreateCampaignResult =
  | { complete: true; campaign: Campaign }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

const CreateCampaignApiSchema = z.object({
  name: z
    .string()
    .min(3, "Campaign name must be at least 3 characters")
    .max(100, "That name is too long!"),
  description: OptionalString(),
  is_check: Checkbox().optional().default(false),
})

export async function createCampaign(
  db: SQL,
  user: User,
  data: Record<string, string>
): Promise<CreateCampaignResult> {
  const errors: Record<string, string> = {}
  const values = data
  const isCheck = data.is_check === "true"

  // Soft validation for is_check
  if (!data.name) {
    if (!isCheck) {
      errors.name = "Campaign name is required"
    }
  } else if (data.name.trim().length === 0) {
    errors.name = "Campaign name is required"
  } else if (data.name.length < 3) {
    errors.name = "Campaign name must be at least 3 characters"
  } else if (data.name.length > 100) {
    errors.name = "Campaign name must be less than 100 characters"
  } else {
    const exists = await nameExistsForUser(db, user.id, data.name)
    if (exists) {
      errors.name = "You already have a campaign with this name"
    }
  }

  // Early return for validation errors or check mode
  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values, errors }
  }

  // Full validation with Zod schema
  const result = CreateCampaignApiSchema.safeParse(data)
  if (!result.success) {
    const zodErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      zodErrors[field] = issue.message
    }
    return { complete: false, values, errors: zodErrors }
  }

  const validated = result.data

  // Create campaign in database
  const campaign = await beginOrSavepoint(db, async (tx) => {
    const campaign = await createCampaignDb(tx, {
      name: validated.name,
      description: validated.description || null,
      created_by: user.id,
    })

    return campaign
  })

  return { complete: true, campaign }
}
