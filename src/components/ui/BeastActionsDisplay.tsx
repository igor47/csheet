import type { BeastAttack, DamageEntry } from "@src/lib/dnd/beasts"

export interface BeastActionsDisplayProps {
  actions: BeastAttack[]
  beastName: string
}

function formatDamageEntry(damage: DamageEntry): string {
  const parts: string[] = []

  if (damage.dice && damage.dice.length > 0) {
    // Group dice by size and count them
    const diceCounts: Record<number, number> = {}
    for (const die of damage.dice) {
      diceCounts[die] = (diceCounts[die] || 0) + 1
    }

    // Format each dice group
    const diceStrings = Object.entries(diceCounts).map(([size, count]) => `${count}d${size}`)
    parts.push(diceStrings.join(" + "))
  }

  if (damage.flatBonus) {
    parts.push(damage.flatBonus > 0 ? `+${damage.flatBonus}` : `${damage.flatBonus}`)
  }

  const diceText = parts.join(" ") || "0"
  return `${diceText} ${damage.type}`
}

interface BeastActionRowProps {
  action: BeastAttack
}

const BeastActionRow = ({ action }: BeastActionRowProps) => {
  const attackBonus = action.attackBonus >= 0 ? `+${action.attackBonus}` : `${action.attackBonus}`
  const damageText = formatDamageEntry(action.damage)
  const rangeText =
    action.attackType === "melee"
      ? `reach ${action.reach || 5} ft.`
      : `range ${action.range?.normal}/${action.range?.long} ft.`

  return (
    <div class="d-flex align-items-center justify-content-between gap-2">
      <div class="d-flex flex-column">
        <span class="fw-bold">{action.name}</span>
        <span class="text-muted small">
          {action.attackType === "melee" ? "Melee" : "Ranged"} {attackBonus}, {rangeText}
        </span>
      </div>
      <span class="text-muted small">({damageText})</span>
    </div>
  )
}

export const BeastActionsDisplay = ({ actions, beastName }: BeastActionsDisplayProps) => {
  return (
    <div class="row g-2 h-auto mt-2">
      <div class="col-12">
        <div class="text-muted small mb-1">Beast Actions ({beastName})</div>
        <div class="d-flex flex-column gap-1">
          {actions.map((action) => (
            <BeastActionRow action={action} />
          ))}
        </div>
      </div>
    </div>
  )
}
