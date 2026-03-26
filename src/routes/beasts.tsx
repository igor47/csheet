import { BeastDetail } from "@src/components/BeastDetail"
import { Beasts } from "@src/components/Beasts"
import { BeastsTable } from "@src/components/BeastsTable"
import type { SizeType } from "@src/lib/dnd"
import { getBeastById, getBeasts } from "@src/lib/dnd/beasts"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { Hono } from "hono"

export const beastsRoutes = new Hono()

const SIZE_ORDER: Record<SizeType, number> = {
  tiny: 0,
  small: 1,
  medium: 2,
  large: 3,
  huge: 4,
  gargantuan: 5,
}

function normalizeRuleset(value: string | undefined): RulesetId {
  return value === "srd52" ? "srd52" : "srd51"
}

beastsRoutes.get("/beasts", async (c) => {
  const ruleset = normalizeRuleset(c.req.query("ruleset"))
  const sizeFilter = c.req.query("size") as SizeType | undefined
  const maxCRStr = c.req.query("maxCR")
  const maxCR = maxCRStr ? Number.parseFloat(maxCRStr) : undefined
  const movementFilter = c.req.query("movement")
  const searchQuery = c.req.query("search")
  const sortBy = c.req.query("sortBy") || "cr"
  const sortOrder = c.req.query("sortOrder") || "asc"
  const openBeastId = c.req.query("openBeast")

  let filteredBeasts = [...getBeasts(ruleset)]

  if (sizeFilter) {
    filteredBeasts = filteredBeasts.filter((b) => b.size === sizeFilter)
  }

  if (maxCR !== undefined && !Number.isNaN(maxCR)) {
    filteredBeasts = filteredBeasts.filter((b) => b.cr <= maxCR)
  }

  if (movementFilter) {
    filteredBeasts = filteredBeasts.filter((b) => {
      switch (movementFilter) {
        case "swim":
          return b.speed.swim
        case "fly":
          return b.speed.fly
        case "climb":
          return b.speed.climb
        case "burrow":
          return b.speed.burrow
        default:
          return true
      }
    })
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase()
    filteredBeasts = filteredBeasts.filter((b) => b.name.toLowerCase().includes(query))
  }

  filteredBeasts.sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "cr":
        comparison = a.cr - b.cr
        break
      case "size":
        comparison = (SIZE_ORDER[a.size] ?? 0) - (SIZE_ORDER[b.size] ?? 0)
        break
      default:
        comparison = a.cr - b.cr
    }
    return sortOrder === "desc" ? -comparison : comparison
  })

  const isHtmxRequest = c.req.header("HX-Request") === "true"

  if (isHtmxRequest) {
    return c.html(
      <>
        <input type="hidden" id="beastSortBy" name="sortBy" value={sortBy} hx-swap-oob="true" />
        <input
          type="hidden"
          id="beastSortOrder"
          name="sortOrder"
          value={sortOrder}
          hx-swap-oob="true"
        />
        <BeastsTable
          beasts={filteredBeasts}
          sortBy={sortBy}
          sortOrder={sortOrder}
          selectedRuleset={ruleset}
          selectedSize={sizeFilter}
          selectedMaxCR={maxCRStr}
          selectedMovement={movementFilter}
          searchQuery={searchQuery}
        />
      </>
    )
  }

  // Strip invalid openBeast param by redirecting without it
  const openBeast = openBeastId ? getBeasts(ruleset).find((b) => b.id === openBeastId) : undefined
  if (openBeastId && !openBeast) {
    const params = new URLSearchParams(c.req.query())
    params.delete("openBeast")
    return c.redirect(`/beasts?${params.toString()}`)
  }

  return c.render(
    <Beasts
      beasts={filteredBeasts}
      selectedRuleset={ruleset}
      selectedSize={sizeFilter}
      selectedMaxCR={maxCRStr}
      selectedMovement={movementFilter}
      searchQuery={searchQuery}
      sortBy={sortBy}
      sortOrder={sortOrder}
      openBeast={openBeast}
    />,
    { title: "Beasts" }
  )
})

beastsRoutes.get("/beasts/:id", async (c) => {
  const beastId = c.req.param("id")
  const isHtmxRequest = c.req.header("HX-Request") === "true"

  const ruleset = normalizeRuleset(c.req.query("ruleset"))

  if (!isHtmxRequest) {
    return c.redirect(`/beasts?openBeast=${beastId}&ruleset=${ruleset}`)
  }

  // Find beast by ID
  const beast = getBeastById(ruleset, beastId)

  if (!beast) {
    return c.html(
      <>
        <div class="modal-header">
          <h5 class="modal-title">Beast Not Found</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">The beast with ID "{beastId}" could not be found.</div>
        </div>
      </>
    )
  }

  return c.html(<BeastDetail beast={beast} />)
})
