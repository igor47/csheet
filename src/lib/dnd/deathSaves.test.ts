import { describe, expect, test } from "bun:test"
import { applyDeathSaveEvent, computeHitPoints, freshDeathSaves } from "./deathSaves"

describe("death saves", () => {
  const stable = { status: "stable" as const, successes: 0, failures: 0 }

  test("a stable character makes no successes", () => {
    expect(applyDeathSaveEvent(stable, { kind: "success", amount: 1 })).toEqual(stable)
  })

  test("a failure while stable (from damage) starts them dying again", () => {
    expect(applyDeathSaveEvent(stable, { kind: "failure", amount: 1 })).toEqual({
      status: "dying",
      successes: 0,
      failures: 1,
    })
  })

  test("nothing but coming back up undoes death", () => {
    const dead = { status: "dead" as const, successes: 0, failures: 3 }
    for (const kind of ["down", "success", "stable"] as const) {
      expect(applyDeathSaveEvent(dead, { kind, amount: 1 })).toEqual(dead)
    }
  })

  test("HP is never below 0", () => {
    expect(computeHitPoints([], -6)).toEqual({ currentHP: 0, deathSaves: freshDeathSaves() })
  })

  test("a character who is down is at 0 HP whatever their HP adds up to", () => {
    expect(computeHitPoints([{ kind: "down", amount: 0 }], 6)).toEqual({
      currentHP: 0,
      deathSaves: freshDeathSaves(),
    })
  })
})
