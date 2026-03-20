import { type UpdateUserData, type User, update } from "@src/db/users"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { syncContact } from "@src/services/syncContact"
import type { SQL } from "bun"
import { z } from "zod"

export type UpdateProfileResult = ServiceResult<{ user: User }>

const UpdateProfileSchema = z.object({
  name: OptionalString().pipe(
    z.string().trim().max(100, "Name must be 100 characters or less").nullable()
  ),
  marketing_opt_in: Checkbox(),
})

export async function updateProfile(
  db: SQL,
  user: User,
  data: Record<string, string>
): Promise<UpdateProfileResult> {
  const values = data

  const result = UpdateProfileSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values, errors: zodToFormErrors(result.error) }
  }

  const validated = result.data
  const updateData: UpdateUserData = {
    name: validated.name,
    marketing_opt_in: validated.marketing_opt_in,
  }

  const updatedUser = await update(db, user.id, updateData)
  if (!updatedUser) {
    return {
      complete: false,
      values,
      errors: { general: "Failed to update profile. Please try again." },
    }
  }

  await syncContact(db, updatedUser)
  return { complete: true, result: { user: updatedUser } }
}
