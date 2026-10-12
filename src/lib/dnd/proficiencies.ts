import { z } from "zod"
import type { Choice, GrantedProficiencies, Ruleset, TemplateItem } from "../dnd"
import { getWeaponTemplates, type RulesetId } from "./itemTemplates"

export const ProficiencyKinds = ["weapon", "armor", "tool", "language"] as const
export const ProficiencyKindSchema = z.enum(ProficiencyKinds)
export type ProficiencyKind = z.infer<typeof ProficiencyKindSchema>

export const ProficiencyActions = ["add", "remove"] as const
export const ProficiencyActionSchema = z.enum(ProficiencyActions)
export type ProficiencyAction = z.infer<typeof ProficiencyActionSchema>

export const ProficiencySources = ["species", "lineage", "background", "class", "custom"] as const
export const ProficiencySourceSchema = z.enum(ProficiencySources)
export type ProficiencySource = z.infer<typeof ProficiencySourceSchema>

export const ProficiencyKindLabels: Record<ProficiencyKind, string> = {
  weapon: "Weapons",
  armor: "Armor",
  tool: "Tools",
  language: "Languages",
}

export const SIMPLE_WEAPONS = "simple weapons"
export const MARTIAL_WEAPONS = "martial weapons"
// SRD 5.2 monks: martial weapons that have the Light property
export const MARTIAL_LIGHT_WEAPONS = "martial weapons (light)"
// SRD 5.2 rogues: martial weapons that have the Finesse or Light property
export const MARTIAL_FINESSE_LIGHT_WEAPONS = "martial weapons (finesse or light)"

export const ArmorProficiencyNames = ["light armor", "medium armor", "heavy armor", "shields"]

// Common choices, offered as suggestions when adding a proficiency by hand
export const ToolSuggestions = [
  "alchemist's supplies",
  "brewer's supplies",
  "calligrapher's supplies",
  "carpenter's tools",
  "cartographer's tools",
  "cobbler's tools",
  "cook's utensils",
  "glassblower's tools",
  "jeweler's tools",
  "leatherworker's tools",
  "mason's tools",
  "painter's supplies",
  "potter's tools",
  "smith's tools",
  "tinker's tools",
  "weaver's tools",
  "woodcarver's tools",
  "disguise kit",
  "forgery kit",
  "herbalism kit",
  "navigator's tools",
  "poisoner's kit",
  "thieves' tools",
  "dice set",
  "playing card set",
  "bagpipes",
  "drum",
  "dulcimer",
  "flute",
  "lute",
  "lyre",
  "horn",
  "pan flute",
  "shawm",
  "viol",
  "vehicles (land)",
  "vehicles (water)",
]

export const LanguageSuggestions = [
  "common",
  "common sign language",
  "draconic",
  "dwarvish",
  "elvish",
  "giant",
  "gnomish",
  "goblin",
  "halfling",
  "orc",
  "abyssal",
  "celestial",
  "deep speech",
  "druidic",
  "infernal",
  "primordial",
  "sylvan",
  "thieves' cant",
  "undercommon",
]

/**
 * A weapon template's name as a proficiency, e.g. "Crossbow, light" -> "light crossbow"
 */
function templateWeaponName(name: string): string {
  const lower = name.toLowerCase().trim()
  const comma = lower.match(/^(.*), (.*)$/)
  return comma ? `${comma[2]} ${comma[1]}` : lower
}

// The templates mark both melee weapons with the Thrown property (dagger, javelin) and the SRD's
// thrown ranged weapons as "thrown"; these are the ranged ones
const RANGED_THROWN_WEAPONS = ["dart", "net"]

interface WeaponTemplate {
  name: string
  compact: string
  template: TemplateItem
  ranged: boolean
}

function weaponTemplates(ruleset: RulesetId): WeaponTemplate[] {
  return getWeaponTemplates(ruleset)
    .filter((t) => t.category === "weapon")
    .map((t) => {
      const name = templateWeaponName(t.name)
      return {
        name,
        compact: name.replace(/ /g, ""),
        template: t,
        ranged: t.weapon_type === "ranged" || RANGED_THROWN_WEAPONS.includes(name),
      }
    })
}

function cleanName(name: string): string {
  return name.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim()
}

/**
 * Find the standard weapon named in some text, e.g. "+1 Short Sword" or "Crossbow, hand"
 * Matches whole words, ignoring spaces inside a weapon's name ("war hammer", "hand axe") and a
 * plural "s"; a bare "crossbow" is a light crossbow. The longest match wins, so "greatclub"
 * isn't a club
 */
