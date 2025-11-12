import { spells } from "@src/lib/dnd/spells"
import type { AttackInfo } from "@src/services/castSpell"
import { SpellDetail } from "./SpellDetail"
import { ModalContent } from "./ui/ModalContent"

export interface SpellCastResultProps {
  message: string
  spellId: string
  attackInfo?: AttackInfo
}

export const SpellCastResult = ({ message, spellId, attackInfo }: SpellCastResultProps) => {
  const spell = spells.find((s) => s.id === spellId)

  if (!spell) {
    return (
      <ModalContent title="Spell Cast">
        <div class="modal-body">
          <div class="alert alert-warning">
            Spell was cast successfully, but spell details are not available.
          </div>
          <p>{message}</p>
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
    <ModalContent title="Spell Cast Successfully!">
      <div class="modal-body">
        {/* Success message */}
        <div class="alert alert-success mb-3">
          <i class="bi bi-check-circle-fill me-2"></i>
          {message}
        </div>

        {/* Attack/Combat Results */}
        {attackInfo && (
          <div class="card mb-3">
            <div class="card-header bg-primary text-white">
              <i class="bi bi-lightning-fill me-2"></i>
              <strong>Cast Results</strong>
            </div>
            <div class="card-body">
              {/* Attack bonus for attack spells */}
              {attackInfo.attackBonus !== undefined && (
                <div class="mb-2">
                  <strong>Attack Roll:</strong>{" "}
                  <span class="badge bg-danger fs-6">
                    {attackInfo.attackBonus >= 0 ? "+" : ""}
                    {attackInfo.attackBonus} to hit
                  </span>
                  <span class="text-muted ms-2">(ranged spell attack)</span>
                </div>
              )}

              {/* Save DC for save spells */}
              {attackInfo.saveDC !== undefined && attackInfo.saveAbility && (
                <div class="mb-2">
                  <strong>Saving Throw:</strong>{" "}
                  <span class="badge bg-warning text-dark fs-6">DC {attackInfo.saveDC}</span>
                  <span class="text-muted ms-2">
                    {attackInfo.saveAbility.charAt(0).toUpperCase() +
                      attackInfo.saveAbility.slice(1)}{" "}
                    save
                    {attackInfo.onSaveSuccess && attackInfo.onSaveSuccess !== "none" && (
                      <> ({attackInfo.onSaveSuccess} on success)</>
                    )}
                  </span>
                </div>
              )}

              {/* Damage */}
              {attackInfo.damage && attackInfo.damage.length > 0 && (
                <div class="mb-2">
                  <strong>Damage:</strong>
                  <ul class="mb-0 mt-1">
                    {attackInfo.damage.map((dmg) => (
                      <li>
                        <span class="badge bg-danger me-2">{dmg.formula}</span>
                        <span class="text-capitalize">{dmg.type}</span>
                        {dmg.notes && <span class="text-muted ms-2">({dmg.notes})</span>}
                      </li>
                    ))}
                  </ul>
                  {attackInfo.scalingExplanation && (
                    <div class="text-muted small mt-1">
                      <i class="bi bi-arrow-up-circle me-1"></i>
                      {attackInfo.scalingExplanation}
                    </div>
                  )}
                </div>
              )}

              {/* Healing */}
              {attackInfo.healing && (
                <div class="mb-0">
                  <strong>Healing:</strong>{" "}
                  <span class="badge bg-success fs-6">{attackInfo.healing}</span>
                  <span class="text-muted ms-2">hit points</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spell details with accordion */}
        <SpellDetail spell={spell} compact={true} />
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
