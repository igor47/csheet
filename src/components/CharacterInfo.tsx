import { LabeledValue } from "./ui/LabeledValue";

import type { ComputedCharacter } from "@src/services/computeCharacter";

export interface CharacterInfoProps {
  character: ComputedCharacter;
}

function numToOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  const suffix = s[(v - 20) % 10] || s[v] || s[0] as string;
  return n + suffix;
}


export const CharacterInfo = ({ character }: CharacterInfoProps) => {
  const classStrings: string[] = []
  for (const c of character.classes) {
    const parts: string[] = []
    const level = numToOrdinal(c.level)
    parts.push(`${level}-level ${c.class}`)
    if (c.subclass) {
      parts.push(`(${c.subclass})`)
    }
    classStrings.push(parts.join(' '))
  }

  return (
    <div class="card shadow-sm mb-3" id="character-info">
      <div class="card-body">
        <div class="row g-2 d-flex align-items-center">
          <div class="col-3 col-lg-2">
            <img src="/static/placeholder.png" class="rounded mx-auto d-block ratio ratio-1x1" alt={ `${character.name}'s image` } />
          </div>
          <div class="col-9 col-lg-10">
            <h2>{character.name}</h2>
          </div>
        </div>
        <div class="row mt-2">
          <div class="col">
            <div class="row g-2 h-auto">
              <div class="col-sm-4">
                <LabeledValue label="Race" value={character.subrace || character.race} className="text-capitalize" />
              </div>

              <div class="col-sm-4">
                <LabeledValue label="Class" value={classStrings.join(' / ')} className="text-capitalize" />
              </div>

              <div class="col-sm-4">
                <LabeledValue label="Background" value={character.background} className="text-capitalize" />
              </div>
            </div>

            <div class="row g-2 h-auto mt-1">
              <div class="col-sm-4">
                <LabeledValue label="Size" value={character.size} className="text-capitalize" />
              </div>

              <div class="col-sm-4">
                <LabeledValue label="Speed" value={`${character.speed} ft.`} />
              </div>

              <div class="col-sm-4">
                <LabeledValue label="Proficiency Bonus" value={`+${character.proficiencyBonus}`} />
              </div>
            </div>

            <div class="row g-2 h-auto mt-1">
              <div class="col-sm-4 offset-sm-2">
                <LabeledValue label="Armor Class" value={character.armorClass} />
              </div>

              <div class="col-sm-4">
                <LabeledValue label="Initiative" value={character.initiative >= 0 ? `+${character.initiative}` : `${character.initiative}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
