import { LabeledValue } from "./ui/LabeledValue";
import clsx from "clsx";

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

  // Calculate HP percentage and color
  const hpPercent = (character.currentHP / character.maxHitPoints) * 100;
  const hpProgressCls = clsx('progress-bar', {
    'bg-success': hpPercent > 75,
    'bg-warning': hpPercent > 25 && hpPercent <= 75,
    'bg-danger': hpPercent <= 25,
  });

  // Track which hit dice are used
  const hitDice: { value: number, used: boolean }[] = character.hitDice.map(die => ({ value: die, used: true }));
  for (const die of character.availableHitDice) {
    const index = hitDice.findIndex(d => d.value === die && d.used);
    if (index !== -1) {
      hitDice[index]!.used = false;
    }
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
                <div class="row g-0">
                  <div class="col-11">
                    <LabeledValue label="Class" value={classStrings.join(' / ')} className="text-capitalize" />
                  </div>
                  <div class="col-1 d-flex flex-column gap-1 align-items-center">
                    <button
                      class="btn btn-sm btn-outline-secondary border p-1"
                      style="width: 24px; height: 24px; line-height: 1;"
                      aria-label="edit class"
                      title="edit class">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-secondary border p-1"
                      style="width: 24px; height: 24px; line-height: 1;"
                      aria-label="class history"
                      title="class history">
                      <i class="bi bi-journals"></i>
                    </button>
                  </div>
                </div>
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

            {/* Hit Points Progress Bar */}
            <div class="row g-2 h-auto mt-2">
              <div class="col-1">
                <div class="text-muted small">Hit Points</div>
              </div>
              <div class="col-10">
                <div class="progress" style="height: 25px;">
                  <div
                    class={hpProgressCls}
                    role="progressbar"
                    style={`width: ${hpPercent}%`}
                    aria-valuenow={character.currentHP}
                    aria-valuemin="0"
                    aria-valuemax={character.maxHitPoints}
                  >
                    {character.currentHP} / {character.maxHitPoints}
                  </div>
                </div>
              </div>
              <div class="col-1 d-flex gap-1 align-items-center">
                <button
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="edit hit points"
                  title="edit hit points">
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="hit points history"
                  title="hit points history">
                  <i class="bi bi-journals"></i>
                </button>
              </div>
            </div>

            {/* Hit Dice */}
            <div class="row g-2 h-auto mt-2">
              <div class="col-1">
                <div class="text-muted small text-center">Hit Dice</div>
              </div>
              <div class="col-10">
                <div class="d-flex justify-content-center">
                  <ul class="list-group list-group-horizontal">
                    {hitDice.map(({value, used}) => {
                      return (
                        <li
                          class={clsx('list-group-item', 'position-relative', 'p-2', { 'bg-success-suble': !used, 'bg-danger-subtle': used })}
                        >
                          D{value}
                          {used && (
                            <i class={clsx('bi', 'bi-x-lg', 'position-absolute', 'top-50', 'start-50', 'translate-middle')} style="font-size: 1.5rem; opacity: 0.5;"></i>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div class="col-1 d-flex gap-1 align-items-center">
                <button
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="edit hit dice"
                  title="edit hit dice">
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="hit dice history"
                  title="hit dice history">
                  <i class="bi bi-journals"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
