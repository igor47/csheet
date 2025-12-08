import { CampaignCharacterCard } from "@src/components/ui/CampaignCharacterCard"
import { CampaignMemberCard } from "@src/components/ui/CampaignMemberCard"
import { DetailModal } from "@src/components/ui/DetailModal"
import type { ComputedCampaign, ComputedCampaignCharacter } from "@src/services/campaigns/compute"

export interface CampaignProps {
  campaign: ComputedCampaign
}

interface CharacterCardProps {
  character: ComputedCampaignCharacter
  campaignId: string
  canReveal: boolean
  canRemove: boolean
  isDM: boolean
  isCurrentUser: boolean
}

const CharacterCard = ({
  character,
  campaignId,
  canReveal,
  canRemove,
  isDM,
  isCurrentUser,
}: CharacterCardProps) => {
  const subtitle = character.isNPC
    ? `Added by: ${character.added_by_email}`
    : `Played by: ${character.added_by_email}`

  // Show "Hidden" badge for hidden NPCs (only visible to DMs)
  const badge =
    isDM && character.isNPC && !character.revealed_at
      ? { text: "Hidden", variant: "secondary" as const }
      : undefined

  // Determine what actions to show
  const showView = isCurrentUser
  const showRemove = canRemove
  const showAddAnother = isCurrentUser && !character.isNPC

  return (
    <CampaignCharacterCard
      character={{
        id: character.character_id,
        name: character.name,
        avatars: character.avatars,
        level: character.level,
        className: character.class_name,
      }}
      subtitle={subtitle}
      badge={badge}
      isCurrentUser={isCurrentUser}
    >
      {/* NPC reveal/hide buttons */}
      {canReveal && character.isNPC && character.revealed_at && (
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          hx-post={`/campaigns/${campaignId}/characters/${character.character_id}/hide`}
          hx-confirm={`Hide ${character.name} from players?`}
        >
          <i class="bi bi-eye-slash" /> Hide
        </button>
      )}
      {canReveal && character.isNPC && !character.revealed_at && (
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          hx-post={`/campaigns/${campaignId}/characters/${character.character_id}/reveal`}
          hx-confirm={`Reveal ${character.name} to players?`}
        >
          <i class="bi bi-eye" /> Reveal
        </button>
      )}

      {/* Player character actions */}
      {showView && (
        <a href={`/characters/${character.character_id}`} class="btn btn-sm btn-outline-primary">
          View
        </a>
      )}

      {/* Overflow menu for owner or Remove button for DM */}
      {isCurrentUser && (showRemove || showAddAnother) ? (
        <div class="dropdown">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-three-dots-vertical" />
          </button>
          <ul class="dropdown-menu">
            {showRemove && (
              <li>
                <button
                  type="button"
                  class="dropdown-item text-danger"
                  hx-delete={`/campaigns/${campaignId}/characters/${character.character_id}`}
                  hx-confirm={`Remove ${character.name} from this campaign?`}
                >
                  <i class="bi bi-x-circle" /> Remove from Campaign
                </button>
              </li>
            )}
            {showAddAnother && (
              <li>
                <button
                  type="button"
                  class="dropdown-item"
                  data-bs-toggle="modal"
                  data-bs-target="#detailModal"
                  hx-get={`/campaigns/${campaignId}/add-character`}
                  hx-target="#detailModalContent"
                  hx-swap="innerHTML"
                >
                  <i class="bi bi-plus-circle" /> Add Another Character
                </button>
              </li>
            )}
          </ul>
        </div>
      ) : (
        showRemove &&
        !isCurrentUser && (
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            hx-delete={`/campaigns/${campaignId}/characters/${character.character_id}`}
            hx-confirm={`Remove ${character.name} from this campaign?`}
          >
            Remove
          </button>
        )
      )}
    </CampaignCharacterCard>
  )
}