function findWeaponTemplate(ruleset: RulesetId, text: string): WeaponTemplate | null {
  const cleaned = cleanName(text)
  const phrases = [cleaned, templateWeaponName(cleaned)]
  const templates = weaponTemplates(ruleset)

  let best: WeaponTemplate | null = null
  for (const phrase of phrases) {
    const words = phrase
      .replace(/[^a-z' ]+/g, " ")
      .split(" ")
      .filter(Boolean)
    for (let i = 0; i < words.length; i++) {
      for (let len = 1; len <= 3 && i + len <= words.length; len++) {
        const joined = words.slice(i, i + len).join("")
        for (const t of templates) {
          if (joined === t.compact || joined === `${t.compact}s`) {
            if (!best || t.compact.length > best.compact.length) best = t
          }
        }
      }
    }
  }
  if (best) return best

  if (/\bcrossbows?\b/.test(cleaned)) {
    return templates.find((t) => t.name === "light crossbow") ?? null
  }
  return null
}

const WEAPON_CATEGORY = /^(simple|martial)(?: weapons?)?(?=$| \()/

/**
 * Normalize a proficiency name the way a player or the LLM might write it, so that
 * "Simple", "Longswords", "Short Sword", or "Light Armour" match what the rulesets grant
 */
export function normalizeProficiencyName(
  kind: ProficiencyKind,
  name: string,
  ruleset: RulesetId
): string {
  const cleaned = cleanName(name)

  if (kind === "weapon") {
    if (WEAPON_CATEGORY.test(cleaned)) {
      return cleaned.replace(WEAPON_CATEGORY, (_m, cat) => `${cat} weapons`)
    }
    // "martial light weapons" -> "martial weapons (light)"
    const property = cleaned.match(/^martial (light|finesse or light) weapons?$/)
    if (property) return `${MARTIAL_WEAPONS} (${property[1]})`
    // only a name that's entirely a standard weapon becomes it; "longsword of flame" stays
    const compact = (t: string) => t.replace(/[^a-z']+/g, "")
    const whole = [compact(cleaned), compact(templateWeaponName(cleaned))]
    const match = weaponTemplates(ruleset).find((t) =>
      whole.some((w) => w === t.compact || w === `${t.compact}s`)
    )
    if (match) return match.name
    if (cleaned === "crossbow") return "light crossbow"
    return cleaned
  }

  if (kind === "armor") {
    const armor = cleaned.replace(/armour/g, "armor")
    if (/^shields?$/.test(armor)) return "shields"
    const category = armor.match(/^(light|medium|heavy)( armor)?$/)
    if (category) return `${category[1]} armor`
    return armor
  }

  // tools and languages: snap to the usual spelling, ignoring apostrophes ("thieves tools")
  const known = kind === "tool" ? ToolSuggestions : LanguageSuggestions
  const key = (t: string) => t.replace(/'/g, "")
  return known.find((k) => key(k) === key(cleaned)) ?? cleaned
}

const VALID_WEAPON_CATEGORIES = [
  SIMPLE_WEAPONS,
  MARTIAL_WEAPONS,
  MARTIAL_LIGHT_WEAPONS,
  MARTIAL_FINESSE_LIGHT_WEAPONS,
]
// names for groups of weapons that aren't categories in the rules
const WEAPON_GROUPS =
  /^(bows|crossbows|swords|blades|axes|hammers|polearms|firearms|melee weapons|ranged weapons)$/

/**
 * Why a proficiency name doesn't make sense for its kind, if it doesn't
 */
export function invalidProficiencyReason(kind: ProficiencyKind, name: string): string | null {
  if (!name) return "Name is required"
  if (kind === "armor" && !ArmorProficiencyNames.includes(name)) {
    return `Armor proficiencies are ${ArmorProficiencyNames.join(", ")}`
  }
  if (kind !== "armor" && ArmorProficiencyNames.includes(name)) {
    return `${formatProficiencyName(name)} is an armor proficiency`
  }
  if (kind === "weapon" && !VALID_WEAPON_CATEGORIES.includes(name)) {
    if (/\bweapons?\b/.test(name)) {
      return `Weapon categories are ${VALID_WEAPON_CATEGORIES.join(", ")}; otherwise name each weapon`
    }
    if (WEAPON_GROUPS.test(name)) {
      return `${formatProficiencyName(name)} isn't a weapon category; name each weapon, e.g. longbow, shortbow`
    }
  }
  if (kind !== "weapon" && WEAPON_CATEGORY.test(name)) {
    return `${formatProficiencyName(name)} is a weapon proficiency`
  }
  return null
}

/**
 * Display a proficiency name: capitalize each word outside parentheses
 */
export function formatProficiencyName(name: string): string {
  let depth = 0
  return name
    .split(" ")
    .map((word) => {
      const atStart = depth === 0 && !word.startsWith("(")
      depth += (word.match(/\(/g) || []).length - (word.match(/\)/g) || []).length
      return atStart ? word.charAt(0).toUpperCase() + word.slice(1) : word
    })
    .join(" ")
}

export interface ProficiencyGrant {
  kind: ProficiencyKind
  name: string
  source: ProficiencySource
  source_detail: string | null
  /** A caveat that comes with the grant, e.g. a druid's armor must not be made of metal */
  note?: string
}

// Choices are left to the player; only fixed proficiencies are granted
function fixed(values: (string | Choice<string>)[] | undefined): string[] {
  return (values || []).filter((v): v is string => typeof v === "string")
}

function grantsFrom(
  granted: GrantedProficiencies,
  source: ProficiencySource,
  sourceDetail: string,
  ruleset: RulesetId
): ProficiencyGrant[] {
  const grants: ProficiencyGrant[] = []
  const add = (kind: ProficiencyKind, names: string[]) => {
    for (const name of names) {
      grants.push({
        kind,
        name: normalizeProficiencyName(kind, name, ruleset),
        source,
        source_detail: sourceDetail,
      })
    }
  }
  add("armor", granted.armorProficiencies || [])
  add("weapon", granted.weaponProficiencies || [])
  add("tool", fixed(granted.toolProficiencies))
  add("language", granted.languages || [])
  return grants
}

/**
 * Proficiencies a character has from their species, lineage, and background
 */
export function originProficiencies(
  ruleset: Ruleset,
  origin: { species: string; lineage?: string | null; background: string }
): ProficiencyGrant[] {
  const rulesetId = ruleset.id as RulesetId
  const grants: ProficiencyGrant[] = []

  const species = ruleset.species.find((s) => s.name.toLowerCase() === origin.species.toLowerCase())
  if (species) {
    grants.push(...grantsFrom(species, "species", species.name, rulesetId))
    if (origin.lineage) {
      const lineage = species.lineages?.find(
        (l) => l.name.toLowerCase() === origin.lineage!.toLowerCase()
      )
      if (lineage) grants.push(...grantsFrom(lineage, "lineage", lineage.name, rulesetId))
    }
  }

  const background = ruleset.backgrounds[origin.background.toLowerCase()]
  if (background) {
    grants.push(
      ...grantsFrom(
        { toolProficiencies: background.toolProficiencies },
        "background",
        background.name,
        rulesetId
      )
    )
  }

  return grants
}

/**
 * Proficiencies a class grants
 * The character's first class grants its full starting proficiencies; a class taken later as a
 * multiclass grants only the reduced multiclassing set
 */
export function classProficiencies(
  ruleset: Ruleset,
  className: string,
  { multiclass }: { multiclass: boolean }
): ProficiencyGrant[] {
  const classDef = ruleset.classes[className as keyof Ruleset["classes"]]
  if (!classDef) return []

  const granted: GrantedProficiencies = multiclass
    ? {
        armorProficiencies: classDef.multiclassProficiencies.armor,
        weaponProficiencies: classDef.multiclassProficiencies.weapons,
        toolProficiencies: classDef.multiclassProficiencies.tools,
        languages: classDef.languages,
      }
    : classDef
  const grants = grantsFrom(granted, "class", classDef.name, ruleset.id as RulesetId)
  if (classDef.armorNote) {
    for (const g of grants) if (g.kind === "armor") g.note = classDef.armorNote
  }
  return grants
}

/**
 * The proficiencies a character would have from their origin and classes alone
 * `classOrder` lists the character's classes in the order they took them: the first gets its full
 * set, the others their multiclassing set. The first source to grant a proficiency is kept
 * Used to fill in characters created before proficiencies were tracked
 */
export function defaultProficiencies(
  ruleset: Ruleset,
  origin: { species: string; lineage?: string | null; background: string },
  classOrder: string[]
): ProficiencyGrant[] {
  return uniqueGrants([
    ...originProficiencies(ruleset, origin),
    ...classOrder.flatMap((className, i) =>
      classProficiencies(ruleset, className, { multiclass: i > 0 })
    ),
  ])
}

/**
 * Drop repeated (kind, name) pairs, keeping the first
 */
export function uniqueGrants(grants: ProficiencyGrant[]): ProficiencyGrant[] {
  const seen = new Set<string>()
  return grants.filter((g) => {
    const key = `${g.kind}:${g.name}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * A character's classes in the order they took them, from their levels in the order they gained
 * them
 */
export function classOrder(levels: { class: string }[]): string[] {
  const order: string[] = []
  for (const level of levels) {
    if (!order.includes(level.class)) order.push(level.class)
  }
  return order
}

export interface ProficiencyEvent {
  kind: ProficiencyKind
  name: string
  action: ProficiencyAction
  source: ProficiencySource
  source_detail: string | null
  note: string | null
}

/**
 * The current proficiencies from a character's proficiency history: each (kind, name) whose latest
 * row is an add, described by that row. Sorted by kind, then name
 */
export function currentProficiencies(events: ProficiencyEvent[]): ProficiencyGrant[] {
  const current = new Map<string, ProficiencyGrant>()
  for (const event of events) {
    const key = `${event.kind}:${event.name}`
    if (event.action === "remove") {
      current.delete(key)
    } else {
      current.set(key, {
        kind: event.kind,
        name: event.name,
        source: event.source,
        source_detail: event.source_detail,
        ...(event.note && { note: event.note }),
      })
    }
  }
  return [...current.values()].sort(
    (a, b) =>
      ProficiencyKinds.indexOf(a.kind) - ProficiencyKinds.indexOf(b.kind) ||
      a.name.localeCompare(b.name)
  )
}

// ─── Matching weapons and armor ────────────────────────────────────────────

export interface WeaponLike {
  name: string
  martial: boolean
  finesse: boolean
  light?: boolean
  heavy?: boolean
  two_handed?: boolean
  thrown: boolean
  normal_range: number | null
}

export interface WeaponIdentity {
  /** The standard weapon this item is, e.g. "longsword" for "+1 Longsword"; null for custom weapons */
  baseWeapon: string | null
  martial: boolean
  /** A ranged weapon (bows, darts, nets), as opposed to a melee one, thrown or not */
  ranged: boolean
  finesse: boolean
  light: boolean
  heavy: boolean
  twoHanded: boolean
}

/**
 * Work out which standard weapon an item is, by finding a weapon's name in the item's name
 * The template's category and properties win over the item's; custom weapons keep their own, and
 * count as ranged when they have a range and aren't thrown
 */
export function identifyWeapon(ruleset: RulesetId, item: WeaponLike): WeaponIdentity {
  const found = findWeaponTemplate(ruleset, item.name)
  if (!found) {
    return {
      baseWeapon: null,
      martial: item.martial,
      ranged: !!item.normal_range && !item.thrown,
      finesse: item.finesse,
      light: item.light ?? false,
      heavy: item.heavy ?? false,
      twoHanded: item.two_handed ?? false,
    }
  }
  const t = found.template
  return {
    baseWeapon: found.name,
    martial: t.martial ?? false,
    ranged: found.ranged,
    finesse: t.finesse ?? false,
    light: t.light ?? false,
    heavy: t.heavy ?? false,
    twoHanded: t.two_handed ?? false,
  }
}

/**
 * Whether proficiencies (weapon proficiency names) cover a weapon
 */
export function isProficientWithWeapon(
  weaponProficiencies: string[],
  weapon: WeaponIdentity,
  itemName: string
): boolean {
  const profs = new Set(weaponProficiencies)
  if (weapon.baseWeapon && profs.has(weapon.baseWeapon)) return true
  if (profs.has(cleanName(itemName))) return true
  if (!weapon.martial) return profs.has(SIMPLE_WEAPONS)
  if (profs.has(MARTIAL_WEAPONS)) return true
  if (profs.has(MARTIAL_LIGHT_WEAPONS) && weapon.light) return true
  if (profs.has(MARTIAL_FINESSE_LIGHT_WEAPONS) && (weapon.light || weapon.finesse)) return true
  return false
}

/**
 * Whether a monk can use a weapon with Martial Arts (and so the better of STR and DEX)
 * SRD 5.1: shortswords, and simple melee weapons that are neither two-handed nor heavy
 * SRD 5.2: simple melee weapons, and martial melee weapons with the Light property
 */
export function isMonkWeapon(ruleset: RulesetId, weapon: WeaponIdentity): boolean {
  if (weapon.ranged) return false
  if (ruleset === "srd52") return !weapon.martial || weapon.light
  if (weapon.baseWeapon === "shortsword") return true
  return !weapon.martial && !weapon.twoHanded && !weapon.heavy
}

/**
 * The armor proficiency needed to wear an armor or use a shield, e.g. "medium armor"
 */
export function requiredArmorProficiency(item: {
  category: string
  armor_type: string | null
}): string | null {
  if (item.category === "shield") return "shields"
  if (item.category === "armor" && item.armor_type) return `${item.armor_type} armor`
  return null
}

/**
 * Names to suggest when adding a proficiency by hand
 */
export function proficiencySuggestions(kind: ProficiencyKind, ruleset: RulesetId): string[] {
  switch (kind) {
    case "weapon":
      return [SIMPLE_WEAPONS, MARTIAL_WEAPONS, ...weaponTemplates(ruleset).map((t) => t.name)]
    case "armor":
      return ArmorProficiencyNames
    case "tool":
      return ToolSuggestions
    case "language":
      return LanguageSuggestions
  }
}
