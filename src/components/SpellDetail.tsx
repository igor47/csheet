import { clsx } from "clsx";
import type { Child } from "hono/jsx";

import type { Spell, Components } from "@src/lib/dnd/spells";
import { formatCastingTime, formatRange, formatDuration, formatDice, formatAreaOfEffect } from "@src/lib/spellFormatters";

export interface SpellDetailProps {
  spell: Spell;
  compact?: boolean;
  class?: string;
}

const ComponentsDisplay = ({ components }: { components: Components }) => {
  const parts: Child[] = [];

  if (components.verbal) {
    parts.push(
      <span
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title="The spell requires spoken words or incantations"
      >
        Verbal
      </span>
    );
  }

  if (components.somatic) {
    parts.push(
      <span
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title="The spell requires gestures or hand movements"
      >
        Somatic
      </span>
    );
  }

  if (components.material) {
    const details: string[] = [];

    if (components.material.description) {
      details.push(components.material.description);
    }
    if (components.material.costGP) {
      details.push(`${components.material.costGP} gp`);
    }
    if (components.material.consumed) {
      details.push("consumed");
    }

    parts.push(
      <span
        data-bs-toggle="tooltip"
        data-bs-placement="top"
        title="The spell requires specific physical components"
      >
        Material{details.length > 0 ? ` (${details.join(", ")})` : ""}
      </span>
    );
  }

  return (
    <>
      {parts.map((part, idx) => (
        <>
          {part}
          {idx < parts.length - 1 ? ", " : ""}
        </>
      ))}
    </>
  );
};

const SpellDetailInner = ({ spell, className }: { spell: Spell, className: string }) => {
  const levelText = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
  const schoolText = spell.school.charAt(0).toUpperCase() + spell.school.slice(1);

  return (
    <div class={className}>
      <ul class="list-group list-group-flush mb-3">
        <li class="list-group-item"><strong>Spell Type:</strong> {levelText} {schoolText}</li>
        <li class="list-group-item"><strong>Casting Time:</strong> {formatCastingTime(spell.castingTime)}</li>
        <li class="list-group-item"><strong>Range:</strong> {formatRange(spell.range)}</li>
        <li class="list-group-item"><strong>Components:</strong> <ComponentsDisplay components={spell.components} /></li>
        <li class="list-group-item"><strong>Duration:</strong> {formatDuration(spell.duration)}</li>

      {spell.target && (
          <li class="list-group-item"><strong>Target:</strong>{" "}
          {spell.target.type === "self" && "Self"}
          {spell.target.type === "creature" && (
            <>
              {spell.target.count === "any" ? "Any number of creatures" :
               spell.target.count ? `${spell.target.count} creature${spell.target.count > 1 ? 's' : ''}` : "One creature"}
              {spell.target.friendlyOnly && " (friendly only)"}
            </>
          )}
          {spell.target.type === "object" && (
            <>
              {spell.target.count === "any" ? "Any number of objects" :
               spell.target.count ? `${spell.target.count} object${spell.target.count > 1 ? 's' : ''}` : "One object"}
            </>
          )}
          {spell.target.type === "area" && formatAreaOfEffect(spell.target.area)}
          {spell.target.type === "point" && "A point you choose"}
          {spell.target.type === "special" && spell.target.text}
        </li>
      )}

        <li class="list-group-item"><strong>Classes:</strong>{" "}
          {spell.classes.map((cls, idx) => (
            <>
              <span class="text-capitalize">{cls}</span>
              {idx < spell.classes.length - 1 ? ", " : ""}
            </>
          ))}
        </li>
      </ul>

      <h5 class="ps-3">Description</h5>

      <div class="ht-100 overflow-auto border p-3" style="max-height: 300px;">
        {spell.description.split('\n').map(paragraph => (
        <p>{paragraph}</p>
        ))}
      </div>

      <ul class="list-group list-group-flush">

      {spell.resolution.kind === "attack" && (
        <li class="list-group-item">
          <strong>Attack Type:</strong>{" "}
          {spell.resolution.attackType === "meleeSpell" ? "Melee Spell Attack" :
           spell.resolution.attackType === "rangedSpell" ? "Ranged Spell Attack" :
           spell.resolution.attackType === "meleeWeapon" ? "Melee Weapon Attack" :
           "Ranged Weapon Attack"}
        </li>
      )}


      {spell.damage && spell.damage.length > 0 && (
        <li class="list-group-item">
          <strong>Damage:</strong>
          <ul class="mb-0">
            {spell.damage.map(dmg => (
              <li>
                {dmg.dice && formatDice(dmg.dice)}
                {dmg.flatBonus && ` + ${dmg.flatBonus}`}
                {" "}
                <span class="text-capitalize">{dmg.type}</span>
                {dmg.notes && <em> ({dmg.notes})</em>}
              </li>
            ))}
          </ul>
        </li>
      )}

      {spell.healingDice && (
        <li class="list-group-item">
          <strong>Healing:</strong> {formatDice(spell.healingDice)}
        </li>
      )}

      {spell.tempHPDice && (
        <li class="list-group-item">
          <strong>Temporary HP:</strong> {formatDice(spell.tempHPDice)}
        </li>
      )}

      {spell.resolution.kind === "save" && (
        <li class="list-group-item">
          <strong>Saving Throw:</strong>{" "}
          <span class="text-capitalize">{spell.resolution.ability}</span>
          {spell.resolution.onSuccess && (
            <span> (on success: {spell.resolution.onSuccess})</span>
          )}
        </li>
      )}

      {spell.conditionsInflicted && spell.conditionsInflicted.length > 0 && (
        <li class="list-group-item">
          <strong>Conditions:</strong>{" "}
          {spell.conditionsInflicted.map((cond, idx) => (
            <>
              <span class="text-capitalize">{cond}</span>
              {idx < spell.conditionsInflicted!.length - 1 ? ", " : ""}
            </>
          ))}
        </li>
      )}

      {spell.atHigherLevelsText && (
        <li class="list-group-item">
          <p><strong>At Higher Levels:</strong> {spell.atHigherLevelsText}</p>
        </li>
      )}

      {spell.source && (
        <li class="list-group-item text-muted">
          <strong>Source:</strong> {spell.source}
        </li>
      )}
      </ul>
    </div>
  );
}

export const SpellDetail = ({ spell, compact, class: className }: SpellDetailProps) => {
  if (compact) {
    return (<>
      <div class={clsx("accordion", className)}>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#spell-brief" aria-expanded="true" aria-controls="spell-brief">
              {spell.name}
              {spell.ritual && <span class="badge bg-secondary ms-2">Ritual</span>}
            </button>
          </h2>
          <div id="spell-brief" class="accordion-collapse collapse show">
            <div class="accordion-body">
              {spell.briefDescription}
            </div>
          </div>
        </div>
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#spell-full" aria-expanded="false" aria-controls="spell-full">
              Full Spell Details
            </button>
          </h2>
          <div id="spell-full" class="accordion-collapse collapse">
            <SpellDetailInner spell={spell} className="accordion-body" />
          </div>
        </div>
      </div>
    </>)
  } else {
    return (<>
      <div class="modal-header">
        <h5 class="modal-title">
          {spell.name}
          {spell.ritual && <span class="badge bg-secondary ms-2">Ritual</span>}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <SpellDetailInner spell={spell} className={clsx("modal-body", className)} />
    </>)
  }
};
