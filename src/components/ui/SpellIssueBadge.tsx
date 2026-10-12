import { KEPT_FROM_BEFORE, type SpellIssue } from "@src/lib/dnd/spellIssues"

export interface SpellIssueBadgeProps {
  issue: SpellIssue
  /** On a character sheet, also explain why the spell is still there */
  onSheet?: boolean
}

/** Flags a spell that's from the other ruleset, or not on its class's list in this one */
export const SpellIssueBadge = ({ issue, onSheet }: SpellIssueBadgeProps) => (
  <span
    class="badge text-bg-warning ms-1 spell-issue-badge"
    data-bs-toggle="tooltip"
    data-bs-placement="top"
    title={onSheet ? `${issue.reason} ${KEPT_FROM_BEFORE}` : issue.reason}
  >
    {issue.label}
  </span>
)