export const Campaign = ({ campaign }: CampaignProps) => {
  const isDM = campaign.userRole === "dm"

  // Filter members by role, excluding DMs (they have their own section) and viewers
  // Also exclude declined members for non-DMs
  const allPartyMembers = campaign.members.filter((m) => m.role !== "viewer" && m.role !== "dm")
  const partyMembers = allPartyMembers
    .filter((m) => isDM || !m.declined_at) // Only DMs see declined members
    .sort((a, b) => {
      // Sort declined members to the end
      if (a.declined_at && !b.declined_at) return 1
      if (!a.declined_at && b.declined_at) return -1
      return 0
    })
  // Filter DMs - show pending/declined only to DMs
  const allDMs = campaign.members.filter((m) => m.role === "dm")
  const dmMembers = allDMs
    .filter((m) => isDM || m.accepted_at)
    .sort((a, b) => {
      // Sort: accepted first, then pending, then declined
      if (a.accepted_at && !b.accepted_at) return -1
      if (!a.accepted_at && b.accepted_at) return 1
      if (a.declined_at && !b.declined_at) return 1
      if (!a.declined_at && b.declined_at) return -1
      return 0
    })

  // Filter Viewers - show pending/declined only to DMs
  const allViewers = campaign.members.filter((m) => m.role === "viewer")
  const viewerMembers = allViewers
    .filter((m) => isDM || m.accepted_at)
    .sort((a, b) => {
      // Sort: accepted first, then pending, then declined
      if (a.accepted_at && !b.accepted_at) return -1
      if (!a.accepted_at && b.accepted_at) return 1
      if (a.declined_at && !b.declined_at) return 1
      if (!a.declined_at && b.declined_at) return -1
      return 0
    })

  // Filter NPCs (characters added by DMs)
  const allNPCs = campaign.characters.filter((c) => c.isNPC)
  const visibleNPCs = allNPCs.filter((npc) => isDM || npc.revealed_at !== null)

  return (
    <>
      <div class="container-fluid container-md mt-3">
        {/* Campaign Header */}
        <div class="row mb-4">
          <div class="col-12">
            <h1>{campaign.name}</h1>
            {campaign.description && <p class="text-muted">{campaign.description}</p>}
          </div>
        </div>

        {/* Section 1: Characters & Members (Party) */}
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Characters & Members</h3>
              {campaign.canInviteMembers && (
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#detailModal"
                  hx-get={`/campaigns/${campaign.id}/invite`}
                  hx-target="#detailModalContent"
                  hx-swap="innerHTML"
                >
                  <i class="bi bi-person-plus"></i> Invite Member
                </button>
              )}
            </div>

            {partyMembers.length === 0 ? (
              <div class="text-center text-muted py-4">
                <p>No members yet.</p>
              </div>
            ) : (
              <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {partyMembers.map((member) => {
                  // Find character for this member
                  const memberChar = campaign.characters.find(
                    (c) => c.user_id === member.user_id && !c.isNPC
                  )

                  if (memberChar) {
                    // Has character - render character-first
                    const isOwner = memberChar.user_id === campaign.currentUserId
                    return (
                      <div class="col" key={member.user_id}>
                        <CharacterCard
                          character={memberChar}
                          campaignId={campaign.id}
                          canReveal={campaign.canRevealCharacters}
                          canRemove={isOwner || isDM}
                          isDM={isDM}
                          isCurrentUser={isOwner}
                        />
                      </div>
                    )
                  }
                  const isCurrentUser = member.user_id === campaign.currentUserId

                  if (member.accepted_at) {
                    // Accepted but no character
                    return (
                      <div class="col" key={member.user_id}>
                        <CampaignMemberCard
                          title={member.email}
                          badge={{ text: "No Character", variant: "secondary" }}
                          isCurrentUser={isCurrentUser}
                        >
                          {isCurrentUser && (
                            <button
                              type="button"
                              class="btn btn-sm btn-primary"
                              data-bs-toggle="modal"
                              data-bs-target="#detailModal"
                              hx-get={`/campaigns/${campaign.id}/add-character`}
                              hx-target="#detailModalContent"
                              hx-swap="innerHTML"
                            >
                              <i class="bi bi-plus-circle" /> Add Character
                            </button>
                          )}
                          {isDM && !isCurrentUser && (
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              hx-delete={`/campaigns/${campaign.id}/members/${member.id}`}
                              hx-confirm={`Are you sure you want to remove ${member.email} from the campaign?`}
                              data-testid={`delete-member-${member.id}`}
                            >
                              <i class="bi bi-trash" /> Remove
                            </button>
                          )}
                        </CampaignMemberCard>
                      </div>
                    )
                  }
                  if (member.declined_at) {
                    // Declined invite (only visible to DMs)
                    return (
                      <div class="col" key={member.user_id}>
                        <CampaignMemberCard
                          title={member.email}
                          badge={{ text: "Declined", variant: "danger" }}
                        >
                          {isDM && (
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              hx-delete={`/campaigns/${campaign.id}/members/${member.id}`}
                              hx-confirm={`Are you sure you want to delete the declined invitation for ${member.email}?`}
                              data-testid={`delete-invite-${member.id}`}
                            >
                              <i class="bi bi-trash" /> Delete
                            </button>
                          )}
                        </CampaignMemberCard>
                      </div>
                    )
                  }
                  // Pending invite
                  return (
                    <div class="col" key={member.user_id}>
                      <CampaignMemberCard
                        title={member.email}
                        badge={{ text: "Pending Invite", variant: "warning", darkText: true }}
                      >
                        {isDM && (
                          <button
                            type="button"
                            class="btn btn-outline-danger btn-sm"
                            hx-delete={`/campaigns/${campaign.id}/members/${member.id}`}
                            hx-confirm={`Are you sure you want to delete the invitation for ${member.email}?`}
                            data-testid={`delete-invite-${member.id}`}
                          >
                            <i class="bi bi-trash" /> Delete Invite
                          </button>
                        )}
                      </CampaignMemberCard>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: NPCs - only show to players if there are visible NPCs */}
        {(isDM || visibleNPCs.length > 0) && (
          <div class="row mb-4">
            <div class="col-12">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3>NPCs</h3>
                {isDM && (
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#detailModal"
                    hx-get={`/campaigns/${campaign.id}/add-character`}
                    hx-target="#detailModalContent"
                    hx-swap="innerHTML"
                  >
                    <i class="bi bi-plus-circle"></i> Add NPC
                  </button>
                )}
              </div>

              {visibleNPCs.length === 0 ? (
                <div class="text-center text-muted py-4">
                  <p>No NPCs {isDM ? "added" : "revealed"} yet.</p>
                </div>
              ) : (
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                  {visibleNPCs.map((npc) => {
                    const isOwner = npc.added_by === campaign.currentUserId
                    return (
                      <div class="col" key={npc.id}>
                        <CharacterCard
                          character={npc}
                          campaignId={campaign.id}
                          canReveal={campaign.canRevealCharacters}
                          canRemove={isOwner || isDM}
                          isDM={isDM}
                          isCurrentUser={isOwner}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: DMs */}
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Dungeon Masters</h3>
              {campaign.canChangeDMRole && (
                <button type="button" class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-arrow-down-circle"></i> Change My Role
                </button>
              )}
            </div>

            {dmMembers.length === 0 ? (
              <div class="text-center text-muted py-4">
                <p>No dungeon masters yet.</p>
              </div>
            ) : (
              <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {dmMembers.map((dm) => {
                  const isCurrentUser = dm.user_id === campaign.currentUserId

                  if (dm.accepted_at) {
                    // Accepted DM
                    return (
                      <div class="col" key={dm.user_id}>
                        <CampaignMemberCard
                          title={dm.email}
                          badge={{ text: "DM", variant: "primary" }}
                          isCurrentUser={isCurrentUser}
                        />
                      </div>
                    )
                  }
                  if (dm.declined_at) {
                    // Declined DM invite
                    return (
                      <div class="col" key={dm.user_id}>
                        <CampaignMemberCard
                          title={dm.email}
                          badge={{ text: "Declined", variant: "danger" }}
                        >
                          {isDM && (
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              hx-delete={`/campaigns/${campaign.id}/members/${dm.id}`}
                              hx-confirm={`Are you sure you want to delete the declined DM invitation for ${dm.email}?`}
                              data-testid={`delete-dm-invite-${dm.id}`}
                            >
                              <i class="bi bi-trash" /> Delete
                            </button>
                          )}
                        </CampaignMemberCard>
                      </div>
                    )
                  }
                  // Pending DM invite
                  return (
                    <div class="col" key={dm.user_id}>
                      <CampaignMemberCard
                        title={dm.email}
                        badge={{ text: "Pending DM Invite", variant: "warning", darkText: true }}
                      >
                        {isDM && (
                          <button
                            type="button"
                            class="btn btn-outline-danger btn-sm"
                            hx-delete={`/campaigns/${campaign.id}/members/${dm.id}`}
                            hx-confirm={`Are you sure you want to delete the DM invitation for ${dm.email}?`}
                            data-testid={`delete-dm-invite-${dm.id}`}
                          >
                            <i class="bi bi-trash" /> Delete Invite
                          </button>
                        )}
                      </CampaignMemberCard>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Viewers */}
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Viewers</h3>
              {campaign.canManageViewers && (
                <button type="button" class="btn btn-primary btn-sm">
                  <i class="bi bi-person-plus"></i> Add Viewer
                </button>
              )}
            </div>

            {viewerMembers.length === 0 ? (
              <div class="text-center text-muted py-4">
                <p>No viewers yet.</p>
              </div>
            ) : (
              <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {viewerMembers.map((viewer) => {
                  const isCurrentUser = viewer.user_id === campaign.currentUserId

                  if (viewer.accepted_at) {
                    // Accepted viewer
                    return (
                      <div class="col" key={viewer.user_id}>
                        <CampaignMemberCard
                          title={viewer.email}
                          badge={{ text: "Viewer", variant: "info" }}
                          isCurrentUser={isCurrentUser}
                        />
                      </div>
                    )
                  }
                  if (viewer.declined_at) {
                    // Declined viewer invite
                    return (
                      <div class="col" key={viewer.user_id}>
                        <CampaignMemberCard
                          title={viewer.email}
                          badge={{ text: "Declined", variant: "danger" }}
                        >
                          {isDM && (
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              hx-delete={`/campaigns/${campaign.id}/members/${viewer.id}`}
                              hx-confirm={`Are you sure you want to delete the declined viewer invitation for ${viewer.email}?`}
                              data-testid={`delete-viewer-invite-${viewer.id}`}
                            >
                              <i class="bi bi-trash" /> Delete
                            </button>
                          )}
                        </CampaignMemberCard>
                      </div>
                    )
                  }
                  // Pending viewer invite
                  return (
                    <div class="col" key={viewer.user_id}>
                      <CampaignMemberCard
                        title={viewer.email}
                        badge={{
                          text: "Pending Viewer Invite",
                          variant: "warning",
                          darkText: true,
                        }}
                      >
                        {isDM && (
                          <button
                            type="button"
                            class="btn btn-outline-danger btn-sm"
                            hx-delete={`/campaigns/${campaign.id}/members/${viewer.id}`}
                            hx-confirm={`Are you sure you want to delete the viewer invitation for ${viewer.email}?`}
                            data-testid={`delete-viewer-invite-${viewer.id}`}
                          >
                            <i class="bi bi-trash" /> Delete Invite
                          </button>
                        )}
                      </CampaignMemberCard>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <DetailModal />
    </>
  )
}
