import { Select } from "@src/components/ui/Select"
import {
  BackgroundNames,
  Classes,
  ClassNames,
  type ClassNameType,
  RaceNames,
  Races,
} from "@src/lib/dnd"
import { toTitleCase } from "@src/lib/strings"
import clsx from "clsx"

export interface CharacterNewProps {
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const CharacterNew = ({ values, errors }: CharacterNewProps) => {
  const fields = [
    <div class="mb-3">
      <label for="name" class="form-label">
        Character Name
      </label>
      <input
        type="text"
        class={clsx("form-control", { "is-invalid": errors?.name })}
        id="name"
        name="name"
        value={values?.name || ""}
        required
        placeholder="Enter character name"
      />
      {errors?.name && <div class="invalid-feedback d-block">{errors.name}</div>}
    </div>,
    <div class="mb-3">
      <label for="race" class="form-label">
        Race
      </label>
      <Select
        name="race"
        id="race"
        options={RaceNames.map((race) => ({ value: race, label: toTitleCase(race) }))}
        placeholder="Select a race"
        required
        error={errors?.race}
        value={values?.race}
      />
    </div>,
  ]

  const selectedRace = values?.race ? Races.find((r) => r.name === values.race) : null
  const subraces = selectedRace?.subraces || []
  const subracePlh =
    subraces.length > 0
      ? "Select a subrace"
      : selectedRace
        ? "No subraces available"
        : "Select a race first"
  fields.push(
    <div class="mb-3">
      <label for="subrace" class="form-label">
        Subrace
      </label>
      <Select
        name="subrace"
        id="subrace"
        options={subraces.map((subrace) => ({
          value: subrace.name,
          label: toTitleCase(subrace.name),
        }))}
        placeholder={subracePlh}
        required
        error={errors?.subrace}
        value={values?.subrace}
        disabled={subraces.length === 0}
      />
    </div>
  )

  fields.push(
    <div class="mb-3">
      <label for="class" class="form-label">
        Class
      </label>
      <Select
        name="class"
        id="class"
        options={ClassNames.map((cls) => ({ value: cls, label: toTitleCase(cls) }))}
        placeholder="Select a class"
        required
        error={errors?.class}
        value={values?.class}
      />
    </div>
  )

  const selectedClass = Classes[values?.class as ClassNameType] || null
  const subclasses =
    selectedClass && selectedClass.subclassLevel === 1 ? selectedClass.subclasses : []
  const subclassPlh = selectedClass
    ? selectedClass.subclassLevel === 1
      ? "Select a subclass"
      : `Subclasses available at level ${selectedClass.subclassLevel}`
    : "Select a class first"
  fields.push(
    <div class="mb-3">
      <label for="subclass" class="form-label">
        Subclass
      </label>
      <Select
        name="subclass"
        id="subclass"
        options={subclasses.map((subcls) => ({ value: subcls, label: toTitleCase(subcls) }))}
        placeholder={subclassPlh}
        error={errors?.subclass}
        value={values?.subclass}
        disabled={subclasses.length === 0}
      />
    </div>
  )

  fields.push(
    <div class="mb-3">
      <label for="background" class="form-label">
        Background
      </label>
      <Select
        name="background"
        id="background"
        options={BackgroundNames.map((bg) => ({ value: bg, label: toTitleCase(bg) }))}
        placeholder="Select a background"
        required
        error={errors?.background}
        value={values?.background}
      />
    </div>
  )

  fields.push(
    <div class="mb-3">
      <label for="alignment" class="form-label">
        Alignment (Optional)
      </label>
      <Select
        name="alignment"
        id="alignment"
        options={[
          { value: "Lawful Good", label: "Lawful Good" },
          { value: "Neutral Good", label: "Neutral Good" },
          { value: "Chaotic Good", label: "Chaotic Good" },
          { value: "Lawful Neutral", label: "Lawful Neutral" },
          { value: "True Neutral", label: "True Neutral" },
          { value: "Chaotic Neutral", label: "Chaotic Neutral" },
          { value: "Lawful Evil", label: "Lawful Evil" },
          { value: "Neutral Evil", label: "Neutral Evil" },
          { value: "Chaotic Evil", label: "Chaotic Evil" },
        ]}
        placeholder="Select alignment"
        error={errors?.alignment}
        value={values?.alignment}
      />
    </div>
  )

  return (
    <div class="container mt-5" id="character-new">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow-sm">
            <div class="card-body">
              <h1 class="card-title mb-4">Create New Character</h1>
              <form
                hx-post="/characters/new/check"
                hx-trigger="change delay:300ms"
                hx-target="#character-new"
                hx-swap="outerHTML"
                class="needs-validation"
                novalidate
              >
                {fields.map((field) => field)}

                <div class="d-flex gap-2">
                  <button type="submit" hx-post="/characters/new" class="btn btn-primary">
                    Create Character
                  </button>
                  <a href="/characters" class="btn btn-secondary">
                    Cancel
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
