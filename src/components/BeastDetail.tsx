import type { Beast, BeastSpeed } from "@src/lib/dnd/beasts"
import { formatDice } from "@src/lib/spellFormatters"
import { clsx } from "clsx"

export interface BeastDetailProps {
  beast: Beast
  compact?: boolean
  class?: string
}

function formatCR(cr: number): string {
  if (cr === 0.125) return "1/8"
  if (cr === 0.25) return "1/4"
  if (cr === 0.5) return "1/2"
  return cr.toString()
}

function formatSpeed(speed: BeastSpeed): string {
  const parts: string[] = []
  if (speed.walk) parts.push(`${speed.walk} ft.`)
  if (speed.swim) parts.push(`swim ${speed.swim} ft.`)
  if (speed.fly) parts.push(`fly ${speed.fly} ft.`)
  if (speed.climb) parts.push(`climb ${speed.climb} ft.`)
  if (speed.burrow) parts.push(`burrow ${speed.burrow} ft.`)
  return parts.join(", ")
}

function formatAbilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function AbilityScoreRow({ beast }: { beast: Beast }) {
  const abilities = [
    { name: "STR", score: beast.abilities.strength },
    { name: "DEX", score: beast.abilities.dexterity },
    { name: "CON", score: beast.abilities.constitution },
    { name: "INT", score: beast.abilities.intelligence },
    { name: "WIS", score: beast.abilities.wisdom },
    { name: "CHA", score: beast.abilities.charisma },
  ]

  return (
    <div class="row g-1 mb-2">
      {abilities.map((ability) => (
        <div class="col-2 text-center">
          <div class="fw-bold small">{ability.name}</div>
          <div class="small">
            {ability.score} ({formatAbilityModifier(ability.score)})
          </div>
        </div>
      ))}
    </div>
  )
}

function BeastDetailInner({ beast, className }: { beast: Beast; className: string }) {
  return (
    <div class={className}>
      {/* Basic Info */}
      <ul class="list-group list-group-flush mb-3">
        <li class="list-group-item">
          <strong>Type:</strong> <span class="text-capitalize">{beast.size}</span> Beast
        </li>
        <li class="list-group-item">
          <strong>Challenge Rating:</strong> {formatCR(beast.cr)} ({beast.xp} XP)
        </li>
        <li class="list-group-item">
          <strong>Armor Class:</strong> {beast.ac}
          {beast.acType && <span class="text-muted"> ({beast.acType})</span>}
        </li>
        <li class="list-group-item">
          <strong>Hit Points:</strong> {beast.hitPoints}
        </li>
        <li class="list-group-item">
          <strong>Speed:</strong> {formatSpeed(beast.speed)}
        </li>
      </ul>

      {/* Ability Scores */}
      <h6>Ability Scores</h6>
      <AbilityScoreRow beast={beast} />

      {/* Skills */}
      {beast.skills && Object.keys(beast.skills).length > 0 && (
        <p class="mb-2">
          <strong>Skills:</strong>{" "}
          {Object.entries(beast.skills)
            .map(([skill, bonus]) => (
              <span class="text-capitalize">
                {skill} +{bonus}
              </span>
            ))
            .reduce((prev, curr, idx) => (
              <>
                {prev}
                {idx > 0 ? ", " : ""}
                {curr}
              </>
            ))}
        </p>
      )}

      {/* Senses */}
      <p class="mb-2">
        <strong>Senses:</strong> {beast.senses}
      </p>

      {/* Traits */}
      {beast.traits && beast.traits.length > 0 && (
        <div class="mb-3">
          <h6>Traits</h6>
          {beast.traits.map((trait) => (
            <p class="mb-1">
              <strong class="text-capitalize">{trait.name}.</strong> {trait.description}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div class="mb-2">
        <h6>Actions</h6>
        {beast.actions.map((action) => (
          <p class="mb-2">
            <strong class="text-capitalize">{action.name}.</strong>{" "}
            <em>{action.attackType === "melee" ? "Melee" : "Ranged"} Weapon Attack:</em>{" "}
            {action.attackBonus >= 0 ? "+" : ""}
            {action.attackBonus} to hit, {action.reach && `reach ${action.reach} ft.`}
            {action.range && `range ${action.range.normal}/${action.range.long} ft.`} <em>Hit:</em>{" "}
            {action.damage.dice ? formatDice(action.damage.dice) : ""}
            {action.damage.flatBonus ? ` + ${action.damage.flatBonus}` : ""}{" "}
            <span class="text-capitalize">{action.damage.type}</span> damage.
            {action.description && ` ${action.description}`}
          </p>
        ))}
      </div>
    </div>
  )
}

export const BeastDetail = ({ beast, compact, class: className }: BeastDetailProps) => {
  if (compact) {
    return (
      <div class={clsx("accordion", className)}>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#beast-summary"
              aria-expanded="true"
              aria-controls="beast-summary"
            >
              {beast.name}
              <span class="badge bg-secondary ms-2">CR {formatCR(beast.cr)}</span>
            </button>
          </h2>
          <div id="beast-summary" class="accordion-collapse collapse show">
            <div class="accordion-body">
              <span class="text-capitalize">{beast.size}</span> beast, {beast.hitPoints} HP, AC{" "}
              {beast.ac}
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#beast-full"
              aria-expanded="false"
              aria-controls="beast-full"
            >
              Full Stat Block
            </button>
          </h2>
          <div id="beast-full" class="accordion-collapse collapse">
            <BeastDetailInner beast={beast} className="accordion-body" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">
          {beast.name}
          <span class="badge bg-secondary ms-2">CR {formatCR(beast.cr)}</span>
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <BeastDetailInner beast={beast} className={clsx("modal-body", className)} />
    </>
  )
}
