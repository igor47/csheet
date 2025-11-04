import { ItemCategories } from "@src/lib/dnd"
import { spells } from "@src/lib/dnd/spells"
import type { ComputedCharacter } from "@src/services/computeCharacter"

/**
 * Build the system prompt for the AI assistant based on the character's current state
 */

const PREAMBLE =
  `Reed here. *doesn't look up from ledger* I've got a dozen other adventurers' sheets to update today, so let's keep this brief.

I know the D&D 5e rules inside and out - Player's Handbook, the whole deal. I'll update your sheet, track your resources, manage your spells. Just tell me what happened and I'll handle it. Quick questions are fine too.

Let's get to it.
` as const

function formatClasses(character: ComputedCharacter): string {
  return character.classes
    .map((c) => `level ${c.level} ${c.class} ${c.subclass ? ` (${c.subclass})` : ""}`)
    .join(", ")
}

function formatAbilities(character: ComputedCharacter): string {
  const abilityLines: string[] = []
  // Ability scores with modifiers and saves
  for (const [ability, score] of Object.entries(character.abilityScores)) {
    const modStr = score.modifier >= 0 ? `+${score.modifier}` : `${score.modifier}`
    const saveStr = score.savingThrow >= 0 ? `+${score.savingThrow}` : `${score.savingThrow}`
    const profMark = score.proficient ? "*" : ""
    abilityLines.push(
      `${ability.toUpperCase()}: ${score.score} (${modStr}, save ${saveStr}${profMark})`
    )
  }

  return abilityLines.join(",")
}

function formatSkills(character: ComputedCharacter): string {
  // Skills - only show proficient/expert
  const proficientSkills: string[] = []
  for (const [skill, skillScore] of Object.entries(character.skills)) {
    if (skillScore.proficiency !== "none") {
      const modStr = skillScore.modifier >= 0 ? `+${skillScore.modifier}` : `${skillScore.modifier}`
      const profLevel =
        skillScore.proficiency === "expert"
          ? "**"
          : skillScore.proficiency === "proficient"
            ? "*"
            : ""
      proficientSkills.push(`${skill} ${modStr}${profLevel}`)
    }
  }
  const skillsDesc =
    proficientSkills.length > 0 ? proficientSkills.join(", ") : "no proficient skills"

  return skillsDesc
}

function formatCombat(character: ComputedCharacter): string {
  const hpDesc = `${character.currentHP}/${character.maxHitPoints}`
  const initStr = character.initiative >= 0 ? `+${character.initiative}` : `${character.initiative}`

  return `HP: ${hpDesc} • AC: ${character.armorClass} • Initiative: ${initStr} • Passive Perception: ${character.passivePerception}`
}

function formatResources(character: ComputedCharacter): string {
  const coinsDesc = character.coins
    ? `${character.coins.pp}pp ${character.coins.gp}gp ${character.coins.ep}ep ${character.coins.sp}sp ${character.coins.cp}cp`
    : "no coins"

  const availableSlots = character.availableSpellSlots.filter((slot) => slot > 0)
  const slotsDesc =
    availableSlots.length > 0
      ? availableSlots
          .map((count, level) => `${count}×L${level + 1}`)
          .filter((s) => !s.startsWith("0"))
          .join(", ")
      : "none"

  const hitDiceDesc = `${character.availableHitDice.length}/${character.hitDice.length}`

  return [`Coins: ${coinsDesc}`, `Spell Slots: ${slotsDesc}`, `Hit Dice: ${hitDiceDesc}`].join("\n")
}

