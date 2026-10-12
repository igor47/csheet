/**
 * Hand-reviewed mechanics for the SRD 5.1 spell catalog, applied by
 * utils/generate-srd51-spells.ts on top of the SRD 5.2.1 entry (for spells in
 * both editions) or the parse of the 5.1 text (for spells only in 5.1).
 *
 * Each entry was checked against the spell's SRD 5.1 text. Set a field to
 * `undefined` to drop what the 5.2.1 entry had.
 */

import type { Dice, Spell } from "@src/lib/dnd/spells"

/** d(3, 6) is 3d6 */
const d = (count: number, sides: number): Dice => Array(count).fill(sides)

type Mechanics = Partial<
  Pick<
    Spell,
    | "briefDescription"
    | "target"
    | "resolution"
    | "damage"
    | "damageScaling"
    | "healingDice"
    | "tempHPDice"
    | "conditionsInflicted"
    | "tags"
  >
>

export const srd51Overrides: Record<string, Mechanics> = {
  srd_acid_splash: {
    briefDescription:
      "Hurl acid at one creature, or two within 5 feet of each other (Dex save negates)",
    target: { type: "creature", count: 2, selection: "choose" },
  },
  srd_animal_messenger: { resolution: { kind: "none" } },
  srd_animal_shapes: {
    briefDescription: "Transform willing creatures into Large or smaller Beasts (CR 4 or lower)",
  },
  srd_animate_objects: { target: { type: "object", count: 10 } },
  srd_arcane_sword: { damage: [{ type: "force", dice: d(3, 10) }] },
  srd_barkskin: {
    briefDescription:
      "Touch a willing creature; its AC can't be less than 16 while the spell lasts",
  },
  srd_bestow_curse: {
    briefDescription:
      "Curse a creature with disadvantage, lost actions, or extra necrotic damage (Wis save negates)",
  },
  srd_black_tentacles: {
    briefDescription:
      "Fill a 20-foot square with tentacles dealing bludgeoning damage and restraining (Dex save negates)",
    resolution: { kind: "save", ability: "dexterity", onSuccess: "negates" },
  },
  srd_blade_barrier: {
    briefDescription:
      "Create a wall of whirling blades dealing slashing damage, with cover and difficult terrain (Dex save for half)",
    damage: [{ type: "slashing", dice: d(6, 10) }],
  },
  srd_branding_smite: {
    briefDescription:
      "Your next weapon hit deals extra radiant damage and makes the target visible and unable to turn invisible",
    target: { type: "creature", count: 1 },
    resolution: { kind: "none" },
    damage: [{ type: "radiant", dice: d(2, 6), notes: "Extra damage on your next weapon hit" }],
  },
  srd_chill_touch: {
    briefDescription:
      "Ranged spell attack cantrip dealing necrotic damage; the target can't regain hit points until your next turn",
    resolution: { kind: "attack", attackType: "rangedSpell" },
    damage: [{ type: "necrotic", dice: d(1, 8) }],
    damageScaling: {
      mode: "characterLevel",
      progression: { 1: d(1, 8), 5: d(2, 8), 11: d(3, 8), 17: d(4, 8) },
    },
  },
  srd_circle_of_death: { damage: [{ type: "necrotic", dice: d(8, 6) }] },
  srd_color_spray: {
    briefDescription:
      "Blind creatures in a 15-foot cone, lowest hit points first, up to a 6d10 hit point total",
    resolution: { kind: "none" },
  },
  srd_compulsion: {
    briefDescription:
      "Force creatures of your choice to move in a direction you pick each turn (Wis save negates)",
    conditionsInflicted: undefined,
  },
  srd_conjure_animals: {
    briefDescription:
      "Summon fey spirits as beasts: one of CR 2, two of CR 1, four of CR 1/2, or eight of CR 1/4",
    target: { type: "point" },
    resolution: { kind: "none" },
    damage: undefined,
  },
  srd_conjure_celestial: {
    briefDescription: "Summon a friendly celestial of CR 4 or lower that obeys your commands",
    target: { type: "point" },
    resolution: { kind: "none" },
    damage: undefined,
    healingDice: undefined,
  },
  srd_conjure_elemental: {
    briefDescription:
      "Summon an elemental of CR 5 or lower from air, earth, fire, or water; it turns hostile if you lose concentration",
    target: { type: "point" },
    resolution: { kind: "none" },
    damage: undefined,
    conditionsInflicted: undefined,
  },
  srd_conjure_fey: {
    briefDescription:
      "Summon a fey creature or fey beast of CR 6 or lower; it turns hostile if you lose concentration",
    target: { type: "point" },
    resolution: { kind: "none" },
    damage: undefined,
    conditionsInflicted: undefined,
  },
  srd_conjure_minor_elementals: {
    briefDescription:
      "Summon elementals: one of CR 2, two of CR 1, four of CR 1/2, or eight of CR 1/4",
    target: { type: "point" },
    damage: undefined,
  },
  srd_conjure_woodland_beings: {
    briefDescription:
      "Summon fey creatures: one of CR 2, two of CR 1, four of CR 1/2, or eight of CR 1/4",
    target: { type: "point" },
    resolution: { kind: "none" },
    damage: undefined,
  },
  srd_contact_other_plane: {
    briefDescription:
      "Ask a planar entity 5 questions; a failed DC 15 Int save deals psychic damage and causes insanity",
  },
  srd_contagion: {
    briefDescription:
      "Melee spell attack that infects a creature with a disease of your choice (Con saves over several turns)",
    resolution: { kind: "attack", attackType: "meleeSpell" },
    damage: undefined,
    conditionsInflicted: undefined,
  },
  srd_counterspell: {
    briefDescription:
      "Reaction to stop a spell of 3rd level or lower; higher levels need a spellcasting check (DC 10 + spell level)",
    resolution: { kind: "none" },
  },
  srd_cure_wounds: {
    briefDescription: "Touch to heal 1d8 + spellcasting modifier HP",
    healingDice: d(1, 8),
  },
  srd_darkvision: { briefDescription: "Grant a willing creature 60-foot darkvision for 8 hours" },
  srd_detect_evil_and_good: {
    briefDescription:
      "Sense aberrations, celestials, elementals, fey, fiends, undead, and consecrated places within 30 feet",
  },
  srd_enthrall: {
    briefDescription:
      "Creatures that fail a Wis save have disadvantage on Perception checks to notice anyone but you",
  },
  srd_faithful_hound: {
    briefDescription:
      "Conjure an invisible watchdog that barks at intruders and bites hostile creatures near it",
    resolution: { kind: "none" },
    damage: [{ type: "piercing", dice: d(4, 8), notes: "Hound's bite, on a hit" }],
  },
  srd_false_life: {
    briefDescription: "Gain 1d4 + 4 temporary hit points for 1 hour",
    tempHPDice: d(1, 4),
  },
  srd_feeblemind: {
    briefDescription:
      "Deal psychic damage and shatter a creature's mind, making its Int and Cha 1 (Int save negates the rest)",
    target: { type: "creature", count: 1 },
    resolution: { kind: "save", ability: "intelligence", onSuccess: "partial" },
    damage: [{ type: "psychic", dice: d(4, 6), notes: "Whether or not the save succeeds" }],
  },
  srd_flame_strike: {
    damage: [
      { type: "fire", dice: d(4, 6) },
      { type: "radiant", dice: d(4, 6) },
    ],
  },
  srd_foresight: {
    briefDescription:
      "A willing creature has advantage on attacks, checks, and saves, and can't be surprised; others have disadvantage against it",
  },
  srd_giant_insect: {
    briefDescription:
      "Turn up to ten centipedes, three spiders, five wasps, or one scorpion into giant versions that obey you",
    target: { type: "special", text: "Centipedes, spiders, wasps, or a scorpion within range" },
  },
  srd_guidance: { briefDescription: "A willing creature adds 1d4 to one ability check" },
  srd_heal: {
    briefDescription: "Restore 70 HP and end blindness, deafness, and diseases",
  },
  srd_healing_word: {
    briefDescription:
      "Bonus action to heal a creature you can see for 1d4 + spellcasting modifier HP",
    healingDice: d(1, 4),
  },
  "srd_hunter’s_mark": {
    briefDescription:
      "Mark a creature: your weapon hits deal it an extra 1d6 damage, and you have advantage on checks to find it",
    damage: undefined,
  },
  srd_ice_storm: {
    damage: [
      { type: "bludgeoning", dice: d(2, 8) },
      { type: "cold", dice: d(4, 6) },
    ],
  },
  srd_inflict_wounds: {
    briefDescription: "Melee spell attack dealing heavy necrotic damage",
    resolution: { kind: "attack", attackType: "meleeSpell" },
    damage: [{ type: "necrotic", dice: d(3, 10) }],
  },
  srd_irresistible_dance: {
    briefDescription:
      "Force a creature to dance: disadvantage on Dex saves and attacks, and attacks against it have advantage (Wis save on its turn ends it)",
    resolution: { kind: "none" },
    conditionsInflicted: undefined,
  },
  srd_jump: { briefDescription: "Triple a creature's jump distance for 1 minute" },
  srd_mass_cure_wounds: {
    briefDescription:
      "Heal up to 6 creatures in a 30-foot radius for 3d8 + spellcasting modifier HP each",
    healingDice: d(3, 8),
  },
  srd_mass_heal: {
    briefDescription:
      "Restore up to 700 HP divided among creatures you can see, curing diseases, blindness, and deafness",
  },
  srd_mass_healing_word: {
    briefDescription:
      "Bonus action to heal up to 6 creatures for 1d4 + spellcasting modifier HP each",
    healingDice: d(1, 4),
  },
  srd_mass_suggestion: {
    briefDescription:
      "Influence up to 12 creatures to follow a reasonable suggestion for 24 hours (Wis save negates)",
    conditionsInflicted: undefined,
  },
  srd_phantasmal_killer: {
    briefDescription:
      "Frighten a creature with its worst fears; it takes psychic damage each turn until it succeeds on a Wis save",
    resolution: { kind: "save", ability: "wisdom", onSuccess: "negates" },
    conditionsInflicted: ["frightened"],
  },
  srd_poison_spray: {
    briefDescription: "Cantrip: a creature takes poison damage unless it succeeds on a Con save",
    resolution: { kind: "save", ability: "constitution", onSuccess: "negates" },
  },
  srd_power_word_kill: {
    briefDescription: "A creature you can see with 100 hit points or fewer dies instantly",
    damage: undefined,
  },
  srd_prayer_of_healing: {
    briefDescription: "Heal up to 6 creatures for 2d8 + spellcasting modifier HP each",
    target: { type: "creature", count: 6, selection: "choose", friendlyOnly: true },
  },
  srd_prismatic_spray: {
    damage: [
      { type: "fire", dice: d(10, 6), notes: "Red ray" },
      { type: "acid", dice: d(10, 6), notes: "Orange ray" },
      { type: "lightning", dice: d(10, 6), notes: "Yellow ray" },
      { type: "poison", dice: d(10, 6), notes: "Green ray" },
      { type: "cold", dice: d(10, 6), notes: "Blue ray" },
    ],
  },
  srd_prismatic_wall: {
    // each layer's damage is halved on a successful save
    resolution: { kind: "save", ability: "dexterity", onSuccess: "half" },
    damage: [
      { type: "fire", dice: d(10, 6), notes: "Red layer" },
      { type: "acid", dice: d(10, 6), notes: "Orange layer" },
      { type: "lightning", dice: d(10, 6), notes: "Yellow layer" },
      { type: "poison", dice: d(10, 6), notes: "Green layer" },
      { type: "cold", dice: d(10, 6), notes: "Blue layer" },
    ],
  },
  srd_ray_of_enfeeblement: {
    briefDescription:
      "Ranged spell attack: the target deals half damage with Strength weapon attacks (Con save each turn ends it)",
    resolution: { kind: "attack", attackType: "rangedSpell" },
  },
  srd_resistance: { briefDescription: "A willing creature adds 1d4 to one saving throw" },
  srd_shillelagh: {
    briefDescription:
      "Your club or quarterstaff uses your spellcasting ability and a d8 damage die, and becomes magical",
  },
  srd_silent_image: {
    briefDescription: "Create a purely visual illusion up to a 15-foot cube that you can move",
  },
  srd_sleep: {
    briefDescription:
      "Put creatures within 20 feet of a point to sleep, lowest hit points first, up to a 5d8 hit point total",
    target: { type: "area", area: { shape: "sphere", radius: 20, origin: "point" } },
    resolution: { kind: "none" },
    conditionsInflicted: ["unconscious"],
  },
  srd_sleet_storm: {
    briefDescription:
      "Create a 40-foot radius sleet storm: heavily obscured, difficult terrain, knocks prone (Dex save negates)",
    target: { type: "area", area: { shape: "cylinder", radius: 40, height: 20, origin: "point" } },
  },
  srd_stinking_cloud: {
    briefDescription:
      "Create a 20-foot radius cloud of nauseating gas; creatures in it waste their action (Con save negates)",
    conditionsInflicted: undefined,
  },
  srd_storm_of_vengeance: {
    briefDescription:
      "Create a 360-foot radius storm with escalating effects: thunder, acid rain, lightning, hail, and freezing rain",
    target: { type: "area", area: { shape: "sphere", radius: 360, origin: "point" } },
    resolution: { kind: "save", ability: "constitution", onSuccess: "negates" },
    damage: [
      { type: "thunder", dice: d(2, 6), notes: "When the cloud appears" },
      { type: "acid", dice: d(1, 6), notes: "Round 2" },
      { type: "lightning", dice: d(10, 6), notes: "Round 3, Dex save for half" },
      { type: "bludgeoning", dice: d(2, 6), notes: "Round 4" },
      { type: "cold", dice: d(1, 6), notes: "Rounds 5-10" },
    ],
  },
  srd_suggestion: {
    briefDescription: "Influence a creature to follow a reasonable suggestion (Wis save negates)",
    conditionsInflicted: undefined,
  },
  srd_telekinesis: {
    briefDescription:
      "Move or restrain creatures and objects with your mind (contested by the creature's Strength check)",
    resolution: { kind: "none" },
  },
  srd_true_strike: {
    briefDescription: "Gain advantage on your first attack roll against a target on your next turn",
    resolution: { kind: "none" },
    damage: undefined,
  },
  srd_vicious_mockery: {
    damage: [{ type: "psychic", dice: d(1, 4) }],
    damageScaling: {
      mode: "characterLevel",
      progression: { 1: d(1, 4), 5: d(2, 4), 11: d(3, 4), 17: d(4, 4) },
    },
  },
  srd_weird: {
    briefDescription:
      "Frighten creatures in a 30-foot radius; they take psychic damage each turn until they succeed on a Wis save",
    resolution: { kind: "save", ability: "wisdom", onSuccess: "negates" },
    damage: [
      { type: "psychic", dice: d(4, 10), notes: "Each turn while frightened, on a failed save" },
    ],
  },
  srd_wind_wall: { damage: [{ type: "bludgeoning", dice: d(3, 8) }] },
  srd_antipathy_sympathy: { conditionsInflicted: ["frightened"] },
  srd_arcane_hand: {
    briefDescription:
      "Create a Large hand of force that can punch, push, grapple and crush, or shield you",
    resolution: { kind: "attack", attackType: "meleeSpell" },
    damage: [
      { type: "force", dice: d(4, 8), notes: "Clenched Fist, on a hit" },
      { type: "bludgeoning", dice: d(2, 6), notes: "Grasping Hand crush, + spellcasting modifier" },
    ],
  },
  srd_eyebite: {
    briefDescription:
      "Each turn, make a creature you can see fall asleep, panic, or sicken with disadvantage on attacks and checks (Wis save negates)",
    conditionsInflicted: ["unconscious", "frightened"],
  },
  srd_freezing_sphere: { conditionsInflicted: undefined },
  srd_heat_metal: {
    // the damage always lands; the save only decides whether the creature drops the object
    resolution: { kind: "save", ability: "constitution", onSuccess: "partial" },
  },
  srd_planar_binding: { conditionsInflicted: undefined },
  // suspended animation isn't the Unconscious condition
  srd_sequester: { conditionsInflicted: ["invisible"] },
  // "can't move or take actions" afterwards, not the Incapacitated condition
  srd_haste: { conditionsInflicted: undefined },
}

