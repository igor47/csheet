import { Select } from "@src/components/ui/Select"
import {
  Abilities,
  ClassNames,
  type ProficiencyLevel,
  ProficiencyLevels,
  SkillAbilities,
  Skills,
} from "@src/lib/dnd"
import { getRuleset, RULESETS, type RulesetId } from "@src/lib/dnd/rulesets"
import { toTitleCase } from "@src/lib/strings"
import clsx from "clsx"

export interface CharacterImportProps {
  values?: Record<string, string>
  errors?: Record<string, string>
}

// Helper to calculate ability modifier
const getAbilityModifier = (score: number): string => {
  const modifier = Math.floor((score - 10) / 2)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

// MultiClassSelector component for selecting multiple classes with levels
interface MultiClassSelectorProps {
  values?: Record<string, string>
  errors?: Record<string, string>
}

const MultiClassSelector = ({ values = {}, errors = {} }: MultiClassSelectorProps) => {
  // Get ruleset based on selection
  const rulesetId = (values?.ruleset as RulesetId) || RULESETS[0]!.id
  const ruleset = getRuleset(rulesetId)

  // Parse selected classes from values (classes_CLASS format for checkboxes, levels_CLASS for dropdowns)
  const selectedClasses = ClassNames.filter((cls) => values[`classes_${cls}`] === "on")
  const totalLevels = selectedClasses.reduce((sum, cls) => {
    const level = Number.parseInt(values[`levels_${cls}`] as string, 10) || 1
    return sum + level
  }, 0)

  const levelOptions = Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => ({
    value: lvl.toString(),
    label: lvl.toString(),
  }))

  return (
    <div class="mb-3">
      <div class="form-label fw-bold">Classes & Levels</div>
      <div class="alert alert-info mb-2">
        <i class="bi bi-info-circle me-2" />
        Select the classes your character has levels in. Total character level:{" "}
        <strong>{totalLevels}</strong>
        /20
      </div>

      <div class="row">
        {ClassNames.map((cls) => {
          const isSelected = values[`classes_${cls}`] === "on"
          const level = Number.parseInt(values[`levels_${cls}`] || "1", 10)
          const classDef = ruleset.classes[cls]
          const needsSubclass = isSelected && classDef && level >= classDef.subclassLevel
          const subclassOptions =
            classDef?.subclasses.map((sc) => ({
              value: sc.name,
              label: toTitleCase(sc.name),
            })) || []

          return (
            <div class="col-md-6 mb-3">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id={`charimport-classes-${cls}`}
                    name={`classes_${cls}`}
                    checked={isSelected}
                  />
                  <label class="form-check-label" for={`charimport-classes-${cls}`}>
                    {toTitleCase(cls)}
                  </label>
                </div>
                {isSelected && (
                  <Select
                    name={`levels_${cls}`}
                    id={`charimport-levels-${cls}`}
                    style="max-width: 10em;"
                    options={levelOptions}
                    value={level.toString()}
                    required
                    error={errors?.[`levels_${cls}`]}
                  />
                )}
              </div>
              {needsSubclass && (
                <div class="ms-4">
                  <Select
                    name={`subclass_${cls}`}
                    id={`charimport-subclass-${cls}`}
                    options={subclassOptions}
                    placeholder={`Select ${toTitleCase(cls)} subclass`}
                    value={values[`subclass_${cls}`] as string}
                    required
                    error={errors?.[`subclass_${cls}`]}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {errors?.classes && <div class="text-danger small mt-2">{errors.classes}</div>}
      {totalLevels > 20 && <div class="text-danger small mt-2">Total level cannot exceed 20</div>}
    </div>
  )
}

// AbilityScoreInputs component for directly entering ability scores
interface AbilityScoreInputsProps {
  values?: Record<string, string>
  errors?: Record<string, string>
}

const AbilityScoreInputs = ({ values = {}, errors = {} }: AbilityScoreInputsProps) => {
  return (
    <div class="mb-3">
      <div class="form-label fw-bold">Ability Scores</div>
      <div class="alert alert-info mb-2">
        <i class="bi bi-info-circle me-2" />
        Enter your character's final ability scores (including all bonuses from species, class,
        items, etc.) and check which saving throws you're proficient in.
      </div>

      <div class="row">
        {Abilities.map((ability) => {
          const score = Number.parseInt((values[`ability_${ability}`] as string) || "10", 10)
          const modifier = getAbilityModifier(score)
          const hasError = errors?.[`ability_${ability}`]
          const isProficient = values[`save_${ability}`] === "on"

          return (
            <div class="col-md-4 mb-3">
              <label for={`charimport-ability-${ability}`} class="form-label">
                {toTitleCase(ability)}
              </label>
              <div class="input-group">
                <input
                  type="number"
                  class={clsx("form-control", { "is-invalid": hasError })}
                  id={`charimport-ability-${ability}`}
                  name={`ability_${ability}`}
                  value={score}
                  min="3"
                  max="20"
                  required
                />
                <span class="input-group-text">{modifier}</span>
              </div>
              <div class="form-check mt-1">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id={`charimport-save-${ability}`}
                  name={`save_${ability}`}
                  checked={isProficient}
                />
                <label class="form-check-label small" for={`charimport-save-${ability}`}>
                  Saving throw proficiency
                </label>
              </div>
              {hasError && <div class="invalid-feedback d-block">{hasError}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// MaxHPInput component for entering maximum hit points
interface MaxHPInputProps {
  values?: Record<string, string>
  errors?: Record<string, string>
}

const MaxHPInput = ({ values = {}, errors = {} }: MaxHPInputProps) => {
  const maxHp = Number.parseInt((values.max_hp as string) || "0", 10)

  return (
    <div class="mb-3">
      <label for="charimport-max-hp" class="form-label">
        Maximum Hit Points
      </label>
      <input
        type="number"
        class={clsx("form-control", { "is-invalid": errors?.max_hp })}
        id="charimport-max-hp"
        name="max_hp"
        value={maxHp || ""}
        min="1"
        required
        placeholder="Enter max HP"
      />
      {errors?.max_hp && <div class="invalid-feedback d-block">{errors.max_hp}</div>}
      <div class="form-text">
        Your character's maximum hit points (we'll distribute this across your levels)
      </div>
    </div>
  )
}

// SkillProficiencySelector component for selecting skill proficiencies with levels
interface SkillProficiencySelectorProps {
  values?: Record<string, string>
  errors?: Record<string, string>
}

const SkillProficiencySelector = ({ values = {}, errors = {} }: SkillProficiencySelectorProps) => {
  const getProficiencyIcon = (prof: ProficiencyLevel): string => {
    switch (prof) {
      case "none":
        return "bi-circle"
      case "half":
        return "bi-circle-half"
      case "proficient":
        return "bi-circle-fill"
      case "expert":
        return "bi-brightness-high-fill"
    }
  }

  return (
    <div class="mb-3">
      <div class="form-label fw-bold">Skill Proficiencies</div>
      <div class="alert alert-info mb-2">
        <i class="bi bi-info-circle me-2" />
        Select the proficiency level for each skill. None, Half (Jack of All Trades), Proficient, or
        Expert (double proficiency).
      </div>

      {/* Header Row */}
      <div class="row fw-bold text-muted mb-2 px-1 px-md-3" style="font-size: 0.85rem;">
        <div class="col-6">Skill</div>
        <div class="col-6 p-0">Proficiency</div>
      </div>

      {/* Skill Rows */}
      {Skills.map((skill) => {
        const ability = SkillAbilities[skill]
        const sanitizedSkill = skill.replace(/\s+/g, "_")
        const proficiencyFieldName = `${sanitizedSkill}_proficiency`
        const currentProficiency = (values[proficiencyFieldName] as ProficiencyLevel) || "none"

        return (
          <div class="row align-items-center border rounded py-2 px-1 px-md-3 mb-2">
            {/* Skill Column */}
            <div class="col-6">
              <div class="d-flex align-items-center gap-2">
                <span
                  class="badge bg-secondary text-uppercase d-none d-md-inline"
                  style="width: 40px; font-size: 0.7rem;"
                >
                  {ability.substring(0, 3).toUpperCase()}
                </span>
                <span class="text-capitalize fw-medium">{toTitleCase(skill)}</span>
              </div>
            </div>

            {/* Proficiency Column */}
            <div class="col-6 p-0">
              <fieldset class="btn-group btn-group-sm">
                {ProficiencyLevels.map((level) => (
                  <>
                    <input
                      type="radio"
                      class="btn-check"
                      name={proficiencyFieldName}
                      id={`charimport-${proficiencyFieldName}-${level}`}
                      value={level}
                      checked={currentProficiency === level}
                      autocomplete="off"
                    />
                    <label
                      class={clsx("btn", {
                        "btn-outline-secondary": level === "none" || level === "half",
                        "btn-outline-primary": level === "proficient",
                        "btn-outline-success": level === "expert",
                      })}
                      for={`charimport-${proficiencyFieldName}-${level}`}
                      style="font-size: 0.7rem;"
                      title={level}
                    >
                      <i class={clsx("bi", getProficiencyIcon(level))}></i>
                    </label>
                  </>
                ))}
              </fieldset>
              {errors?.[proficiencyFieldName] && (
                <div class="invalid-feedback d-block mt-1" style="font-size: 0.75rem;">
                  {errors[proficiencyFieldName]}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const CharacterImport = ({ values = {}, errors = {} }: CharacterImportProps) => {
  // Get ruleset based on selection, default to first ruleset
  const rulesetId = (values?.ruleset as RulesetId) || RULESETS[0]!.id
  const ruleset = getRuleset(rulesetId)
  const speciesNames = ruleset.species.map((s) => s.name)
  const backgroundNames = Object.keys(ruleset.backgrounds)

  // Check if "Other" background is selected
  const isCustomBackground = values?.background === "_custom"

  // Get selected species to show lineage options
  const selectedSpecies = values?.species
    ? ruleset.species.find((s) => s.name === values.species)
    : null
  const lineages = selectedSpecies?.lineages || []
  const lineagePlh =
    lineages.length > 0
      ? "Select a lineage"
      : selectedSpecies
        ? "No lineages available"
        : "Select a species first"

  return (
    <div class="container" id="character-import" style="overflow-anchor: none;">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow-sm">
            <div class="card-body">
              <h1 class="card-title mb-4">Import Existing Character</h1>

              <p class="text-muted mb-3">
                Use this form to quickly add an existing character to CSheet. If you want to create
                a brand new level 1 character, you're encouraged to use the{" "}
                <a href="/characters/new">character creation wizard</a> instead.
              </p>

              <div class="alert alert-warning mb-4">
                <i class="bi bi-exclamation-triangle me-2" />
                <strong>Note:</strong> You can configure spells and inventory after importing your
                character.
              </div>

              <form
                hx-post="/characters/import"
                hx-vals='{"is_check": "true"}'
                hx-trigger="change"
                hx-target="#character-import"
                hx-swap="morph:outerHTML focus-scroll:false"
                class="needs-validation"
                novalidate
              >
                {/* Ruleset */}
                <div class="mb-3">
                  <label for="charimport-ruleset" class="form-label">
                    Ruleset
                  </label>
                  <Select
                    name="ruleset"
                    id="charimport-ruleset"
                    options={RULESETS.map((r) => ({ value: r.id, label: r.description }))}
                    placeholder="Select a ruleset"
                    required
                    error={errors?.ruleset}
                    value={(values?.ruleset as string) || RULESETS[0]!.id}
                  />
                  <div class="form-text">
                    Choose the version of D&D 5e rules to use for this character
                  </div>
                </div>

                {/* Character Name */}
                <div class="mb-3">
                  <label for="charimport-name" class="form-label">
                    Character Name
                  </label>
                  <input
                    type="text"
                    class={clsx("form-control", { "is-invalid": errors?.name })}
                    id="charimport-name"
                    name="name"
                    value={values?.name || ""}
                    required
                    placeholder="Enter character name"
                  />
                  {errors?.name && <div class="invalid-feedback d-block">{errors.name}</div>}
                </div>

                {/* Species */}
                <div class="mb-3">
                  <label for="charimport-species" class="form-label">
                    Species
                  </label>
                  <Select
                    name="species"
                    id="charimport-species"
                    options={speciesNames.map((species) => ({
                      value: species,
                      label: toTitleCase(species),
                    }))}
                    placeholder="Select a species"
                    required
                    error={errors?.species}
                    value={values?.species as string}
                  />
                </div>

                {/* Lineage */}
                <div class="mb-3">
                  <label for="charimport-lineage" class="form-label">
                    Lineage
                  </label>
                  <Select
                    name="lineage"
                    id="charimport-lineage"
                    options={lineages.map((lineage) => ({
                      value: lineage.name,
                      label: toTitleCase(lineage.name),
                    }))}
                    placeholder={lineagePlh}
                    error={errors?.lineage}
                    value={values?.lineage as string}
                    disabled={lineages.length === 0}
                  />
                </div>

                {/* Background */}
                <div class="mb-3">
                  <label for="charimport-background" class="form-label">
                    Background
                  </label>
                  <Select
                    name="background"
                    id="charimport-background"
                    options={[
                      ...backgroundNames.map((bg) => ({ value: bg, label: toTitleCase(bg) })),
                      { value: "_custom", label: "Other (Custom)" },
                    ]}
                    placeholder="Select a background"
                    required
                    error={errors?.background}
                    value={values?.background as string}
                  />
                  {isCustomBackground && (
                    <input
                      type="text"
                      class={clsx("form-control mt-2", { "is-invalid": errors?.custom_background })}
                      id="charimport-custom-background"
                      name="custom_background"
                      value={(values?.custom_background as string) || ""}
                      placeholder="Enter custom background name"
                      required
                    />
                  )}
                  {isCustomBackground && errors?.custom_background && (
                    <div class="invalid-feedback d-block">{errors.custom_background}</div>
                  )}
                  {isCustomBackground && (
                    <div class="form-text">
                      You can add custom background traits after creating your character
                    </div>
                  )}
                </div>

                {/* Multi-class selector */}
                <MultiClassSelector values={values} errors={errors} />

                {/* Ability scores */}
                <AbilityScoreInputs values={values} errors={errors} />

                {/* Maximum HP */}
                <MaxHPInput values={values} errors={errors} />

                {/* Skill proficiencies */}
                <SkillProficiencySelector values={values} errors={errors} />

                {/* Alignment */}
                <div class="mb-3">
                  <label for="charimport-alignment" class="form-label">
                    Alignment (Optional)
                  </label>
                  <Select
                    name="alignment"
                    id="charimport-alignment"
                    options={[
                      { value: "Lawful Good", label: "Lawful Good" },
                      { value: "Neutral Good", label: "Neutral Good" },
                      { value: "Chaotic Good", label: "Chaotic Good" },
                      { value: "Lawful Neutral", label: "Lawful Neutral" },
                      { value: "True Neutral", label: "True Neutral" },
                      { value: "Chaotic Neutral", label: "Chaotic Neutral" },
                      { value: "Lawful Evil", label: "Lawful Evil" },
                      { value: "Neutral Evil", label: "Neutral Evil" },
                      { value: "Chaotic Evil", label: "Chaotic Evil" },
                    ]}
                    placeholder="Select alignment"
                    error={errors?.alignment}
                    value={values?.alignment as string}
                  />
                </div>

                <div class="d-flex gap-2">
                  <button
                    type="submit"
                    id="character-import-submit"
                    hx-post="/characters/import"
                    hx-vals='{"is_check": "false"}'
                    class="btn btn-primary"
                  >
                    Import Character
                  </button>
                  <a href="/characters" class="btn btn-secondary">
                    Cancel
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
