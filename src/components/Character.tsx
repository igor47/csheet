import type { ComputedCharacter } from '@src/services/computeCharacter';
import { CharacterInfo } from './CharacterInfo';
import { AbilitiesPanel } from './panels/AbilitiesPanel';
import { SkillsPanel } from './panels/SkillsPanel';
import { TraitsPanel } from './panels/TraitsPanel';
import { SpellsPanel } from './panels/SpellsPanel';
import { InventoryPanel } from './panels/InventoryPanel';

type CharacterProps = {
  character: ComputedCharacter;
}

export const Character = ({ character }: CharacterProps) => {
  return (<>
    {/* Content */}
    <div class="container-fluid">
      <div class="character-grid">
        <CharacterInfo character={character} />

        <div class="character-notes d-lg-flex flex-lg-column">
          <div class="card shadow-sm flex-lg-fill d-lg-flex flex-lg-column">
            <div class="card-header">
              <h5 class="mb-0">Session Notes</h5>
            </div>
            <div class="card-body flex-lg-fill d-lg-flex flex-lg-column">
              <textarea class="form-control flex-lg-fill" style="min-height: 300px" placeholder="Write your notes here..."></textarea>
            </div>
          </div>
        </div>

        {/* Panels */}
        <div class="character-panels">
          <div id="panels" class="accordion accordion-flush mx-0">
            {/* Abilities */}
            <div class="accordion-item">
              <h2 class="accordion-header" id="hdr-abilities">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-abilities" aria-expanded="false" aria-controls="col-abilities">
                  Abilities & Saves
                </button>
              </h2>
              <div id="col-abilities" class="accordion-collapse collapse" aria-labelledby="hdr-abilities">
                <AbilitiesPanel character={character} />
              </div>
            </div>

            {/* Skills & Proficiencies */}
            <div class="accordion-item">
              <h2 class="accordion-header" id="hdr-skills">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-skills" aria-expanded="false" aria-controls="col-skills">
                  Skills & Proficiencies
                </button>
              </h2>
              <div id="col-skills" class="accordion-collapse collapse" aria-labelledby="hdr-skills">
                <SkillsPanel character={character} />
              </div>
            </div>

            {/* Traits & Features */}
            <div class="accordion-item">
              <h2 class="accordion-header" id="hdr-traits">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-traits" aria-expanded="false" aria-controls="col-traits">
                  Traits & Features
                </button>
              </h2>
              <div id="col-traits" class="accordion-collapse collapse" aria-labelledby="hdr-traits">
                <TraitsPanel />
              </div>
            </div>

            {/* Spells */}
            <div class="accordion-item">
              <h2 class="accordion-header" id="hdr-spells">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-spells" aria-expanded="false" aria-controls="col-spells">
                  Spells
                </button>
              </h2>
              <div id="col-spells" class="accordion-collapse collapse" aria-labelledby="hdr-spells">
                <SpellsPanel />
              </div>
            </div>

            {/* Inventory (example extra section) */}
            <div class="accordion-item">
              <h2 class="accordion-header" id="hdr-inventory">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-inventory" aria-expanded="false" aria-controls="col-inventory">
                  Inventory
                </button>
              </h2>
              <div id="col-inventory" class="accordion-collapse collapse" aria-labelledby="hdr-inventory">
                <InventoryPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Edit/History Modal */}
    <div class="modal fade" id="editModal" tabindex={-1} aria-labelledby="editModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content" id="editModalContent">
          {/* Content loaded via htmx */}
        </div>
      </div>
    </div>

  </>)
}
