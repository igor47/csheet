import { LabeledValue } from "@src/components/ui/LabeledValue"
import type { ComputedCharacter } from "@src/services/computeCharacter"

interface InventoryPanelProps {
  character: ComputedCharacter
  swapOob?: boolean
}

export const InventoryPanel = ({ character, swapOob }: InventoryPanelProps) => {
  const coins = character.coins || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }

  return (
    <div class="accordion-body" id="inventory-panel" hx-swap-oob={swapOob && "true"}>
      {/* Coins Section */}
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="mb-0">Coins</h6>
          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              hx-get={`/characters/${character.id}/edit/coins`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#editModal"
            >
              <i class="bi bi-pencil"></i> Edit Coins
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              hx-get={`/characters/${character.id}/history/coins`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#editModal"
            >
              <i class="bi bi-clock-history"></i> History
            </button>
          </div>
        </div>

        <div class="row row-cols-5 g-2">
          <div class="col">
            <LabeledValue label="PP" value={coins.pp} />
          </div>
          <div class="col">
            <LabeledValue label="GP" value={coins.gp} />
          </div>
          <div class="col">
            <LabeledValue label="EP" value={coins.ep} />
          </div>
          <div class="col">
            <LabeledValue label="SP" value={coins.sp} />
          </div>
          <div class="col">
            <LabeledValue label="CP" value={coins.cp} />
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div>
        <h6 class="mb-2">Items</h6>
        <table class="table table-sm align-middle">
          <thead class="table-light">
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rope (50 ft)</td>
              <td>1</td>
              <td>Hempen</td>
            </tr>
            <tr>
              <td>Rations</td>
              <td>6</td>
              <td>Days</td>
            </tr>
            <tr>
              <td>Healing Potion</td>
              <td>2</td>
              <td>2d4+2</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
