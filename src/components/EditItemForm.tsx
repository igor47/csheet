import { ModalContent } from "@src/components/ui/ModalContent"
import { Select } from "@src/components/ui/Select"
import type { ItemDamage } from "@src/db/item_damage"
import type { Item } from "@src/db/items"
import { ArmorTypes, DamageTypes, WeaponMasteries } from "@src/lib/dnd"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { clsx } from "clsx"

export interface EditItemFormProps {
  character: ComputedCharacter
  item: Item
  damages: ItemDamage[]
  values?: Record<string, string>
  errors?: Record<string, string>
}

const DIE_VALUES = [4, 6, 8, 10, 12, 20, 100] as const

function buildFormValues(item: Item, damages: ItemDamage[]): Record<string, string> {
  const values: Record<string, string> = {
    name: item.name,
    description: item.description || "",
    category: item.category,
  }

  if (item.category === "armor") {
    values.armor_type = item.armor_type || ""
    values.armor_class = String(item.armor_class || "")
    values.armor_class_dex = item.armor_class_dex ? "true" : "false"
    if (item.armor_class_dex_max !== null) {
      values.armor_class_dex_max = String(item.armor_class_dex_max)
    }
  }

  if (item.category === "shield") {
    values.armor_modifier = String(item.armor_modifier || "")
  }

  if (item.category === "weapon") {
    // Determine weapon type from item properties
    values.weapon_type = item.thrown ? "thrown" : item.normal_range ? "ranged" : "melee"
    values.finesse = item.finesse ? "true" : "false"
    values.mastery = item.mastery || ""
    values.martial = item.martial ? "true" : "false"

    if (item.normal_range !== null) {
      values.normal_range = String(item.normal_range)
    }
    if (item.long_range !== null) {
      values.long_range = String(item.long_range)
    }

    // Populate damage rows - structure as nested object for parseBody({ dot: true })
    values.damage_row_count = String(damages.length || 1)
    if (damages.length > 0) {
      const damageObj: Record<string, Record<string, string>> = {}
      for (let i = 0; i < damages.length; i++) {
        const damage = damages[i]
        if (!damage) continue

        // damage.dice is an array like [6, 6] meaning 2d6
        const numDice = damage.dice.length
        const dieValue = damage.dice[0] // All dice in the array should be the same value
        damageObj[String(i)] = {
          num_dice: String(numDice),
          die_value: String(dieValue),
          type: damage.type,
          versatile: damage.versatile ? "true" : "false",
        }
      }
      // Store as a nested object (will be read by our parsing logic)
      // biome-ignore lint/suspicious/noExplicitAny: values is Record<string, string> but damage needs nested structure
      ;(values as any).damage = damageObj
    }
  }

  return values
}

