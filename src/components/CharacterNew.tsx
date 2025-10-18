import { Select } from "@src/components/ui/Select"
import { ClassNames, type ClassNameType, getTraits, type Trait } from "@src/lib/dnd"
import { getRuleset, RULESETS, type RulesetId } from "@src/lib/dnd/rulesets"
import { toTitleCase } from "@src/lib/strings"
import clsx from "clsx"

export interface CharacterNewProps {
  values?: Record<string, string>
  errors?: Record<string, string>
}

interface TraitListProps {
  traits: Trait[]
  title: string
}

const TraitList = ({ traits, title }: TraitListProps) => {
  if (traits.length === 0) {
    return null
  }

  return (
    <div class="alert alert-light mx-1 mt-1">
      <h6 class="mb-2">{title}</h6>
      <ul class="list-group">
        {traits.map((trait) => (
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <h6 class="mb-0">{trait.name}</h6>
              {trait.level && <span class="badge bg-primary">Level {trait.level}</span>}
            </div>
            <p class="mb-0 text-muted">{trait.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const CharacterNew = ({ values, errors }: CharacterNewProps) => {
  // Get ruleset based on selection, default to first ruleset
  const rulesetId = (values?.ruleset as RulesetId) || RULESETS[0]!.id
  const ruleset = getRuleset(rulesetId)
  const speciesNames = ruleset.species.map((s) => s.name)
  const backgroundNames = Object.keys(ruleset.backgrounds)

  // build separate trait lists for display
  const speciesTraits: Trait[] = values?.species
    ? getTraits(ruleset, { species: values.species, lineage: values?.lineage })
    : []
  const backgroundTraits: Trait[] = values?.background
    ? getTraits(ruleset, { background: values.background })
    : []
  const classTraits: Trait[] = values?.class
    ? getTraits(ruleset, {
        className: values.class as ClassNameType,
        subclass: values?.subclass,
      })
    : []

  const fields = [
    <div class="mb-3">
      <label for="ruleset" class="form-label">
        Ruleset
      </label>
      <Select
        name="ruleset"
        id="ruleset"
        options={RULESETS.map((r) => ({ value: r.id, label: r.description }))}
        placeholder="Select a ruleset"
        required
        error={errors?.ruleset}
        value={values?.ruleset || RULESETS[0]!.id}
      />
      <div class="form-text">Choose the version of D&D 5e rules to use for this character</div>
    </div>,
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
      <div class="form-text">Every adventurer needs a name befitting their glory!</div>
    </div>,
    <div class="mb-3">
      <label for="species" class="form-label">
        Species
      </label>
      <Select
        name="species"
        id="species"
        options={speciesNames.map((species) => ({ value: species, label: toTitleCase(species) }))}
        placeholder="Select a species"
        required
        error={errors?.species}
        value={values?.species}
      />
      {values?.species && (
        <div class="alert alert-light mx-1 mt-1">
          {ruleset.species.find((s) => s.name === values.species)?.description}
        </div>
      )}
    </div>,
  ]

  const selectedSpecies = values?.species
    ? ruleset.species.find((r) => r.name === values.species)
    : null
  const lineages = selectedSpecies?.lineages || []
  const lineagePlh =
    lineages.length > 0
      ? "Select a lineage"
      : selectedSpecies
        ? "No lineages available"
        : "Select a species first"
  fields.push(
    <div class="mb-3">
      <label for="lineage" class="form-label">
        Lineage
      </label>
      <Select
        name="lineage"
        id="lineage"
        options={lineages.map((lineage) => ({
          value: lineage.name,
          label: toTitleCase(lineage.name),
        }))}
        placeholder={lineagePlh}
        required
        error={errors?.lineage}
        value={values?.lineage}
        disabled={lineages.length === 0}
      />
      {values?.species && values?.lineage && (
        <div class="alert alert-light mx-1 mt-1">
          {
            ruleset.species
              .find((s) => s.name === values.species)
              ?.lineages?.find((l) => l.name === values.lineage)?.description
          }
        </div>
      )}
      <TraitList traits={speciesTraits} title="Species Traits" />
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
        options={backgroundNames.map((bg) => ({ value: bg, label: toTitleCase(bg) }))}
        placeholder="Select a background"
        required
        error={errors?.background}
        value={values?.background}
      />
      {values?.background && (
        <div class="alert alert-light mx-1 mt-1">
          {ruleset.backgrounds[values.background]?.description}
        </div>
      )}
      <TraitList traits={backgroundTraits} title="Background Traits" />
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
      {values?.class && (
        <div class="alert alert-light mx-1 mt-1">
          {ruleset.classes[values.class as ClassNameType]?.description}
        </div>
      )}
    </div>
  )

  const selectedClass = values?.class ? ruleset.classes[values.class as ClassNameType] : null
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
        options={subclasses.map((subcls) => ({
          value: subcls.name,
          label: toTitleCase(subcls.name),
        }))}
        placeholder={subclassPlh}
        error={errors?.subclass}
        value={values?.subclass}
        disabled={subclasses.length === 0}
      />
      {values?.class && values?.subclass && (
        <div class="alert alert-light mx-1 mt-1">
          {
            ruleset.classes[values.class as ClassNameType]?.subclasses.find(
              (sc) => sc.name === values.subclass
            )?.description
          }
        </div>
      )}
      <TraitList traits={classTraits} title="Class Traits" />
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
                hx-post="/characters/new"
                hx-vals='{"is_check": "true"}'
                hx-trigger="change delay:300ms"
                hx-target="#character-new"
                hx-swap="outerHTML"
                class="needs-validation"
                novalidate
              >
                {fields.map((field) => field)}

                <div class="d-flex gap-2">
                  <button
                    type="submit"
                    hx-post="/characters/new"
                    hx-vals='{"is_check": "false"}'
                    class="btn btn-primary"
                  >
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
