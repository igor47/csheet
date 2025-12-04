import { AvatarDisplay } from "@src/components/AvatarDisplay"
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
}

interface CharacterCardProps {
  character: ComputedCampaignCharacter
  canReveal: boolean
  isDM: boolean
}

interface PendingInviteCardProps {
  member: ComputedCampaignMember
  campaignId: string
  isDM: boolean
}

interface NoCharacterCardProps {
  member: ComputedCampaignMember
  isCurrentUser: boolean
  canAdd: boolean
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

const NoCharacterCard = ({ member, isCurrentUser, canAdd }: NoCharacterCardProps) => (
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
          <span class="badge bg-secondary">No Character</span>
          {canAdd && isCurrentUser && (
            <div class="mt-2">
              <button type="button" class="btn btn-sm btn-primary">
                <i class="bi bi-plus-circle" /> Add Character
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)

const CharacterCard = ({ character, canReveal, isDM }: CharacterCardProps) => {
  // Build a minimal character object for AvatarDisplay
  const charForAvatar = {
    id: character.character_id,
    name: character.name,
    avatars: character.avatars,
  }

  return (
    <div class="card h-100">
      <div class="row g-0">
        <div class="col-3">
          <div
            class="h-100"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
            style="cursor: pointer;"
          >
            <AvatarDisplay character={charForAvatar} mode="clickable-lightbox" avatarIndex={0} />
          </div>
        </div>
        <div class="col-9">
          <div class="card-body">
            <h5 class="card-title">{character.name}</h5>
            <p class="card-text text-muted mb-1">
              Level {character.level} {character.class_name}
            </p>
            <small class="text-muted">
              {character.isNPC
                ? `Added by: ${character.added_by_email}`
                : `Played by: ${character.added_by_email}`}
            </small>
            {isDM && !character.revealed_at && character.isNPC && (
              <div class="mt-2">
                <span class="badge bg-secondary">Hidden from Players</span>
              </div>
            )}
            {canReveal && character.isNPC && (
              <div class="mt-2">
                {character.revealed_at ? (
                  <button type="button" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-eye-slash" /> Hide
                  </button>
                ) : (
                  <button type="button" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-eye" /> Reveal
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const MemberCard = ({ member }: MemberCardProps) => (
  <div class="card h-100">
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
                    return (
                      <div class="col" key={member.user_id}>
                        <CharacterCard
                          character={memberChar}
                          canReveal={campaign.canRevealCharacters}
                          isDM={isDM}
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
                          isCurrentUser={false}
                          canAdd={campaign.canAddCharacters}
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

        {/* Section 2: NPCs */}
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>NPCs</h3>
              {isDM && (
                <button type="button" class="btn btn-primary btn-sm">
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
                {visibleNPCs.map((npc) => (
                  <div class="col" key={npc.id}>
                    <CharacterCard
                      character={npc}
                      canReveal={campaign.canRevealCharacters}
                      isDM={isDM}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                  <MemberCard member={dm} />
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
                    <MemberCard member={viewer} />
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
