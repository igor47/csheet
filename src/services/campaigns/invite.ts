import { isSmtpConfigured } from "@src/config"
import { beginOrSavepoint } from "@src/db"
import * as campaignMembers from "@src/db/campaign_members"
import { CampaignMemberRoleSchema } from "@src/db/campaign_members"
import type { Campaign } from "@src/db/campaigns"
import type { User } from "@src/db/users"
import * as users from "@src/db/users"
import { sendCampaignInviteEmail } from "@src/lib/email"
import { Checkbox } from "@src/lib/formSchemas"
import { ulid } from "@src/lib/ids"
import { logger } from "@src/lib/logger"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"
import { z } from "zod"

export const CreateInviteSchema = z.object({
  email: z.email("Invalid email address"),
  role: CampaignMemberRoleSchema,
  baseUrl: z.url({ protocol: /^https?$/ }),
  forceReinvite: Checkbox(),
})

export type InviteResult = ServiceResult<{ memberId: string }>

class InviteError extends Error {
  field: string
  constructor(message: string, field: string) {
    super(message)
    this.name = "InviteError"
    this.field = field
  }
}

/**
 * Create a campaign invite and send the invitation email
 */
export async function createInvite(
  db: SQL,
  campaign: Campaign,
  inviter: User,
  data: Record<string, string>
): Promise<InviteResult> {
  // Validate with Zod schema
  const parsed = CreateInviteSchema.safeParse(data)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      errors[field] = issue.message
    }
    return { complete: false, values: data, errors }
  }

  const { email, role, baseUrl, forceReinvite } = parsed.data

  // Build magic link URL
  const inviteToken = ulid()
  const magicLink = `${baseUrl}/invite/view?token=${inviteToken}`

  // Use transaction so we rollback if email fails
  const result = await beginOrSavepoint(db, async (tx) => {
    // Find or create user
    let user = await users.findByEmail(tx, email)
    if (!user) {
      user = await users.create(tx, email)
    }

    // Check if user has any membership record (including deleted)
    const existingMember = await campaignMembers.findAnyByCampaignAndUser(tx, campaign.id, user.id)
    let member: campaignMembers.CampaignMember
    if (existingMember) {
      // Check if member was deleted (removed from campaign)
      if (existingMember.deleted_at) {
        if (!forceReinvite) {
          return {
            error: new InviteError("This user was previously removed from this campaign", "email"),
            canReinvite: true,
          }
        }
        // Reset the deleted member's invite
        const resetMember = await campaignMembers.resetInvite(
          tx,
          existingMember.id,
          inviteToken,
          inviter.id
        )
        if (!resetMember) {
          return { error: new InviteError("Failed to reset invitation", "_form") }
        }
        member = resetMember
      } else if (existingMember.accepted_at) {
        return { error: new InviteError("This user is already a member of this campaign", "email") }
      } else if (existingMember.declined_at) {
        if (!forceReinvite) {
          return {
            error: new InviteError("This user has previously declined this invitation", "email"),
            canReinvite: true,
          }
        }
        // Reset the declined invite
        const resetMember = await campaignMembers.resetInvite(
          tx,
          existingMember.id,
          inviteToken,
          inviter.id
        )
        if (!resetMember) {
          return { error: new InviteError("Failed to reset invitation", "_form") }
        }
        member = resetMember
      } else {
        // Pending invite exists
        return {
          error: new InviteError("An invitation has already been sent to this user", "email"),
        }
      }
    } else {
      // Create campaign member with pending status and invite token
      member = await campaignMembers.create(tx, {
        campaign_id: campaign.id,
        user_id: user.id,
        role,
        invite_token: inviteToken,
        invited_by: inviter.id,
        accepted_at: null,
        declined_at: null,
      })
    }

    // Send invite email (inside transaction so we rollback on failure)
    if (isSmtpConfigured()) {
      try {
        await sendCampaignInviteEmail({
          to: email,
          campaignName: campaign.name,
          inviterEmail: inviter.email!,
          role,
          magicLink,
        })
      } catch (emailError) {
        logger.error("Failed to send invite email", emailError as Error)
        // Throw to trigger rollback
        throw emailError
      }
    } else {
      logger.warn("Cannot send invite email: SMTP is not configured")
      logger.info(`Invite link for ${email}: ${magicLink}`)
    }

    return { member }
  }).catch((error) => {
    logger.error("Failed to create invite", error as Error)
    return { error: new InviteError("Failed to send invitation email", "_form") }
  })

  if ("error" in result && result.error) {
    const errors: Record<string, string> = { [result.error.field]: result.error.message }
    if ("canReinvite" in result && result.canReinvite) {
      errors._canReinvite = "true"
    }
    return { complete: false, values: data, errors }
  }

  if ("member" in result) {
    return { complete: true, result: { memberId: result.member.id } }
  }

  // Should never reach here, but satisfy TypeScript
  return { complete: false, values: data, errors: { _form: "Unknown error" } }
}
