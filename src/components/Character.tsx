import type { CharNote } from "@src/db/char_notes"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { CharacterInfo } from "./CharacterInfo"
import type { ChatMessage } from "./ChatBox"
import { CurrentStatus } from "./CurrentStatus"
import { AbilitiesPanel } from "./panels/AbilitiesPanel"
import { InventoryPanel } from "./panels/InventoryPanel"
import { SkillsPanel } from "./panels/SkillsPanel"
import { SpellsPanel } from "./panels/SpellsPanel"
import { TraitsPanel } from "./panels/TraitsPanel"
import { SessionNotes } from "./SessionNotes"

type CharacterProps = {
  character: ComputedCharacter
  currentNote: CharNote | null
  chatMessages?: ChatMessage[]
}

export const Character = ({ character, currentNote, chatMessages }: CharacterProps) => {
  return (
    <>
      {/* Content */}
      <div class="container-fluid">
        <div class="character-grid">
          <CharacterInfo character={character} />

          <div class="character-main-view d-lg-flex flex-lg-column" id="character-main-view">
            <CurrentStatus character={character} chatMessages={chatMessages} />

            <SessionNotes characterId={character.id} currentNote={currentNote} />
          </div>

          {/* Panels */}
          <div class="character-panels">
            <div id="panels" class="accordion accordion-flush mx-0">
              {/* Abilities */}
              <div class="accordion-item">
                <h2 class="accordion-header" id="hdr-abilities">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#col-abilities"
                    aria-expanded="false"
                    aria-controls="col-abilities"
                  >
                    Abilities & Saves
                  </button>
                </h2>
                <div id="col-abilities" class="accordion-collapse collapse">
                  <AbilitiesPanel character={character} />
                </div>
              </div>

              {/* Skills & Proficiencies */}
              <div class="accordion-item">
                <h2 class="accordion-header" id="hdr-skills">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#col-skills"
                    aria-expanded="false"
                    aria-controls="col-skills"
                  >
                    Skills & Proficiencies
                  </button>
                </h2>
                <div id="col-skills" class="accordion-collapse collapse">
                  <SkillsPanel character={character} />
                </div>
              </div>

              {/* Traits & Features */}
              <div class="accordion-item">
                <h2 class="accordion-header" id="hdr-traits">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#col-traits"
                    aria-expanded="false"
                    aria-controls="col-traits"
                  >
                    Traits & Features
                  </button>
                </h2>
                <div id="col-traits" class="accordion-collapse collapse">
                  <TraitsPanel character={character} />
                </div>
              </div>

              {/* Spells */}
              <div class="accordion-item">
                <h2 class="accordion-header" id="hdr-spells">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#col-spells"
                    aria-expanded="false"
                    aria-controls="col-spells"
                  >
                    Spells
                  </button>
                </h2>
                <div id="col-spells" class="accordion-collapse collapse">
                  <SpellsPanel character={character} />
                </div>
              </div>

              {/* Inventory (example extra section) */}
              <div class="accordion-item">
                <h2 class="accordion-header" id="hdr-inventory">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#col-inventory"
                    aria-expanded="false"
                    aria-controls="col-inventory"
                  >
                    Inventory
                  </button>
                </h2>
                <div id="col-inventory" class="accordion-collapse collapse">
                  <InventoryPanel character={character} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/History Modal */}
      <div class="modal fade" id="editModal" tabindex={-1} aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content" id="editModalContent">
            {/* Content loaded via htmx */}
          </div>
        </div>
      </div>

      {/* Character-specific scripts */}
      <script src="/static/character.js"></script>
    </>
  )
}
