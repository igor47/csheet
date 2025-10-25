import type { ClassNameType } from "@src/lib/dnd"
import { Abilities, type AbilityType, POINT_BUY_COSTS, STANDARD_ARRAY_BY_CLASS } from "@src/lib/dnd"
import { toTitleCase } from "@src/lib/strings"
import clsx from "clsx"

// Standard array values
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

// Point buy constants
const POINT_BUY_TOTAL = 27
const POINT_BUY_MIN = 8
const POINT_BUY_MAX = 15

// Helper to determine if an ability is primary or secondary based on score
function getAbilityPriority(
  ability: AbilityType,
  scores: Record<AbilityType, number>
): "primary" | "secondary" | null {
  const sortedAbilities = Abilities.slice().sort((a, b) => scores[b] - scores[a])
  const index = sortedAbilities.indexOf(ability)

  if (index === 0) return "primary" // Highest score
  if (index === 1 || index === 2) return "secondary" // Next two highest
  return null // Dump stats
}

interface AbilityScoreSelectorProps {
  values?: Record<string, string>
  selectedClass?: ClassNameType
  errors?: Record<string, string>
}

interface RecommendedScoresProps {
  selectedClass?: ClassNameType
}

const RecommendedScores = ({ selectedClass }: RecommendedScoresProps) => {
  if (!selectedClass) {
    return null
  }

  const recommendedScores = STANDARD_ARRAY_BY_CLASS[selectedClass]

  return (
    <div class="alert alert-light mb-3">
      <h6 class="mb-2">Recommended Allocation for {toTitleCase(selectedClass)}</h6>
      <div class="table-responsive">
        <table class="table table-sm table-borderless mb-0" style="font-size: 0.85rem;">
          <thead>
            <tr>
              <th>Ability</th>
              <th class="text-center">Score</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {Abilities.map((ability) => {
              const score = recommendedScores[ability]
              const priority = getAbilityPriority(ability, recommendedScores)

              return (
                <tr>
                  <td class="text-capitalize">{ability}</td>
                  <td class="text-center">
                    <strong>{score}</strong>
                  </td>
                  <td>
                    {priority === "primary" && <span class="badge bg-success">Primary</span>}
                    {priority === "secondary" && <span class="badge bg-info">Secondary</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const StandardArrayTab = ({ values, selectedClass, errors }: AbilityScoreSelectorProps) => {
  // Parse current assignments from form values
  const assignments: Record<AbilityType, number> = {
    strength: Number.parseInt(values?.ability_str || "10", 10),
    dexterity: Number.parseInt(values?.ability_dex || "10", 10),
    constitution: Number.parseInt(values?.ability_con || "10", 10),
    intelligence: Number.parseInt(values?.ability_int || "10", 10),
    wisdom: Number.parseInt(values?.ability_wis || "10", 10),
    charisma: Number.parseInt(values?.ability_cha || "10", 10),
  }

  // Get already used values
  const usedValues = new Set(Object.values(assignments))

  // Generate script to apply recommended allocation
  const applyRecommendedScript = selectedClass
    ? `
    const recommended = ${JSON.stringify(STANDARD_ARRAY_BY_CLASS[selectedClass])};
    for (const [ability, score] of Object.entries(recommended)) {
      const fieldName = 'ability_' + ability.substring(0, 3);
      const select = document.querySelector('[name="' + fieldName + '"]');
      if (select) select.value = score.toString();
    }
    // Trigger form re-render if using HTMX
    const form = document.querySelector('form');
    if (form && htmx) htmx.trigger(form, 'change');
  `
    : ""

  return (
    <div class="mt-3">
      <p class="text-muted mb-3">
        Assign these six scores to your abilities: <strong>15, 14, 13, 12, 10, 8</strong>
      </p>

      {selectedClass && (
        <div class="mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            onclick={applyRecommendedScript}
          >
            Use Recommended Allocation for {toTitleCase(selectedClass)}
          </button>
        </div>
      )}

      <div class="row g-2 mb-3">
        {Abilities.map((ability) => {
          const fieldName = `ability_${ability.substring(0, 3)}`
          const currentValue = assignments[ability]

          return (
            <div class="col-md-4 col-6">
              <label class="form-label text-capitalize" style="font-size: 0.85rem;" for={fieldName}>
                {ability}
              </label>
              <select
                name={fieldName}
                class={clsx("form-select form-select-sm", { "is-invalid": errors?.[fieldName] })}
                required
              >
                <option value="">Select...</option>
                {STANDARD_ARRAY.map((value) => {
                  const isUsed = usedValues.has(value) && value !== currentValue
                  return (
                    <option value={value} selected={currentValue === value} disabled={isUsed}>
                      {value} {isUsed ? "(used)" : ""}
                    </option>
                  )
                })}
              </select>
              {errors?.[fieldName] && (
                <div class="invalid-feedback d-block">{errors[fieldName]}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const RandomGenerationTab = ({ values, errors }: AbilityScoreSelectorProps) => {
  // Parse current values
  const assignments: Record<AbilityType, number> = {
    strength: Number.parseInt(values?.ability_str || "10", 10),
    dexterity: Number.parseInt(values?.ability_dex || "10", 10),
    constitution: Number.parseInt(values?.ability_con || "10", 10),
    intelligence: Number.parseInt(values?.ability_int || "10", 10),
    wisdom: Number.parseInt(values?.ability_wis || "10", 10),
    charisma: Number.parseInt(values?.ability_cha || "10", 10),
  }

  return (
    <div class="mt-3">
      <p class="text-muted mb-3">
        Roll 4d6 and drop the lowest die, six times. Then enter the results below.
      </p>

      <div class="alert alert-warning mb-3">
        <strong>Note:</strong> Random generation is best done with physical dice or a dice roller
        app. Roll 4d6 six times, dropping the lowest die each time, then enter your results below.
      </div>

      <div class="row g-2 mb-3">
        {Abilities.map((ability) => {
          const fieldName = `ability_${ability.substring(0, 3)}`
          const currentValue = assignments[ability]

          return (
            <div class="col-md-4 col-6">
              <label class="form-label text-capitalize" style="font-size: 0.85rem;" for={fieldName}>
                {ability}
              </label>
              <input
                type="number"
                name={fieldName}
                class={clsx("form-control form-control-sm", { "is-invalid": errors?.[fieldName] })}
                min="3"
                max="18"
                value={currentValue}
                required
              />
              {errors?.[fieldName] && (
                <div class="invalid-feedback d-block">{errors[fieldName]}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PointBuyTab = ({ values, errors }: AbilityScoreSelectorProps) => {
  // Parse current values (default to minimum)
  const assignments: Record<AbilityType, number> = {
    strength: Number.parseInt(values?.ability_str || "8", 10),
    dexterity: Number.parseInt(values?.ability_dex || "8", 10),
    constitution: Number.parseInt(values?.ability_con || "8", 10),
    intelligence: Number.parseInt(values?.ability_int || "8", 10),
    wisdom: Number.parseInt(values?.ability_wis || "8", 10),
    charisma: Number.parseInt(values?.ability_cha || "8", 10),
  }

  // Calculate points spent
  const pointsSpent = Abilities.reduce((total, ability) => {
    const score = assignments[ability]
    return total + (POINT_BUY_COSTS[score] || 0)
  }, 0)

  const pointsRemaining = POINT_BUY_TOTAL - pointsSpent

  return (
    <div class="mt-3">
      <p class="text-muted mb-3">
        Start with <strong>27 points</strong> to spend. Scores range from <strong>8-15</strong>{" "}
        before racial modifiers.
      </p>

      <div class="alert alert-light mb-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>Points Remaining:</strong>{" "}
            <span
              class={clsx("fs-5 fw-bold", {
                "text-danger": pointsRemaining < 0,
                "text-success": pointsRemaining === 0,
              })}
            >
              {pointsRemaining}
            </span>{" "}
            / {POINT_BUY_TOTAL}
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            onclick="document.querySelectorAll('[name^=ability_]').forEach(el => el.value = '8'); const form = document.querySelector('form'); if (form && htmx) htmx.trigger(form, 'change');"
          >
            Reset All to 8
          </button>
        </div>
      </div>

      <div class="row g-3 mb-3">
        {Abilities.map((ability) => {
          const fieldName = `ability_${ability.substring(0, 3)}`
          const currentValue = assignments[ability]
          const currentCost = POINT_BUY_COSTS[currentValue] || 0

          return (
            <div class="col-md-4 col-6">
              <label
                class="form-label text-capitalize d-flex justify-content-between"
                for={fieldName}
              >
                <span>{ability}</span>
                <span class="text-muted" style="font-size: 0.75rem;">
                  Cost: {currentCost}
                </span>
              </label>
              <select
                name={fieldName}
                class={clsx("form-select form-select-sm", { "is-invalid": errors?.[fieldName] })}
                required
              >
                {Array.from({ length: POINT_BUY_MAX - POINT_BUY_MIN + 1 }, (_, i) => {
                  const value = POINT_BUY_MIN + i
                  const cost = POINT_BUY_COSTS[value] || 0
                  return (
                    <option value={value} selected={currentValue === value}>
                      {value} (Cost: {cost})
                    </option>
                  )
                })}
              </select>
              {errors?.[fieldName] && (
                <div class="invalid-feedback d-block">{errors[fieldName]}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const AbilityScoreSelector = ({
  values,
  selectedClass,
  errors,
}: AbilityScoreSelectorProps) => {
  const method = values?.ability_method || "standard-array"

  return (
    <div class="mb-3">
      <div class="form-label">Ability Scores</div>

      {/* Hidden field to track selected method */}
      <input type="hidden" name="ability_method" value={method} />

      {/* Recommended Scores - Always visible when class is selected */}
      <RecommendedScores selectedClass={selectedClass} />

      {/* Display ability_method error if present */}
      {errors?.ability_method && <div class="alert alert-danger mb-3">{errors.ability_method}</div>}

      {/* Tab Navigation */}
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <button
            class={clsx("nav-link", { active: method === "standard-array" })}
            type="button"
            onclick="this.closest('form').querySelector('[name=ability_method]').value = 'standard-array'; htmx.trigger(this.closest('form'), 'change');"
          >
            Standard Array
          </button>
        </li>
        <li class="nav-item">
          <button
            class={clsx("nav-link", { active: method === "random" })}
            type="button"
            onclick="this.closest('form').querySelector('[name=ability_method]').value = 'random'; htmx.trigger(this.closest('form'), 'change');"
          >
            Random Generation
          </button>
        </li>
        <li class="nav-item">
          <button
            class={clsx("nav-link", { active: method === "point-buy" })}
            type="button"
            onclick="this.closest('form').querySelector('[name=ability_method]').value = 'point-buy'; htmx.trigger(this.closest('form'), 'change');"
          >
            Point Buy
          </button>
        </li>
      </ul>

      {/* Tab Content - Only render active tab */}
      {method === "standard-array" && (
        <StandardArrayTab values={values} selectedClass={selectedClass} errors={errors} />
      )}
      {method === "random" && <RandomGenerationTab values={values} errors={errors} />}
      {method === "point-buy" && <PointBuyTab values={values} errors={errors} />}
    </div>
  )
}
