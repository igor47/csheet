import type { ComputedCharacter } from "@src/services/computeCharacter"

export interface RestBlockedNoticeProps {
  character: ComputedCharacter
  rest: "short" | "long"
  reason: string
}

/**
 * Why a character can't rest right now, and what to do about it
 */
export const RestBlockedNotice = ({ character, rest, reason }: RestBlockedNoticeProps) => {
  const isDead = character.deathSaves?.status === "dead"
  const isStable = character.deathSaves?.status === "stable"

  return (
    <div class="alert alert-warning mb-0" role="alert" id="rest-blocked">
      <p class="fw-bold mb-2">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {reason}
      </p>
      {isDead ? (
        <p class="mb-0">
          The dead don't rest. To bring {character.name} back, use <strong>Restore to life</strong>{" "}
          under Death Saves on the character sheet.
        </p>
      ) : (
        <p class="mb-0">
          {character.name} is at 0 HP and unconscious, and a {rest} rest needs at least 1 HP. Heal
          them first with the hit points form
          {isStable
            ? ", or use Regain 1 HP on the sheet once 1d4 hours have passed (a stable character wakes up then)."
            : "; a dying character needs healing or three successful death saves."}
        </p>
      )}
    </div>
  )
}