/**
 * Spells where the generator's checks of the 5.1 text disagree with the 5.2.1
 * mechanics or brief, but a review found them right for 5.1 as well (the
 * parse picked up a side effect, an incidental save, or a self-inflicted
 * mishap; the brief says "d4" as "1d4"). The generator's --report skips these.
 */
export const srd51Reviewed = new Set([
  "srd_antipathy_sympathy",
  "srd_bane",
  "srd_bestow_curse",
  "srd_bless",
  "srd_blink",
  "srd_contact_other_plane",
  "srd_mass_cure_wounds",
  "srd_silent_image",
  "srd_wind_walk",
  "srd_word_of_recall",
  "srd_beacon_of_hope",
  "srd_control_water",
  "srd_create_or_destroy_water",
  "srd_darkness",
  "srd_daylight",
  "srd_delayed_blast_fireball",
  "srd_detect_thoughts",
  "srd_dimension_door",
  "srd_dispel_evil_and_good",
  "srd_dream",
  "srd_druidcraft",
  "srd_earthquake",
  "srd_fabricate",
  "srd_flesh_to_stone",
  "srd_forbiddance",
  "srd_gaseous_form",
  "srd_glyph_of_warding",
  "srd_guardian_of_faith",
  "srd_hallow",
  "srd_haste",
  "srd_heroes’_feast",
  "srd_holy_aura",
  "srd_light",
  "srd_magic_circle",
  "srd_meld_into_stone",
  "srd_minor_illusion",
  "srd_plane_shift",
  "srd_regenerate",
  "srd_sanctuary",
  "srd_slow",
  "srd_spirit_guardians",
  "srd_spiritual_weapon",
  "srd_symbol",
  "srd_teleport",
  "srd_wall_of_ice",
  "srd_wall_of_stone",
  "srd_web",
  "srd_wish",
])
