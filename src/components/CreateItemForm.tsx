import { ModalContent } from "@src/components/ui/ModalContent"
import { Select } from "@src/components/ui/Select"
import { ArmorTypes, DamageTypes, ItemCategories, WeaponMasteries } from "@src/lib/dnd"
import { getGroupedTemplates, getTemplateByName, type RulesetId } from "@src/lib/dnd/itemTemplates"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { clsx } from "clsx"

export interface CreateItemFormProps {
  character: ComputedCharacter
  values: Record<string, string>
  errors?: Record<string, string>
}

const DIE_VALUES = [4, 6, 8, 10, 12, 20, 100] as const

const MAX_DAMAGE_ROWS = 10

export const CreateItemForm = ({ character, values, errors }: CreateItemFormProps) => {
  // Load templates for the character's ruleset
  const rulesetId = character.ruleset as RulesetId
  const groupedTemplates = getGroupedTemplates(rulesetId)

  // Build template select options with grouped headers
  const templateOptions: Array<{ value: string; label: string; disabled?: boolean }> = [
  ]

  if (groupedTemplates.weapons.length > 0) {
    templateOptions.push({ value: "weapons_header", label: "— Weapons —", disabled: true })
    for (const weapon of groupedTemplates.weapons) {
      templateOptions.push({ value: weapon.name, label: weapon.name })
    }
  }

  if (groupedTemplates.armor.length > 0) {
    templateOptions.push({ value: "armor_header", label: "— Armor —", disabled: true })
    for (const armor of groupedTemplates.armor) {
      templateOptions.push({ value: armor.name, label: armor.name })
    }
  }

  if (groupedTemplates.shields.length > 0) {
    templateOptions.push({ value: "shields_header", label: "— Shields —", disabled: true })
    for (const shield of groupedTemplates.shields) {
      templateOptions.push({ value: shield.name, label: shield.name })
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

  // populate values from template if it's changed
  const template = getTemplateByName(rulesetId, values.template || "")
  if (values.template && values.template !== values.prev_template && template) {
    values.prev_template = values.template

    values.name = template.name
    values.category = template.category
    values.description = ""

    // Weapon-specific fields
    if (template.weapon_type) values.weapon_type = template.weapon_type
    if (template.normal_range) values.normal_range = String(template.normal_range)
    if (template.long_range) values.long_range = String(template.long_range)
    if (template.starting_ammo !== undefined)
      values.starting_ammo = String(template.starting_ammo)
    if (template.mastery) values.mastery = template.mastery
    if (template.finesse) values.finesse = "true"
    if (template.martial !== undefined) values.martial = template.martial ? "true" : "false"

    // Damage arrays
    if (template.damage) {
      values.damage_row_count = String(template.damage.length)
      for (let i = 0; i < template.damage.length; i++) {
        const dmg = template.damage[i]
        if (dmg) {
          values[`damage_num_dice_${i}`] = String(dmg.num_dice)
          values[`damage_die_value_${i}`] = String(dmg.die_value)
          values[`damage_type_${i}`] = dmg.type
        }
      }
    }

    // Armor-specific fields
    if (template.armor_type) values.armor_type = template.armor_type
    if (template.armor_class !== undefined) values.armor_class = String(template.armor_class)
    if (template.armor_class_dex !== undefined)
      values.armor_class_dex = template.armor_class_dex ? "true" : "false"
    if (template.armor_class_dex_max !== undefined)
      values.armor_class_dex_max = String(template.armor_class_dex_max)

    // Shield-specific fields
    if (template.armor_modifier !== undefined)
      values.armor_modifier = String(template.armor_modifier)
  }

  if (values.category === "weapon" && !values.weapon_type) {
    values.weapon_type = "melee"
  }
  const damageRowCount = Math.min(
    Number.parseInt(values.damage_row_count || "1", 10),
    MAX_DAMAGE_ROWS
  )

  return (
    <ModalContent title="Add Item to Inventory">
      <form
        id="create-item-form"
        hx-post={`/characters/${character.id}/edit/newitem`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="change"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="modal-body needs-validation"
      >
        {/* General error message */}
        {errors?.general && (
          <div class="alert alert-danger" role="alert">
            {errors.general}
          </div>
        )}

        {/* Template Selection */}
        <input type="hidden" name="prev_template" value={values.prev_template} />

        <div class="mb-3">
          <label for="item-template" class="form-label">
            Template
          </label>
          <Select
            id="item-template"
            name="template"
            placeholder="Create from scratch"
            options={templateOptions}
            value={values.template || ""}
          />
          <div class="form-text">Select a common item to auto-fill the form</div>
        </div>

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

        {/* Category */}
        <div class="mb-3">
          <label for="item-category" class="form-label">
            Category <span class="text-danger">*</span>
          </label>
          <Select
            id="item-category"
            name="category"
            placeholder="Select category..."
            options={ItemCategories.map((cat) => ({
              value: cat,
              label: cat.charAt(0).toUpperCase() + cat.slice(1),
            }))}
            value={values.category}
            error={errors?.category}
          />
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
        <div id="armor-fields" class={clsx({ "d-none": values.category !== "armor" })}>
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
        <div id="shield-fields" class={clsx({ "d-none": values.category !== "shield" })}>
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
        <div id="weapon-fields" class={clsx({ "d-none": values.category !== "weapon" })}>
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
                  checked={values.weapon_type === "melee"}
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
                  checked={values.weapon_type === "ranged"}
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
                  checked={values.weapon_type === "thrown"}
                />
                <label class="form-check-label" for="weapon-type-thrown">
                  Thrown
                </label>
              </div>
            </div>
          </fieldset>

          {/* Range fields - shown for ranged and thrown */}
          {(values.weapon_type === "ranged" || values.weapon_type === "thrown") && (
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

          {/* Starting ammo - only for ranged */}
          {values.weapon_type === "ranged" && (
            <div class="mb-3">
              <label for="starting-ammo" class="form-label">
                Starting Ammunition
              </label>
              <input
                type="number"
                class={clsx("form-control", { "is-invalid": errors?.starting_ammo })}
                id="starting-ammo"
                name="starting_ammo"
                min="0"
                value={values.starting_ammo || "0"}
              />
              {errors?.starting_ammo && (
                <div class="invalid-feedback d-block">{errors.starting_ammo}</div>
              )}
              <div class="form-text">Number of arrows, bolts, etc. you start with</div>
            </div>
          )}

          {/* Damage Rows */}
          <div class="mb-3">
            <label class="form-label" for="damage_row_count">
              Damage
            </label>
            <input
              type="hidden"
              name="damage_row_count"
              id="damage_row_count"
              value={damageRowCount}
            />

            {Array.from({ length: damageRowCount }, (_, i) => {
              const numDiceError = errors?.[`damage_num_dice_${i}`]
              const dieValueError = errors?.[`damage_die_value_${i}`]
              const damageTypeError = errors?.[`damage_type_${i}`]

              return (
                <div class="row mb-2">
                  <div class="col-3">
                    <input
                      type="number"
                      class={clsx("form-control form-control-sm", { "is-invalid": numDiceError })}
                      name={`damage_num_dice_${i}`}
                      placeholder="# dice"
                      min="1"
                      value={values[`damage_num_dice_${i}`] || "1"}
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
                      name={`damage_die_value_${i}`}
                      placeholder="Die"
                      options={dieValueOptions}
                      value={values[`damage_die_value_${i}`]}
                      error={dieValueError}
                      hideErrorMsg={true}
                    />
                  </div>
                  <div class="col-5">
                    <Select
                      class="form-select-sm"
                      name={`damage_type_${i}`}
                      placeholder="Type"
                      options={damageTypeOptions}
                      value={values[`damage_type_${i}`]}
                      error={damageTypeError}
                      hideErrorMsg={true}
                    />
                  </div>
                </div>
              )
            })}

            {/* Plus/Minus buttons */}
            <div class="d-flex gap-2 mt-2">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                onclick={`document.getElementById('damage_row_count').value = ${damageRowCount + 1}; document.getElementById('create-item-form').dispatchEvent(new Event('change'));`}
                disabled={damageRowCount >= MAX_DAMAGE_ROWS}
              >
                <i class="bi bi-plus"></i> Add Damage
              </button>
              {damageRowCount > 1 && (
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  onclick={`document.getElementById('damage_row_count').value = ${damageRowCount - 1}; document.getElementById('create-item-form').dispatchEvent(new Event('change'));`}
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

        {/* Note */}
        <div class="mb-3">
          <label for="item-note" class="form-label">
            Note
          </label>
          <textarea
            class={clsx("form-control", { "is-invalid": errors?.note })}
            id="item-note"
            name="note"
            rows={2}
            value={values.note || ""}
            placeholder="Where or how you acquired this item"
          />
          {errors?.note && <div class="invalid-feedback d-block">{errors.note}</div>}
        </div>

        {/* Helper text */}
        <div class="alert alert-info">
          <small>
            <i class="bi bi-info-circle"></i> Item effects can be configured after item creation.
          </small>
        </div>

        {/* Submit Button */}
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/edit/newitem`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            Add Item
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
