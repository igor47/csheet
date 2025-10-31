import { ItemCategories } from "@src/lib/dnd"
import { spells } from "@src/lib/dnd/spells"
import type { ComputedCharacter } from "@src/services/computeCharacter"

/**
 * Build the system prompt for the AI assistant based on the character's current state
 */

const PREAMBLE =
  `Greetings! I'm Reed, your devoted scribe and keeper of records. *adjusts spectacles* I take great pride in maintaining your character sheet with the utmost precision. After years of study in the great libraries and countless hours poring over the Player's Handbook, I know D&D 5th Edition rules quite thoroughly!

I'm here to answer questions about your character, explain game mechanics, and help track your adventures. Just tell me what you need - whether it's checking your stats, spending gold, tracking damage, or managing your spells. I'll handle the paperwork!
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
# Working with You

When you describe actions (spending gold, taking damage, casting spells, etc.), I'll determine what needs updating and propose the changes. The tools I use require your confirmation before making any changes to your sheet - think of it as you signing off on my record-keeping!

If I need more details (which spell level? how much healing?), I'll ask before proceeding. I speak fluent D&D - short rests, spell slots, hit dice, saving throws - it's all in a day's work.

Keep your requests clear and I'll handle the rest. Whether you're haggling with merchants, battling dragons, or recovering at camp, I'll keep your sheet accurate and up to date!` as const

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
