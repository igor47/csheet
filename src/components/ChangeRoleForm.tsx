import { ModalBody, ModalContent, ModalFooter } from "@src/components/ui/DetailModal"
import type { ComputedCampaign, ComputedCampaignMember } from "@src/services/campaigns/compute"
import clsx from "clsx"

export interface ChangeRoleFormProps {
  campaign: ComputedCampaign
  member: ComputedCampaignMember
  isSelfChange: boolean
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const ChangeRoleForm = ({
  campaign,
  member,
  isSelfChange,
  values = {},
  errors = {},
}: ChangeRoleFormProps) => {
  const actionUrl = isSelfChange
    ? `/campaigns/${campaign.id}/change-role`
    : `/campaigns/${campaign.id}/members/${member.id}/change-role`

  const title = isSelfChange ? "Change My Role" : `Change Role: ${member.email}`

  const currentRole = member.role
  const selectedRole = values.newRole || ""

  // Determine which role options are available (exclude current role)
  const canBecomeDM = currentRole !== "dm"
  const canBecomePlayer = currentRole !== "player"
  const canBecomeViewer = currentRole !== "viewer"

  // Count accepted DMs and characters for this member
  const dmCount = campaign.members.filter((m) => m.role === "dm" && m.accepted_at).length
  const characterCount = campaign.characters.filter((c) => c.added_by === member.user_id).length

  // Check for blocking conditions
  const isSoleDM = currentRole === "dm" && dmCount <= 1
  const hasCharacters = characterCount > 0

  // Viewer is blocked if user has characters (as player or DM)
  const viewerBlocked = hasCharacters

  return (
    <ModalContent title={title}>
      <form hx-post={actionUrl} hx-swap="innerHTML" hx-target="#detailModalContent">
        <ModalBody>
          {/* General error */}
          {errors._form && (
            <div class="alert alert-danger" role="alert">
              <i class="bi bi-exclamation-triangle"></i> {errors._form}
            </div>
          )}

          <div class="mb-3">
            <span class="form-label d-block">Current Role</span>
            <span
              class={clsx("badge", {
                "bg-primary": currentRole === "dm",
                "bg-success": currentRole === "player",
                "bg-info": currentRole === "viewer",
              })}
            >
              {currentRole === "dm"
                ? "Dungeon Master"
                : currentRole === "player"
                  ? "Player"
                  : "Viewer"}
            </span>
          </div>

          <div class="mb-3">
            <label for="newRole" class="form-label">
              New Role
            </label>
            <select
              class={clsx("form-select", { "is-invalid": errors.newRole })}
              id="newRole"
              name="newRole"
              required
              disabled={isSoleDM}
            >
              <option value="">Select a role...</option>
              {canBecomeDM && (
                <option value="dm" selected={selectedRole === "dm"}>
                  Dungeon Master
                </option>
              )}
              {canBecomePlayer && (
                <option value="player" selected={selectedRole === "player"}>
                  Player
                </option>
              )}
              {canBecomeViewer && (
                <option
                  value="viewer"
                  selected={selectedRole === "viewer"}
                  disabled={viewerBlocked}
                >
                  Viewer {viewerBlocked ? "(remove characters first)" : ""}
                </option>
              )}
            </select>
            {errors.newRole && <div class="invalid-feedback d-block">{errors.newRole}</div>}
          </div>

          {/* Warning: Sole DM cannot change */}
          {isSoleDM && (
            <div class="alert alert-warning" role="alert">
              <i class="bi bi-exclamation-triangle"></i> You are the only DM. Invite another DM
              before changing your role.
            </div>
          )}

          {/* Warning: DM leaving loses management */}
          {isSelfChange && currentRole === "dm" && !isSoleDM && (
            <div class="alert alert-warning" role="alert">
              <i class="bi bi-exclamation-triangle"></i> You won't be able to manage the campaign or
              become a DM again unless another DM promotes you.
            </div>
          )}

          {/* Info: DM->Player with NPCs */}
          {currentRole === "dm" && characterCount > 0 && (
            <div class="alert alert-info" role="alert">
              <i class="bi bi-info-circle"></i> You have {characterCount}
              {characterCount === 1 ? " NPC" : " NPCs"} in this campaign. If you become a Player,
              {characterCount === 1 ? " this NPC will" : " they will"} be revealed to all players
              and become
              {characterCount === 1 ? " your character." : " your characters."}
            </div>
          )}

          {/* Info: Player->DM with characters */}
          {currentRole === "player" && characterCount > 0 && (
            <div class="alert alert-info" role="alert">
              <i class="bi bi-info-circle"></i> {isSelfChange ? "You have" : "This member has"}{" "}
              {characterCount}
              {characterCount === 1 ? " character" : " characters"} in the campaign. Becoming a DM
              will convert
              {characterCount === 1 ? " it to an NPC" : " them to NPCs"} visible to players.
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={isSoleDM}>
            <i class="bi bi-arrow-repeat"></i> Change Role
          </button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}
