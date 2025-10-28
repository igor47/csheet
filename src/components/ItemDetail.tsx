import { ModalContent } from "@src/components/ui/ModalContent"
import type { EquippedComputedItem } from "@src/services/computeCharacterItems"

export interface ItemDetailProps {
  item: EquippedComputedItem
}

export const ItemDetail = ({ item }: ItemDetailProps) => {
  return (
    <ModalContent title={item.name}>
      <div class="modal-body">
        {/* Category and Status */}
        <div class="mb-3">
          <span class="badge bg-secondary me-2">{item.category}</span>
          {item.worn && <span class="badge bg-info me-2">Worn</span>}
          {item.wielded && <span class="badge bg-warning me-2">Wielded</span>}
        </div>

        {/* Description */}
        {item.description && (
          <div class="mb-3">
            <h6 class="text-muted">Description</h6>
            <p>{item.description}</p>
          </div>
        )}

        {/* Weapon Properties */}
        {item.category === "weapon" && (
          <div class="mb-3">
            <h6 class="text-muted">Weapon Properties</h6>

            {/* Damage */}
            {item.damage && item.damage.length > 0 && (
              <div class="mb-2">
                <strong>Damage:</strong>
                <ul class="list-unstyled ms-3 mb-0">
                  {item.damage.map((dmg) => (
                    <li>
                      {dmg.dice.length}d{dmg.dice[0]} {dmg.type}
                      {dmg.versatile && <span class="badge bg-secondary ms-2">Versatile</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Range */}
            {item.normal_range && (
              <div class="mb-2">
                <strong>Range:</strong> {item.normal_range} ft
                {item.long_range && ` / ${item.long_range} ft`}
              </div>
            )}

            {/* Properties */}
            <div class="mb-2">
              <strong>Properties:</strong>
              <div class="d-flex flex-wrap gap-1 mt-1">
                {item.finesse && <span class="badge bg-secondary">Finesse</span>}
                {item.martial && <span class="badge bg-secondary">Martial</span>}
                {item.thrown && <span class="badge bg-secondary">Thrown</span>}
                {item.mastery && <span class="badge bg-secondary">Mastery: {item.mastery}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Armor Properties */}
        {item.category === "armor" && (
          <div class="mb-3">
            <h6 class="text-muted">Armor Properties</h6>
            <div class="mb-2">
              <strong>Type:</strong> {item.armor_type}
            </div>
            <div class="mb-2">
              <strong>Base AC:</strong> {item.armor_class}
              {item.armor_class_dex && (
                <>
                  {" + Dex modifier"}
                  {item.armor_class_dex_max !== null && ` (max ${item.armor_class_dex_max})`}
                </>
              )}
            </div>
          </div>
        )}

        {/* Shield Properties */}
        {item.category === "shield" && item.armor_modifier !== null && (
          <div class="mb-3">
            <h6 class="text-muted">Shield Properties</h6>
            <div class="mb-2">
              <strong>AC Bonus:</strong> +{item.armor_modifier}
            </div>
          </div>
        )}

        {/* Effects */}
        {item.effects && item.effects.length > 0 && (
          <div class="mb-3">
            <h6 class="text-muted">Effects</h6>
            <ul class="list-unstyled ms-3 mb-0">
              {item.effects.map((effect) => (
                <li class={effect.isActive ? "" : "text-muted"}>
                  <strong>{effect.op}</strong> to <em>{effect.target}</em>
                  {effect.value !== null && `: ${effect.value}`}
                  {effect.applies && <span class="text-muted"> (when {effect.applies})</span>}
                  {!effect.isActive && <span class="badge bg-secondary ms-2">Inactive</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Charges/Ammunition */}
        {item.chargeLabel && (
          <div class="mb-3">
            <h6 class="text-muted">
              {item.chargeLabel === "ammunition" ? "Ammunition" : "Charges"}
            </h6>
            <div>
              <strong>Current:</strong> {item.currentCharges}
            </div>
          </div>
        )}
      </div>
    </ModalContent>
  )
}
