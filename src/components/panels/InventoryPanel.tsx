import { LabeledValue } from "@src/components/ui/LabeledValue"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { EquippedComputedItem } from "@src/services/computeCharacterItems"

interface InventoryPanelProps {
  character: ComputedCharacter
  swapOob?: boolean
}

interface InventoryItemRowProps {
  item: EquippedComputedItem
  characterId: string
}

const InventoryItemRow = ({ item, characterId }: InventoryItemRowProps) => {
  return (
    <div class="row g-2 border-bottom pb-2 mb-2">
      {/* Item name and badges */}
      <div class="col-12 col-md-6 d-flex align-items-center">
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            class="btn btn-link p-0 text-start fw-bold"
            data-bs-toggle="modal"
            data-bs-target="#editModal"
            hx-get={`/characters/${characterId}/items/${item.id}`}
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            {item.name}
          </button>
          {item.worn && <span class="badge bg-secondary">Worn</span>}
          {item.wielded && <span class="badge bg-primary">Wielded</span>}
          <span class="badge bg-secondary text-capitalize">{item.category}</span>
        </div>
      </div>

      {/* Button groups */}
      <div class="col-12 col-md-6">
        <div class="d-flex flex-column gap-1">
          {/* Row 1: State and charge buttons */}
          <div class="d-flex gap-2 justify-content-start justify-content-md-end flex-wrap">
            {item.wearable && !item.worn && (
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                hx-post={`/characters/${characterId}/items/${item.id}/wear`}
                hx-swap="none"
              >
                <i class="bi bi-person-fill-up"></i> Wear
              </button>
            )}
            {item.wearable && item.worn && (
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                hx-post={`/characters/${characterId}/items/${item.id}/remove`}
                hx-swap="none"
              >
                <i class="bi bi-person-fill-dash"></i> Remove
              </button>
            )}
            {item.wieldable && !item.wielded && (
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                hx-post={`/characters/${characterId}/items/${item.id}/wield`}
                hx-swap="none"
              >
                <i class="bi bi-hand-thumbs-up"></i> Wield
              </button>
            )}
            {item.wieldable && item.wielded && (
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                hx-post={`/characters/${characterId}/items/${item.id}/sheathe`}
                hx-swap="none"
              >
                <i class="bi bi-hand-thumbs-down"></i> Sheathe
              </button>
            )}
            {item.chargeLabel && (
              <button
                type="button"
                class="btn btn-sm btn-outline-info"
                hx-get={`/characters/${characterId}/items/${item.id}/charges`}
                hx-target="#editModalContent"
                hx-swap="innerHTML"
                data-bs-toggle="modal"
                data-bs-target="#editModal"
              >
                <i class="bi bi-lightning-charge"></i>{" "}
                {item.chargeLabel === "ammunition" ? "Ammo" : "Charges"}
                <span class="badge bg-info ms-1">{item.currentCharges}</span>
              </button>
            )}
          </div>

          {/* Row 2: Management buttons */}
          <div class="d-flex gap-2 justify-content-start justify-content-md-end flex-wrap">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              hx-get={`/characters/${characterId}/items/${item.id}/edit`}
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
              hx-get={`/characters/${characterId}/items/${item.id}/effects`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#editModal"
            >
              <i class="bi bi-stars"></i> Effects
              {item.effects.length > 0 &&
                (() => {
                  const activeCount = item.effects.filter((e) => e.isActive).length
                  if (activeCount > 0) {
                    return (
                      <span class="badge bg-success ms-1">
                        {activeCount}/{item.effects.length}
                      </span>
                    )
                  }
                  return <span class="badge bg-secondary ms-1">{item.effects.length}</span>
                })()}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              hx-post={`/characters/${characterId}/items/${item.id}/drop`}
              hx-swap="none"
              hx-confirm={`Are you sure you want to drop ${item.name}?`}
            >
              <i class="bi bi-trash"></i> Drop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const InventoryPanel = ({ character, swapOob }: InventoryPanelProps) => {
  const coins = character.coins || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }

  return (
    <div class="accordion-body" id="inventory-panel" {...(swapOob && { "hx-swap-oob": "true" })}>
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
        <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2 mb-2">
          <h5 class="mb-0">Items</h5>
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
              <InventoryItemRow item={item} characterId={character.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
