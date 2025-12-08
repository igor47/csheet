import { CampaignCharacterCard } from "@src/components/ui/CampaignCharacterCard"
import { ModalBody, ModalContent, ModalFooter } from "@src/components/ui/DetailModal"
import type { ListCharacter } from "@src/services/listCharacters"

export interface AddCharacterToCampaignProps {
  campaignId: string
  characters: ListCharacter[]
  errors?: Record<string, string>
  mode?: "character" | "npc"
}

export const AddCharacterToCampaign = ({
  campaignId,
  characters,
  errors,
  mode = "character",
}: AddCharacterToCampaignProps) => {
  const isNpcMode = mode === "npc"
  const title = isNpcMode ? "Add NPC" : "Add Character"
  const buttonText = isNpcMode ? "Add as NPC" : "Add to Campaign"
  const emptyStateTitle = isNpcMode ? "No Characters Available" : "No Characters Available"
  const emptyStateMessage = isNpcMode
    ? "Create a character first, then come back here to add them as an NPC."
    : "Create a character first, then come back here to add them to the campaign."
  const selectionPrompt = isNpcMode
    ? "Select a character to add as an NPC:"
    : "Select a character to add to this campaign:"

  if (characters.length === 0) {
    return (
      <ModalContent title={title}>
        <ModalBody>
          <div class="text-center py-4">
            <i class="bi bi-person-plus text-muted fs-1 mb-3 d-block" />
            <h5>{emptyStateTitle}</h5>
            <p class="text-muted">{emptyStateMessage}</p>
            <a href="/characters" class="btn btn-primary">
              <i class="bi bi-arrow-right" /> Go to Characters
            </a>
          </div>
        </ModalBody>
      </ModalContent>
    )
  }

  return (
    <ModalContent title={title}>
      <ModalBody>
        {errors?.general && <div class="alert alert-danger mb-3">{errors.general}</div>}
        <p class="text-muted mb-3">{selectionPrompt}</p>
        <div class="row row-cols-1 row-cols-sm-2 g-3">
          {characters.map((char) => (
            <div class="col" key={char.id}>
              <CampaignCharacterCard
                character={{
                  id: char.id,
                  name: char.name,
                  avatars: char.avatars,
                  level: char.totalLevel,
                  className: char.classes[0]?.class || "Unknown",
                }}
              >
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  hx-post={`/campaigns/${campaignId}/characters/${char.id}`}
                  hx-target="#detailModalContent"
                  hx-swap="innerHTML"
                >
                  {buttonText}
                </button>
              </CampaignCharacterCard>
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
      </ModalFooter>
    </ModalContent>
  )
}
