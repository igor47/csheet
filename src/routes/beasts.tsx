import { BeastDetail } from "@src/components/BeastDetail"
import { getBeastById } from "@src/lib/dnd/beasts"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { Hono } from "hono"

export const beastsRoutes = new Hono()

beastsRoutes.get("/beasts/:id", async (c) => {
  const beastId = c.req.param("id")
  const isHtmxRequest = c.req.header("HX-Request") === "true"

  // Get ruleset from query param, default to srd52
  const ruleset = (c.req.query("ruleset") || "srd52") as RulesetId

  // If not HTMX, redirect to beasts list (when we have one)
  if (!isHtmxRequest) {
    // For now, just return the beast detail directly
    const beast = getBeastById(ruleset, beastId)

    if (!beast) {
      return c.text("Beast not found", 404)
    }

    return c.render(<BeastDetail beast={beast} />, { title: beast.name })
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
