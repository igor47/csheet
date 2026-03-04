import type { CharNote } from "@src/db/char_notes"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { clsx } from "clsx"
import { CharacterInfo } from "./CharacterInfo"
import { ChatBox } from "./ChatBox"
import { AbilitiesPanel } from "./panels/AbilitiesPanel"
import { InventoryPanel } from "./panels/InventoryPanel"
import { SkillsPanel } from "./panels/SkillsPanel"
import { SpellsPanel } from "./panels/SpellsPanel"
import { TraitsPanel } from "./panels/TraitsPanel"
import { WildShapePanel } from "./panels/WildShapePanel"
import { SessionNotes } from "./SessionNotes"
import { DetailModal } from "./ui/DetailModal"

type CharacterProps = {
  character: ComputedCharacter
  currentNote: CharNote | null
  isReadOnly?: boolean
}

// Shared accordion panels component
const CharacterPanels = ({
  character,
  isReadOnly,
}: {
  character: ComputedCharacter
  isReadOnly: boolean
}) => (
  <div id="panels" class="accordion accordion-flush mx-0">
    {/* Abilities */}
    <div class="accordion-item">
      <h2 class="accordion-header" id="hdr-abilities">
        <button
          class={clsx("accordion-button", { collapsed: !isReadOnly })}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#col-abilities"
          aria-expanded={isReadOnly ? "true" : "false"}
          aria-controls="col-abilities"
        >
          <i class="bi bi-dpad me-2"></i>
          Abilities & Saves
        </button>
      </h2>
      <div id="col-abilities" class={clsx("accordion-collapse collapse", { show: isReadOnly })}>
        <AbilitiesPanel character={character} isReadOnly={isReadOnly} />
      </div>
    </div>

    {/* Skills & Proficiencies */}
    <div class="accordion-item">
      <h2 class="accordion-header" id="hdr-skills">
        <button
          class={clsx("accordion-button", { collapsed: !isReadOnly })}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#col-skills"
          aria-expanded={isReadOnly ? "true" : "false"}
          aria-controls="col-skills"
        >
          <i class="bi bi-wrench me-2"></i>
          Skills & Proficiencies
        </button>
      </h2>
      <div id="col-skills" class={clsx("accordion-collapse collapse", { show: isReadOnly })}>
        <SkillsPanel character={character} isReadOnly={isReadOnly} />
      </div>
    </div>

    {/* Traits & Features */}
    <div class="accordion-item">
      <h2 class="accordion-header" id="hdr-traits">
        <button
          class={clsx("accordion-button", { collapsed: !isReadOnly })}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#col-traits"
          aria-expanded={isReadOnly ? "true" : "false"}
          aria-controls="col-traits"
        >
          <i class="bi bi-list-stars me-2"></i>
          Traits & Features
        </button>
      </h2>
      <div id="col-traits" class={clsx("accordion-collapse collapse", { show: isReadOnly })}>
        <TraitsPanel character={character} isReadOnly={isReadOnly} />
      </div>
    </div>

    {/* Spells */}
    <div class="accordion-item">
      <h2 class="accordion-header" id="hdr-spells">
        <button
          class={clsx("accordion-button", { collapsed: !isReadOnly })}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#col-spells"
          aria-expanded={isReadOnly ? "true" : "false"}
          aria-controls="col-spells"
        >
          <i class="bi bi-magic me-2"></i>
          Spells
        </button>
      </h2>
      <div id="col-spells" class={clsx("accordion-collapse collapse", { show: isReadOnly })}>
        <SpellsPanel character={character} isReadOnly={isReadOnly} />
      </div>
    </div>

    {/* Wild Shape (druids only) */}
    {character.wildShape && (
      <div class="accordion-item">
        <h2 class="accordion-header" id="hdr-wildshape">
          <button
            class={clsx("accordion-button", { collapsed: !isReadOnly })}
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#col-wildshape"
            aria-expanded={isReadOnly ? "true" : "false"}
            aria-controls="col-wildshape"
          >
            <i class="bi bi-feather me-2"></i>
            Wild Shape
          </button>
        </h2>
        <div id="col-wildshape" class={clsx("accordion-collapse collapse", { show: isReadOnly })}>
          <WildShapePanel character={character} isReadOnly={isReadOnly} />
        </div>
      </div>
    )}

    {/* Inventory */}
    <div class="accordion-item">
      <h2 class="accordion-header" id="hdr-inventory">
        <button
          class={clsx("accordion-button", { collapsed: !isReadOnly })}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#col-inventory"
          aria-expanded={isReadOnly ? "true" : "false"}
          aria-controls="col-inventory"
        >
          <i class="bi bi-backpack me-2"></i>
          Inventory
        </button>
      </h2>
      <div id="col-inventory" class={clsx("accordion-collapse collapse", { show: isReadOnly })}>
        <InventoryPanel character={character} isReadOnly={isReadOnly} />
      </div>
    </div>
  </div>
)

export const Character = ({ character, currentNote, isReadOnly = false }: CharacterProps) => {
  const emptyChat = {
    chatId: "",
    messages: [],
    llmMessages: [],
    shouldStream: false,
    unresolvedToolCalls: [],
    consecutiveErrorCount: 0,
  }

  return (
    <>
      {/* DM Viewing Banner */}
      {isReadOnly && (
        <div class="alert alert-info mb-0 rounded-0 text-center" role="alert">
          <i class="bi bi-eye me-2"></i>
          <strong>Viewing as DM</strong> - This is a read-only view of another player's character
          sheet.
        </div>
      )}

      {/* Content */}
      {isReadOnly ? (
        // Read-only mode: simple centered single-column layout
        <div class="container py-3" style={{ maxWidth: "800px" }}>
          <CharacterInfo character={character} isReadOnly={isReadOnly} />
          <div class="mt-3">
            <CharacterPanels character={character} isReadOnly={isReadOnly} />
          </div>
        </div>
      ) : (
        // Normal mode: grid layout with sidebar
        <div class="container-fluid">
          <div class="character-grid">
            <CharacterInfo character={character} isReadOnly={isReadOnly} />

            <div class="character-main-view d-lg-flex flex-lg-column" id="character-main-view">
              {/* AI Chat Box - rendered first if enabled, always starts with new chat */}
              <ChatBox character={character} computedChat={emptyChat} />
              <SessionNotes characterId={character.id} currentNote={currentNote} />
            </div>

            <div class="character-panels">
              <CharacterPanels character={character} isReadOnly={isReadOnly} />
            </div>
          </div>
        </div>
      )}

      <DetailModal />

      {/* Character-specific scripts */}
      <script src="/static/character.js"></script>
    </>
  )
}
