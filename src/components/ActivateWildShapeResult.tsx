import { BeastDetail } from "@src/components/BeastDetail"
import { ModalContent } from "@src/components/ui/DetailModal"
import { getBeastById } from "@src/lib/dnd/beasts"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import type { ActivateWildShapeSummary } from "@src/services/activateWildShape"

export interface ActivateWildShapeResultProps {
  summary: ActivateWildShapeSummary
  ruleset: RulesetId
}

export const ActivateWildShapeResult = ({ summary, ruleset }: ActivateWildShapeResultProps) => {
  const beast = getBeastById(ruleset, summary.beastId)

  if (!beast) {
    return (
      <ModalContent title="Transformation Started">
        <div class="modal-body">
          <div class="alert alert-success">
            <i class="bi bi-check-circle-fill me-2"></i>
            You have transformed into {summary.beastName}!
          </div>
          <p class="text-muted">Wild Shape uses remaining: {summary.usesRemaining}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
            Close
          </button>
        </div>
      </ModalContent>
    )
  }

  return (
    <ModalContent title="Transformation Started!">
      <div class="modal-body">
        {/* Success message */}
        <div class="alert alert-success mb-3">
          <i class="bi bi-check-circle-fill me-2"></i>
          You have transformed into <strong>{beast.name}</strong>!
        </div>

        {/* Key stats card */}
        <div class="card mb-3">
          <div class="card-header bg-success text-white">
            <i class="bi bi-arrow-repeat me-2"></i>
            <strong>Beast Form Stats</strong>
          </div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-4">
                <div class="fw-bold fs-4">{beast.hitPoints}</div>
                <div class="text-muted small">Hit Points</div>
              </div>
              <div class="col-4">
                <div class="fw-bold fs-4">{beast.ac}</div>
                <div class="text-muted small">Armor Class</div>
              </div>
              <div class="col-4">
                <div class="fw-bold fs-4">{beast.speed.walk || 0}</div>
                <div class="text-muted small">Speed (ft)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Uses remaining */}
        <div class="alert alert-info">
          <i class="bi bi-lightning-charge me-2"></i>
          <strong>Wild Shape uses remaining:</strong> {summary.usesRemaining}
        </div>

        {/* Beast details with accordion */}
        <BeastDetail beast={beast} compact={true} />
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
          <i class="bi bi-check-lg me-1"></i>
          Close
        </button>
      </div>
    </ModalContent>
  )
}
