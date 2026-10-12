import { describe, expect, test } from "bun:test"
import { identifyWeapon, invalidProficiencyReason, normalizeProficiencyName } from "./proficiencies"

describe("normalizeProficiencyName", () => {
  const weapon = (name: string) => normalizeProficiencyName("weapon", name, "srd51")

  test("expands weapon categories", () => {
    expect(weapon("Simple")).toBe("simple weapons")
    expect(weapon("martial weapon")).toBe("martial weapons")
    expect(weapon("Martial Weapons (Light)")).toBe("martial weapons (light)")
    expect(weapon("martial light weapons")).toBe("martial weapons (light)")
  })

  test("leaves names that only start with a category alone", () => {
    expect(weapon("Martial Arts")).toBe("martial arts")
    expect(weapon("simpleton's club")).toBe("simpleton's club")
  })

  test("matches standard weapons however they're spaced or pluralized", () => {
    expect(weapon("Longswords")).toBe("longsword")
    expect(weapon("Short Sword")).toBe("shortsword")
    expect(weapon("Hand Axe")).toBe("handaxe")
    expect(weapon("War hammer")).toBe("warhammer")
    expect(weapon("Crossbow, hand")).toBe("hand crossbow")
    expect(weapon("Crossbow")).toBe("light crossbow")
    expect(weapon("Crossbows")).toBe("crossbows")
  })

  test("keeps custom weapon names", () => {
    expect(weapon("Longsword of Flame")).toBe("longsword of flame")
  })

  test("normalizes armor", () => {
    expect(normalizeProficiencyName("armor", "Light Armour", "srd51")).toBe("light armor")
    expect(normalizeProficiencyName("armor", "shield", "srd51")).toBe("shields")
  })
})

describe("normalizing tools and languages", () => {
  test("ignores apostrophes and case, snapping to the usual spelling", () => {
    expect(normalizeProficiencyName("tool", "thieves tools", "srd51")).toBe("thieves' tools")
    expect(normalizeProficiencyName("tool", "Thieves Tools", "srd51")).toBe("thieves' tools")
    expect(normalizeProficiencyName("language", "Thieves Cant", "srd51")).toBe("thieves' cant")
    expect(normalizeProficiencyName("tool", "Bagpipes", "srd51")).toBe("bagpipes")
  })

  test("keeps names it doesn't know", () => {
    expect(normalizeProficiencyName("tool", "Theives' tools", "srd51")).toBe("theives' tools")
  })
})

describe("invalidProficiencyReason", () => {
  test("rejects weapon groupings the rules don't have", () => {
    expect(invalidProficiencyReason("weapon", "simple melee weapons")).toContain(
      "Weapon categories are simple weapons, martial weapons"
    )
    expect(invalidProficiencyReason("weapon", "bows")).toContain("name each weapon")
  })

  test("accepts categories, weapons, and custom weapons", () => {
    for (const name of ["simple weapons", "martial weapons (light)", "longbow", "boomstick"]) {
      expect(invalidProficiencyReason("weapon", name)).toBeNull()
    }
  })

  test("rejects names of the wrong kind", () => {
    expect(invalidProficiencyReason("weapon", "shields")).toContain("is an armor proficiency")
    expect(invalidProficiencyReason("tool", "simple weapons")).toContain("is a weapon proficiency")
  })
})

describe("identifyWeapon", () => {
  const item = (name: string, extra = {}) => ({
    name,
    martial: false,
    finesse: false,
    thrown: false,
    normal_range: null,
    ...extra,
  })

  test("finds the standard weapon in an item's name", () => {
    expect(identifyWeapon("srd51", item("+1 Short Sword")).baseWeapon).toBe("shortsword")
    expect(identifyWeapon("srd51", item("Greatclub")).baseWeapon).toBe("greatclub")
    expect(identifyWeapon("srd51", item("Spiked Bayonet")).baseWeapon).toBeNull()
  })

  test("treats nets and darts as ranged, and daggers as melee, though all are thrown", () => {
    const thrown = { thrown: true, normal_range: 5 }
    expect(identifyWeapon("srd51", item("Net", thrown)).ranged).toBe(true)
    expect(identifyWeapon("srd51", item("Dart", thrown)).ranged).toBe(true)
    expect(identifyWeapon("srd51", item("Dagger", thrown)).ranged).toBe(false)
  })

  test("goes by range for custom weapons", () => {
    expect(identifyWeapon("srd51", item("Boomstick", { normal_range: 30 })).ranged).toBe(true)
    expect(
      identifyWeapon("srd51", item("Boomerang", { normal_range: 30, thrown: true })).ranged
    ).toBe(false)
  })
})