function formatEquipment(character: ComputedCharacter): string {
  const itemLines: string[] = []

  for (const cat of ItemCategories) {
    const itemsInCat = character.equippedItems.filter((item) => item.category === cat)
    if (itemsInCat.length === 0) {
      continue
    }

    itemLines.push(`## ${cat} items`)

    for (const item of itemsInCat) {
      const itemParts: string[] = [
        `Item ID: ${item.id} -- ${item.name}`,
        item.wearable ? (item.worn ? " (worn)" : " (not worn)") : "",
        item.wieldable ? (item.wielded ? " (wielded)" : " (not wielded)") : "",
        ":",
        item.humanReadableDamage.length > 0
          ? ` Damage: ${item.humanReadableDamage.join(", ")}.`
          : "",
        item.chargeLabel && item.currentCharges > 0
          ? ` ${item.currentCharges} ${item.chargeLabel} remaining.`
          : "",
      ]

      itemLines.push(itemParts.join(" "))
    }
  }

  // Active item effects
  const itemEffects: string[] = []
  for (const [attr, effectInfo] of Object.entries(character.affectedAttributes)) {
    for (const effect of effectInfo) {
      itemEffects.push(`${effect.itemName} affects ${attr}: ${effect.effectDescription}`)
    }
  }

  if (itemEffects.length > 0) {
    itemLines.push("## Active Item Effects")
    for (const effectLine of itemEffects) {
      itemLines.push(`- ${effectLine}`)
    }
  }

  return itemLines.join("\n")
}

function formatSpellcasting(character: ComputedCharacter): string {
  if (character.spells.length === 0) {
    return "No spellcasting abilities"
  }

  let spellcastingSection = ""

  for (const spellInfo of character.spells) {
    const atkStr =
      spellInfo.spellAttackBonus >= 0
        ? `+${spellInfo.spellAttackBonus}`
        : `${spellInfo.spellAttackBonus}`
    spellcastingSection += `\n**${spellInfo.class}** (${spellInfo.ability.toUpperCase()}): Spell Attack ${atkStr}, Save DC ${spellInfo.spellSaveDC}`

    // Prepared cantrips
    const preparedCantrips = spellInfo.cantripSlots
      .filter((slot) => slot.spell_id)
      .map((slot) => spells.find((s) => s.id === slot.spell_id)?.name || slot.spell_id)
    if (preparedCantrips.length > 0) {
      spellcastingSection += `\nCantrips: ${preparedCantrips.join(", ")}`
    }

    // Prepared leveled spells
    const preparedSpells = spellInfo.preparedSpells
      .filter((slot) => slot.spell_id)
      .map((slot) => {
        const spell = spells.find((s) => s.id === slot.spell_id)
        const lockMark = slot.alwaysPrepared ? "🔒" : ""
        return spell ? `${spell.name} (L${spell.level})${lockMark}` : slot.spell_id
      })
    if (preparedSpells.length > 0) {
      spellcastingSection += `\nPrepared: ${preparedSpells.join(", ")}`
    }

    // Wizard spellbook
    if (spellInfo.knownSpells && spellInfo.knownSpells.length > 0) {
      const spellbookSpells = spellInfo.knownSpells
        .map((spellId) => spells.find((s) => s.id === spellId))
        .filter((s) => s && s.level > 0) // Don't list cantrips in spellbook
        .map((s) => `${s?.name} (L${s?.level})`)
      if (spellbookSpells.length > 0) {
        spellcastingSection += `\nSpellbook: ${spellbookSpells.join(", ")}`
      }
    }
  }

  return spellcastingSection
}

const FOOTER = `
# How I Work

I'll just do it. Tell me what happened and I'll update your sheet. My tools have validation built in - if something's wrong, they'll catch it and I'll adjust.

**Spells**: When you mention a spell by name, I'll use lookup_spell to find its ID first, then handle learning/preparing/casting. Every time.

**Missing info**: I'll make reasonable assumptions based on D&D rules. If I genuinely can't proceed, I'll ask. Otherwise, I'm trying it.

The tools need your confirmation before changes take effect, so there's a safety net. I'm here to move fast and keep your sheet current.` as const

export function buildSystemPrompt(character: ComputedCharacter): string {
  const prompt = [
    PREAMBLE,
    "Your character sheet is as follows:",
    "\n# Character Overview",
    `Name: ${character.name}`,
    `Species: ${character.species} ${character.lineage || ""}`,
    `Background: ${character.background || "none"}`,
    `Classes: total level ${character.totalLevel}, as a ${formatClasses(character)}`,
    "\n# Ability Scores",
    formatAbilities(character),
    "\n# Skills",
    formatSkills(character),
    "\n# Combat Stats",
    formatCombat(character),
    "\n# Resources",
    formatResources(character),
    "\n# Equipment",
    formatEquipment(character),
    "\n# Spellcasting",
    formatSpellcasting(character),
    FOOTER,
  ].join("\n")

  return prompt
}