export const EditItemForm = ({
  character,
  item,
  damages,
  values: valuesProp,
  errors,
}: EditItemFormProps) => {
  // Build form values from item only on initial load (when values is undefined)
  // Otherwise use the provided values (from user input during validation)
  const values = valuesProp !== undefined ? valuesProp : buildFormValues(item, damages)

  const selectedCategory = values.category || ""
  const selectedWeaponType = values.weapon_type || "melee"
  const damageRowCount = Number.parseInt(values.damage_row_count || "1", 10)

  // Parse damage entries from values (object array field parsed from dot notation)
  const damageEntries: Array<{
    num_dice: string
    die_value: string
    type: string
    versatile: boolean
  }> = []
  if (values.damage && typeof values.damage === "object") {
    for (const d of Object.values(values.damage) as Record<string, string>[]) {
      damageEntries.push({
        num_dice: String(d.num_dice || "1"),
        die_value: String(d.die_value || ""),
        type: String(d.type || ""),
        versatile: d.versatile === "true",
      })
    }
  }

  // Adjust array size to match damageRowCount
  if (damageEntries.length > damageRowCount) {
    // Trim excess entries
    damageEntries.length = damageRowCount
  } else {
    // Add empty rows until we have damageRowCount entries
    while (damageEntries.length < damageRowCount) {
      damageEntries.push({
        num_dice: "1",
        die_value: "",
        type: "",
        versatile: false,
      })
    }
  }

  // Pre-compute option arrays for selects
  const armorTypeOptions = ArmorTypes.map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }))

  const dieValueOptions = DIE_VALUES.map((die) => ({
    value: String(die),
    label: String(die),
  }))

  const damageTypeOptions = DamageTypes.map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }))

  const weaponMasteryOptions = WeaponMasteries.map((mastery) => ({
    value: mastery,
    label: mastery.charAt(0).toUpperCase() + mastery.slice(1),
  }))

  return (
    <ModalContent title="Edit Item">
      <form
        id="edititem-form"
        hx-post={`/characters/${character.id}/items/${item.id}/edit`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="change"
        hx-target="#editModalContent"
        hx-swap="morph:innerHTML"
        class="modal-body needs-validation"
      >
        {/* General error message */}
        {errors?.general && (
          <div class="alert alert-danger" role="alert">
            {errors.general}
          </div>
        )}

        {/* Item Name */}
        <div class="mb-3">
          <label for="item-name" class="form-label">
            Item Name <span class="text-danger">*</span>
          </label>
          <input
            type="text"
            class={clsx("form-control", { "is-invalid": errors?.name })}
            id="item-name"
            name="name"
            value={values.name || ""}
          />
          {errors?.name && <div class="invalid-feedback d-block">{errors.name}</div>}
        </div>

        {/* Category (read-only) */}
        <div class="mb-3">
          <label for="item-category" class="form-label">
            Category
          </label>
          <input
            type="text"
            class={clsx("form-control", { "is-invalid": errors?.category })}
            id="item-category"
            value={selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            disabled
          />
          <input type="hidden" name="category" value={selectedCategory} />
          <div class="form-text">Category cannot be changed</div>
          {errors?.category && <div class="invalid-feedback d-block">{errors.category}</div>}
        </div>

        {/* Description */}
        <div class="mb-3">
          <label for="item-description" class="form-label">
            Description
          </label>
          <textarea
            class={clsx("form-control", { "is-invalid": errors?.description })}
            id="item-description"
            name="description"
            rows={3}
            placeholder="Visual description, any special properties, etc..."
          >
            {values.description || ""}
          </textarea>
          {errors?.description && <div class="invalid-feedback d-block">{errors.description}</div>}
        </div>

        {/* Armor-specific fields */}
        <div id="armor-fields" class={clsx({ "d-none": selectedCategory !== "armor" })}>
          <h6 class="text-muted mb-3">Armor Properties</h6>

          <div class="mb-3">
            <label for="armor-type" class="form-label">
              Armor Type
            </label>
            <Select
              id="armor-type"
              name="armor_type"
              placeholder="Select type..."
              options={armorTypeOptions}
              value={values.armor_type}
              error={errors?.armor_type}
            />
            <div class="form-text">Light, medium, or heavy armor classification</div>
          </div>

          <div class="mb-3">
            <label for="armor-class" class="form-label">
              Armor Base AC
            </label>
            <input
              type="number"
              class={clsx("form-control", { "is-invalid": errors?.armor_class })}
              id="armor-class"
              name="armor_class"
              min="0"
              value={values.armor_class || ""}
            />
            {errors?.armor_class && (
              <div class="invalid-feedback d-block">{errors.armor_class}</div>
            )}
          </div>

          <div class="form-check mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="armor-class-dex"
              name="armor_class_dex"
              value="true"
              checked={values.armor_class_dex === "true"}
            />
            <label class="form-check-label" for="armor-class-dex">
              Add Dexterity modifier to armor AC?
            </label>
          </div>

          {values.armor_class_dex === "true" && (
            <div class="mb-3">
              <label for="armor-class-dex-max" class="form-label">
                Max Dexterity Bonus
              </label>
              <input
                type="number"
                class={clsx("form-control", { "is-invalid": errors?.armor_class_dex_max })}
                id="armor-class-dex-max"
                name="armor_class_dex_max"
                min="0"
                value={values.armor_class_dex_max || ""}
                placeholder="Unlimited"
              />
              {errors?.armor_class_dex_max && (
                <div class="invalid-feedback d-block">{errors.armor_class_dex_max}</div>
              )}
            </div>
          )}
        </div>

        {/* Shield-specific fields */}
        <div id="shield-fields" class={clsx({ "d-none": selectedCategory !== "shield" })}>
          <h6 class="text-muted mb-3">Shield Properties</h6>

          <div class="mb-3">
            <label for="armor-modifier" class="form-label">
              AC Bonus
            </label>
            <input
              type="number"
              class={clsx("form-control", { "is-invalid": errors?.armor_modifier })}
              id="armor-modifier"
              name="armor_modifier"
              value={values.armor_modifier || ""}
            />
            {errors?.armor_modifier && (
              <div class="invalid-feedback d-block">{errors.armor_modifier}</div>
            )}
          </div>
        </div>

        {/* Weapon-specific fields */}
        <div id="weapon-fields" class={clsx({ "d-none": selectedCategory !== "weapon" })}>
          <h6 class="text-muted mb-3">Weapon Properties</h6>

          {/* Weapon Type Radio */}
          <fieldset class="mb-3">
            <legend class="form-label">Weapon Type</legend>
            <div class="d-flex gap-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="weapon_type"
                  id="weapon-type-melee"
                  value="melee"
                  checked={selectedWeaponType === "melee"}
                />
                <label class="form-check-label" for="weapon-type-melee">
                  Melee
                </label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="weapon_type"
                  id="weapon-type-ranged"
                  value="ranged"
                  checked={selectedWeaponType === "ranged"}
                />
                <label class="form-check-label" for="weapon-type-ranged">
                  Ranged
                </label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="weapon_type"
                  id="weapon-type-thrown"
                  value="thrown"
                  checked={selectedWeaponType === "thrown"}
                />
                <label class="form-check-label" for="weapon-type-thrown">
                  Thrown
                </label>
              </div>
            </div>
          </fieldset>

          {/* Range fields - shown for ranged and thrown */}
          {(selectedWeaponType === "ranged" || selectedWeaponType === "thrown") && (
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="normal-range" class="form-label">
                  Normal Range (ft)
                </label>
                <input
                  type="number"
                  class={clsx("form-control", { "is-invalid": errors?.normal_range })}
                  id="normal-range"
                  name="normal_range"
                  min="1"
                  value={values.normal_range || ""}
                />
                {errors?.normal_range && (
                  <div class="invalid-feedback d-block">{errors.normal_range}</div>
                )}
              </div>

              <div class="col-md-6 mb-3">
                <label for="long-range" class="form-label">
                  Long Range (ft)
                </label>
                <input
                  type="number"
                  class={clsx("form-control", { "is-invalid": errors?.long_range })}
                  id="long-range"
                  name="long_range"
                  min="1"
                  value={values.long_range || ""}
                  placeholder="Optional"
                />
                {errors?.long_range && (
                  <div class="invalid-feedback d-block">{errors.long_range}</div>
                )}
              </div>
            </div>
          )}

          {/* Damage Rows */}
          <div class="mb-3">
            <label class="form-label" for="edititem-damage-row-count">
              Damage
            </label>
            <input
              type="hidden"
              name="damage_row_count"
              id="edititem-damage-row-count"
              value={damageRowCount}
            />

            {damageEntries.map((entry, i) => {
              const numDiceError = errors?.[`damage.${i}.num_dice`]
              const dieValueError = errors?.[`damage.${i}.die_value`]
              const damageTypeError = errors?.[`damage.${i}.type`]

              return (
                <div class="mb-3">
                  <div class="row mb-1">
                    <div class="col-3">
                      <input
                        type="number"
                        id={`edititem-damage-num-dice-${i}`}
                        class={clsx("form-control form-control-sm", { "is-invalid": numDiceError })}
                        name={`damage.${i}.num_dice`}
                        placeholder="# dice"
                        min="1"
                        value={entry.num_dice}
                      />
                      {numDiceError && (
                        <div class="invalid-feedback d-block small">{numDiceError}</div>
                      )}
                    </div>
                    <div class="col-1 d-flex align-items-top justify-content-center">
                      <span class="text-muted">d</span>
                    </div>
                    <div class="col-3">
                      <Select
                        class="form-select-sm"
                        name={`damage.${i}.die_value`}
                        id={`edititem-damage-die-${i}`}
                        placeholder="Die"
                        options={dieValueOptions}
                        value={entry.die_value}
                        error={dieValueError}
                        hideErrorMsg={true}
                      />
                    </div>
                    <div class="col-5">
                      <Select
                        class="form-select-sm"
                        name={`damage.${i}.type`}
                        id={`edititem-damage-type-${i}`}
                        placeholder="Type"
                        options={damageTypeOptions}
                        value={entry.type}
                        error={damageTypeError}
                        hideErrorMsg={true}
                      />
                    </div>
                  </div>
                  <div class="form-check ms-1">
                    <input
                      class="form-check-input form-check-input-sm"
                      type="checkbox"
                      id={`edititem-damage-versatile-${i}`}
                      name={`damage.${i}.versatile`}
                      value="true"
                      checked={entry.versatile}
                    />
                    <label class="form-check-label small" for={`edititem-damage-versatile-${i}`}>
                      Versatile
                    </label>
                  </div>
                </div>
              )
            })}

            {/* Plus/Minus buttons */}
            <div class="d-flex gap-2 mt-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                onclick={`document.getElementById('edititem-damage-row-count').value = ${damageRowCount + 1}; document.getElementById('edititem-form').dispatchEvent(new Event('change'));`}
              >
                <i class="bi bi-plus"></i> Add Damage
              </button>
              {damageRowCount > 1 && (
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  onclick={`document.getElementById('edititem-damage-row-count').value = ${damageRowCount - 1}; document.getElementById('edititem-form').dispatchEvent(new Event('change'));`}
                >
                  <i class="bi bi-dash"></i> Remove
                </button>
              )}
            </div>
            {errors?.damage && <div class="text-danger small mt-2">{errors.damage}</div>}
          </div>

          {/* Mastery - only for 2024 ruleset */}
          {character.ruleset === "srd52" && (
            <div class="mb-3">
              <label for="mastery" class="form-label">
                Weapon Mastery
              </label>
              <Select
                id="mastery"
                name="mastery"
                placeholder="None"
                options={weaponMasteryOptions}
                value={values.mastery}
                error={errors?.mastery}
              />
            </div>
          )}

          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="finesse"
              name="finesse"
              value="true"
              checked={values.finesse === "true"}
            />
            <label class="form-check-label" for="finesse">
              Finesse
            </label>
          </div>

          <div class="form-check mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              id="martial"
              name="martial"
              value="true"
              checked={values.martial === "true"}
            />
            <label class="form-check-label" for="martial">
              Martial Weapon
            </label>
          </div>
        </div>

        {/* Helper text */}
        <div class="alert alert-info">
          <small>
            <i class="bi bi-info-circle"></i>
            &nbsp; Use the Effects editor to manage effects.
            {selectedCategory === "weapon" && selectedWeaponType === "ranged" && (
              <span>&nbsp; Use the Charges editor to manage ammunition for this weapon.</span>
            )}
          </small>
        </div>

        {/* Submit Button */}
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            id="edititem-submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/items/${item.id}/edit`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="morph:innerHTML"
          >
            Update Item
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
