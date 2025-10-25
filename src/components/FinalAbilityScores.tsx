import { Abilities, type AbilityScoreModifiers, type AbilityType } from "@src/lib/dnd"
import { getRuleset, type RulesetId } from "@src/lib/dnd/rulesets"
import clsx from "clsx"

// Helper to calculate ability modifier
function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

// Format modifier with + or - sign
function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

interface FinalAbilityScoresProps {
  values?: Record<string, string>
  rulesetId: RulesetId
  errors?: Record<string, string>
}

export const FinalAbilityScores = ({ values, rulesetId, errors }: FinalAbilityScoresProps) => {
  const ruleset = getRuleset(rulesetId)

  // Parse base ability scores from form
  const baseScores: Record<AbilityType, number> = {
    strength: Number.parseInt(values?.ability_str || "10", 10),
    dexterity: Number.parseInt(values?.ability_dex || "10", 10),
    constitution: Number.parseInt(values?.ability_con || "10", 10),
    intelligence: Number.parseInt(values?.ability_int || "10", 10),
    wisdom: Number.parseInt(values?.ability_wis || "10", 10),
    charisma: Number.parseInt(values?.ability_cha || "10", 10),
  }

  // Calculate modifiers based on ruleset
  let modifiers: AbilityScoreModifiers = {}
  let modifierSource = ""

  if (rulesetId === "srd51") {
    // 2014 rules: species and lineage provide fixed bonuses
    modifierSource = "Species/Lineage"

    if (values?.species) {
      const species = ruleset.species.find((s) => s.name === values.species)

      // Apply species modifiers
      if (species?.abilityScoreModifiers) {
        modifiers = { ...modifiers, ...species.abilityScoreModifiers }
      }

      // Apply lineage modifiers
      if (values?.lineage && species?.lineages) {
        const lineage = species.lineages.find((l) => l.name === values.lineage)
        if (lineage?.abilityScoreModifiers) {
          modifiers = { ...modifiers, ...lineage.abilityScoreModifiers }
        }
      }
    }
  } else if (rulesetId === "srd52") {
    // 2024 rules: background provides choice of abilities to increase
    modifierSource = "Background"

    if (values?.background) {
      const background = ruleset.backgrounds[values.background]
      if (background?.abilityScoresModified && background.abilityScoresModified.length >= 3) {
        // Parse player's choices from form (field names like background_ability_str_bonus)
        for (const ability of background.abilityScoresModified) {
          const fieldName = `background_ability_${ability.substring(0, 3)}_bonus`
          const bonus = Number.parseInt(values?.[fieldName] || "0", 10)
          if (bonus > 0) {
            modifiers[ability] = bonus
          }
        }
      }
    }
  }

  // Calculate final scores
  const finalScores: Record<AbilityType, { base: number; modifier: number; total: number }> =
    {} as Record<AbilityType, { base: number; modifier: number; total: number }>
  for (const ability of Abilities) {
    const base = baseScores[ability]
    const modifier = modifiers[ability] || 0
    const total = base + modifier
    finalScores[ability] = { base, modifier, total }
  }

  // Check if we have any modifiers to display
  const hasModifiers = Object.values(modifiers).some((m) => m > 0)

  // For 2024 rules, check if we need to show the selection interface
  const show2024Selection =
    rulesetId === "srd52" &&
    values?.background &&
    ruleset.backgrounds[values.background]?.abilityScoresModified

  // Calculate total bonuses for 2024 rules
  const totalBonuses2024 = show2024Selection
    ? (ruleset.backgrounds[values!.background!]?.abilityScoresModified || []).reduce(
        (sum, ability) => {
          const fieldName = `background_ability_${ability.substring(0, 3)}_bonus`
          return sum + Number.parseInt(values?.[fieldName] || "0", 10)
        },
        0
      )
    : 0

  return (
    <div class="mb-3">
      <div class="form-label">Final Ability Scores</div>

      {show2024Selection && (
        <div class={clsx("alert mb-3", errors?.background ? "alert-danger" : "alert-info")}>
          <p class="mb-2">
            <strong>2024 Rules:</strong> Your background allows you to increase three ability scores
            by a total of 3 points.
          </p>
          <p class="mb-2 small">
            Choose one ability for +2 and one for +1 (and one for +0), or three abilities for +1
            each.
          </p>
          {errors?.background && (
            <div class="alert alert-danger mb-2 mt-2">{errors.background}</div>
          )}
          <div class="row g-2">
            {(ruleset.backgrounds[values!.background!]?.abilityScoresModified || []).map(
              (ability) => {
                const fieldName = `background_ability_${ability.substring(0, 3)}_bonus`
                const currentValue = Number.parseInt(values?.[fieldName] || "0", 10)

                // Calculate how many points remain
                const otherBonuses = (
                  ruleset.backgrounds[values!.background!]?.abilityScoresModified || []
                )
                  .filter((a) => a !== ability)
                  .reduce((sum, a) => {
                    const fn = `background_ability_${a.substring(0, 3)}_bonus`
                    return sum + Number.parseInt(values?.[fn] || "0", 10)
                  }, 0)
                const pointsRemaining = 3 - otherBonuses

                // Determine max allowed for this ability
                const maxAllowed = Math.min(2, pointsRemaining + currentValue)

                return (
                  <div class="col-md-4">
                    <label class="form-label text-capitalize" for={fieldName}>
                      {ability}
                    </label>
                    <select
                      name={fieldName}
                      class={clsx("form-select form-select-sm", {
                        "is-invalid": errors?.[fieldName],
                      })}
                      required
                    >
                      {[0, 1, 2].map((value) => {
                        const isDisabled = value > maxAllowed
                        return (
                          <option
                            value={value}
                            selected={currentValue === value}
                            disabled={isDisabled}
                          >
                            {value === 0 ? "No bonus" : `+${value}`}
                            {isDisabled ? " (exceeds 3 point total)" : ""}
                          </option>
                        )
                      })}
                    </select>
                    {errors?.[fieldName] && (
                      <div class="invalid-feedback d-block">{errors[fieldName]}</div>
                    )}
                  </div>
                )
              }
            )}
          </div>
          <div class="mt-2">
            <small class={totalBonuses2024 === 3 ? "text-success" : "text-danger"}>
              <strong>Total points used: {totalBonuses2024} / 3</strong>
              {totalBonuses2024 !== 3 && " (must equal 3)"}
            </small>
          </div>
        </div>
      )}

      <div class="card">
        <div class="card-body p-3">
          {hasModifiers ? (
            <div class="table-responsive">
              <table class="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Ability</th>
                    <th class="text-center">Base</th>
                    <th class="text-center">{modifierSource}</th>
                    <th class="text-center">Total</th>
                    <th class="text-center">Modifier</th>
                  </tr>
                </thead>
                <tbody>
                  {Abilities.map((ability) => {
                    const { base, modifier, total } = finalScores[ability]
                    return (
                      <tr>
                        <td class="text-capitalize">{ability}</td>
                        <td class="text-center">{base}</td>
                        <td class="text-center">
                          {modifier > 0 ? (
                            <span class="badge bg-success">+{modifier}</span>
                          ) : (
                            <span class="text-muted">-</span>
                          )}
                        </td>
                        <td class="text-center">
                          <strong>{total}</strong>
                        </td>
                        <td class="text-center">
                          <span class="badge bg-secondary">
                            {formatModifier(calculateModifier(total))}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div class="text-center text-muted">
              <p class="mb-0">
                {rulesetId === "srd52"
                  ? "Select a background above to see ability score bonuses."
                  : "Select a species above to see ability score bonuses."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div class="form-text mt-2">
        These are your final ability scores including any bonuses from your{" "}
        {rulesetId === "srd52" ? "background" : "species and lineage"}.
      </div>
    </div>
  )
}
