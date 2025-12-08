import { ModalBody, ModalContent, ModalFooter } from "@src/components/ui/DetailModal"
import clsx from "clsx"

export interface CampaignInviteFormProps {
  campaignId: string
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const CampaignInviteForm = ({
  campaignId,
  values = {},
  errors = {},
}: CampaignInviteFormProps) => (
  <ModalContent title="Invite Member">
    <form
      hx-post={`/campaigns/${campaignId}/invite`}
      hx-swap="innerHTML"
      hx-target="#detailModalContent"
    >
      <ModalBody>
        {/* General error */}
        {errors.general && (
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle"></i> {errors.general}
          </div>
        )}

        <div class="mb-3">
          <label for="invite-email" class="form-label">
            Email Address
          </label>
          <input
            type="email"
            class={clsx("form-control", { "is-invalid": errors.email })}
            id="invite-email"
            name="email"
            value={values.email || ""}
            placeholder="player@example.com"
            required
          />
          {errors.email && <div class="invalid-feedback d-block">{errors.email}</div>}
          {!errors.email && (
            <div class="form-text">An invitation email will be sent to this address.</div>
          )}
        </div>

        {errors._canReinvite && (
          <div class="mb-3 form-check">
            <input
              type="checkbox"
              class="form-check-input"
              id="force-reinvite"
              name="forceReinvite"
            />
            <label class="form-check-label" for="force-reinvite">
              Send new invitation
            </label>
          </div>
        )}

        <div class="mb-3">
          <label for="invite-role" class="form-label">
            Role
          </label>
          <select
            class={clsx("form-select", { "is-invalid": errors.role })}
            id="invite-role"
            name="role"
            required
          >
            <option value="player" selected={values.role === "player" || !values.role}>
              Player
            </option>
            <option value="dm" selected={values.role === "dm"}>
              Dungeon Master
            </option>
            <option value="viewer" selected={values.role === "viewer"}>
              Viewer
            </option>
          </select>
          {errors.role && <div class="invalid-feedback d-block">{errors.role}</div>}
          {!errors.role && (
            <div class="form-text">
              Players can add characters. DMs can manage the campaign. Viewers can only observe.
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary">
          <i class="bi bi-envelope"></i> Send Invitation
        </button>
      </ModalFooter>
    </form>
  </ModalContent>
)
