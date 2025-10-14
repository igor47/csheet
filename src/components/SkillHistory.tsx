import type { CharSkill } from "@src/db/char_skills"
import type { ProficiencyLevel } from "@src/lib/dnd"

export interface SkillHistoryProps {
  skill: string
  events: CharSkill[]
}

export const SkillHistory = ({ skill, events }: SkillHistoryProps) => {
  const getProficiencyIcon = (proficiency: ProficiencyLevel): string => {
    switch (proficiency) {
      case "none":
        return "bi-circle"
      case "half":
        return "bi-circle-half"
      case "proficient":
        return "bi-circle-fill"
      case "expert":
        return "bi-brightness-high-fill"
    }
  }

  const getProficiencyLabel = (proficiency: ProficiencyLevel): string => {
    switch (proficiency) {
      case "none":
        return "None"
      case "half":
        return "Half Proficiency"
      case "proficient":
        return "Proficient"
      case "expert":
        return "Expert"
    }
  }

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">{skill.charAt(0).toUpperCase() + skill.slice(1)} History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No skill history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Proficiency</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  return (
                    <tr key={event.id}>
                      <td>
                        <small class="text-muted">
                          {new Date(event.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <i class={`bi ${getProficiencyIcon(event.proficiency)} me-1`}></i>
                        {getProficiencyLabel(event.proficiency)}
                      </td>
                      <td>{event.note || <span class="text-muted">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </>
  )
}
