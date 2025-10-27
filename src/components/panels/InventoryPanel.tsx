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
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="mb-0">Items</h6>
          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              hx-get={`/characters/${character.id}/edit/newitem`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#editModal"
            >
              <i class="bi bi-plus-circle"></i> Add Item
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              hx-get={`/characters/${character.id}/history/items`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#editModal"
            >
              <i class="bi bi-clock-history"></i> History
            </button>
          </div>
        </div>

        {character.equippedItems.length === 0 ? (
          <p class="text-muted small">No items in inventory.</p>
        ) : (
          <div class="d-flex flex-column gap-2">
            {character.equippedItems.map((item) => (
              <div class="row g-2 align-items-center border-bottom pb-2">
                <div class="col-12 col-md-6">
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <strong>{item.name}</strong>
                    {item.worn && <span class="badge bg-secondary">Worn</span>}
                    {item.wielded && <span class="badge bg-primary">Wielded</span>}
                    <span class="badge bg-light text-dark text-capitalize">{item.category}</span>
                    {item.description && (
                      <span title={item.description} data-bs-toggle="tooltip">
                        <i class="bi bi-info-circle text-muted"></i>
                      </span>
                    )}
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <div class="d-flex gap-2 justify-content-md-end">
                    {/* TODO: Add edit wear/wield state button */}
                    {/* TODO: Add drop item button */}
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      hx-get={`/characters/${character.id}/items/${item.id}/edit`}
                      hx-target="#editModalContent"
                      hx-swap="innerHTML"
                      data-bs-toggle="modal"
                      data-bs-target="#editModal"
                    >
                      <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      hx-get={`/characters/${character.id}/items/${item.id}/effects`}
                      hx-target="#editModalContent"
                      hx-swap="innerHTML"
                      data-bs-toggle="modal"
                      data-bs-target="#editModal"
                    >
                      <i class="bi bi-stars"></i> Effects
                      {item.effects.length > 0 && (
                        <span class="badge bg-secondary ms-1">{item.effects.length}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
