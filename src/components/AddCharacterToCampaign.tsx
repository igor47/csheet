import { CampaignCharacterCard } from "@src/components/ui/CampaignCharacterCard"
import { ModalBody, ModalContent, ModalFooter } from "@src/components/ui/DetailModal"
import type { ListCharacter } from "@src/services/listCharacters"

export interface AddCharacterToCampaignProps {
  campaignId: string
  characters: ListCharacter[]
  errors?: Record<string, string>
}

export const AddCharacterToCampaign = ({
  campaignId,
  characters,
  errors,
}: AddCharacterToCampaignProps) => {
  if (characters.length === 0) {
    return (
      <ModalContent title="Add Character">
        <ModalBody>
          <div class="text-center py-4">
            <i class="bi bi-person-plus text-muted fs-1 mb-3 d-block" />
            <h5>No Characters Available</h5>
            <p class="text-muted">
              Create a character first, then come back here to add them to the campaign.
            </p>
            <a href="/characters" class="btn btn-primary">
              <i class="bi bi-arrow-right" /> Go to Characters
            </a>
          </div>
        </ModalBody>
      </ModalContent>
    )
  }

  return (
    <ModalContent title="Add Character">
      <ModalBody>
        {errors?.general && <div class="alert alert-danger mb-3">{errors.general}</div>}
        <p class="text-muted mb-3">Select a character to add to this campaign:</p>
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
                  Add to Campaign
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
