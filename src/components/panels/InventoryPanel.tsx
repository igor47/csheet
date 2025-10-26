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
          <div class="table-responsive">
            <table class="table table-sm table-hover small">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th style="width: 80px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                {character.equippedItems.map((item) => (
                  <tr>
                    <td>
                      {item.name}
                      {item.description && (
                        <span
                          class="ms-1"
                          title={item.description}
                          data-bs-toggle="tooltip"
                        >
                          <i class="bi bi-info-circle text-muted"></i>
                        </span>
                      )}
                    </td>
                    <td class="text-capitalize">{item.category}</td>
                    <td>
                      <div class="d-flex gap-1">
                        {item.worn && <span class="badge bg-secondary">Worn</span>}
                        {item.wielded && <span class="badge bg-primary">Wielded</span>}
                        {!item.worn && !item.wielded && (
                          <span class="text-muted small">In pack</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div class="d-flex gap-1">
                        {/* TODO: Add edit wear/wield state button */}
                        {/* TODO: Add drop item button */}
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary border p-0"
                          style="width: 24px; height: 24px; line-height: 1;"
                          aria-label="Item details"
                          title="Item details (coming soon)"
                          disabled
                        >
                          <i class="bi bi-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
