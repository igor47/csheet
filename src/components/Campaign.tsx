import { CampaignCharacterCard } from "@src/components/ui/CampaignCharacterCard"
import { DetailModal } from "@src/components/ui/DetailModal"
import type {
  ComputedCampaign,
  ComputedCampaignCharacter,
  ComputedCampaignMember,
} from "@src/services/campaigns/compute"

export interface CampaignProps {
  campaign: ComputedCampaign
}

interface MemberCardProps {
  member: ComputedCampaignMember
  isCurrentUser: boolean
}

interface CharacterCardProps {
  character: ComputedCampaignCharacter
  campaignId: string
  canReveal: boolean
  canRemove: boolean
  isDM: boolean
  isCurrentUser: boolean
}

interface PendingInviteCardProps {
  member: ComputedCampaignMember
  campaignId: string
  isDM: boolean
}

interface NoCharacterCardProps {
  member: ComputedCampaignMember
  isCurrentUser: boolean
}

const PendingInviteCard = ({ member, campaignId, isDM }: PendingInviteCardProps) => (
  <div class="card h-100">
    <div class="row g-0">
      <div class="col-3">
        <div class="ratio ratio-1x1">
          <img
            src="/static/placeholder.png"
            alt="No avatar"
            class="rounded-start"
            style="object-fit: cover;"
          />
        </div>
      </div>
      <div class="col-9">
        <div class="card-body">
          <h6 class="card-title">{member.email}</h6>
          <span class="badge bg-warning text-dark">Pending Invite</span>
        </div>
      </div>
    </div>
    {isDM && (
      <div class="card-footer bg-transparent">
        <button
          type="button"
          class="btn btn-outline-danger btn-sm"
          hx-delete={`/campaigns/${campaignId}/members/${member.id}`}
          hx-confirm={`Are you sure you want to delete the invitation for ${member.email}?`}
          data-testid={`delete-invite-${member.id}`}
        >
          <i class="bi bi-trash" /> Delete Invite
        </button>
      </div>
    )}
  </div>
)

interface DeclinedInviteCardProps {
  member: ComputedCampaignMember
  campaignId: string
  isDM: boolean
}

const DeclinedInviteCard = ({ member, campaignId, isDM }: DeclinedInviteCardProps) => (
  <div class="card h-100">
    <div class="row g-0">
      <div class="col-3">
        <div class="ratio ratio-1x1">
          <img
            src="/static/placeholder.png"
            alt="No avatar"
            class="rounded-start"
            style="object-fit: cover;"
          />
        </div>
      </div>
      <div class="col-9">
        <div class="card-body">
          <h6 class="card-title">{member.email}</h6>
          <span class="badge bg-danger">Declined</span>
        </div>
      </div>
    </div>
    {isDM && (
      <div class="card-footer bg-transparent">
        <button
          type="button"
          class="btn btn-outline-danger btn-sm"
          hx-delete={`/campaigns/${campaignId}/members/${member.id}`}
          hx-confirm={`Are you sure you want to delete the declined invitation for ${member.email}?`}
          data-testid={`delete-invite-${member.id}`}
        >
          <i class="bi bi-trash" /> Delete
        </button>
      </div>
    )}
  </div>
)

const NoCharacterCard = ({ member, isCurrentUser }: NoCharacterCardProps) => (
  <div class={`card h-100 ${isCurrentUser ? "border-primary border-2" : ""}`}>
    <div class="row g-0">
      <div class="col-3">
        <div class="ratio ratio-1x1">
          <img
            src="/static/placeholder.png"
            alt="No avatar"
            class="rounded-start"
            style="object-fit: cover;"
          />
        </div>
      </div>
      <div class="col-9">
        <div class="card-body">
          <h6 class="card-title">{member.email}</h6>
          <span class="badge bg-secondary">No Character</span>
          {isCurrentUser && (
            <div class="mt-2">
              <button
                type="button"
                class="btn btn-sm btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#detailModal"
                hx-get={`/campaigns/${member.campaign_id}/add-character`}
                hx-target="#detailModalContent"
                hx-swap="innerHTML"
              >
                <i class="bi bi-plus-circle" /> Add Character
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)

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
      isCurrentUser={isCurrentUser}
    >
      {/* NPC-specific badges and reveal button */}
      {isDM && !character.revealed_at && character.isNPC && (
        <span class="badge bg-secondary">Hidden from Players</span>
      )}
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

const MemberCard = ({ member, isCurrentUser }: MemberCardProps) => (
  <div class={`card h-100 ${isCurrentUser ? "border-primary border-2" : ""}`}>
    <div class="card-body">
      <h6 class="card-title">{member.email}</h6>
      <span class={`badge ${member.role === "dm" ? "bg-primary" : "bg-info"}`}>
        {member.role.toUpperCase()}
      </span>
    </div>
  </div>
)

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
  const dms = campaign.members.filter((m) => m.role === "dm" && m.accepted_at)
  const viewers = campaign.members.filter((m) => m.role === "viewer" && m.accepted_at)

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
                  if (member.accepted_at) {
                    // Accepted but no character
                    return (
                      <div class="col" key={member.user_id}>
                        <NoCharacterCard
                          member={member}
                          isCurrentUser={member.user_id === campaign.currentUserId}
                        />
                      </div>
                    )
                  }
                  if (member.declined_at) {
                    // Declined invite (only visible to DMs)
                    return (
                      <div class="col" key={member.user_id}>
                        <DeclinedInviteCard member={member} campaignId={campaign.id} isDM={isDM} />
                      </div>
                    )
                  }
                  // Pending invite
                  return (
                    <div class="col" key={member.user_id}>
                      <PendingInviteCard member={member} campaignId={campaign.id} isDM={isDM} />
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

            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
              {dms.map((dm) => (
                <div class="col" key={dm.user_id}>
                  <MemberCard member={dm} isCurrentUser={dm.user_id === campaign.currentUserId} />
                </div>
              ))}
            </div>
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

            {viewers.length === 0 ? (
              <div class="text-center text-muted py-4">
                <p>No viewers yet.</p>
              </div>
            ) : (
              <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {viewers.map((viewer) => (
                  <div class="col" key={viewer.user_id}>
                    <MemberCard
                      member={viewer}
                      isCurrentUser={viewer.user_id === campaign.currentUserId}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DetailModal />
    </>
  )
}
