import type { Spell, Components } from "@src/lib/dnd/spells";
import { formatCastingTime, formatRange, formatDuration, formatDice, formatAreaOfEffect } from "@src/lib/spellFormatters";
import type { Child } from "hono/jsx";

export interface SpellDetailProps {
  spell: Spell;
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

export const SpellDetail = ({ spell }: SpellDetailProps) => {
  const levelText = spell.level === 0 ? "Cantrip" : `Level ${spell.level}`;
  const schoolText = spell.school.charAt(0).toUpperCase() + spell.school.slice(1);

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">
          {spell.name}
          {spell.ritual && <span class="badge bg-secondary ms-2">Ritual</span>}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <p class="text-muted mb-3">
          <em>{levelText} {schoolText}</em>
        </p>

        <div class="mb-3">
          <strong>Casting Time:</strong> {formatCastingTime(spell.castingTime)}
        </div>

        <div class="mb-3">
          <strong>Range:</strong> {formatRange(spell.range)}
        </div>

        <div class="mb-3">
          <strong>Components:</strong> <ComponentsDisplay components={spell.components} />
        </div>

        <div class="mb-3">
          <strong>Duration:</strong> {formatDuration(spell.duration)}
        </div>

        {spell.target && (
          <div class="mb-3">
            <strong>Target:</strong>{" "}
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
          </div>
        )}

        <div class="mb-3">
          <strong>Classes:</strong>{" "}
          {spell.classes.map((cls, idx) => (
            <>
              <span class="text-capitalize">{cls}</span>
              {idx < spell.classes.length - 1 ? ", " : ""}
            </>
          ))}
        </div>

        <hr />

        <div class="mb-3">
          <p>{spell.description}</p>
        </div>

        {spell.atHigherLevelsText && (
          <div class="mb-3">
            <p><strong>At Higher Levels:</strong> {spell.atHigherLevelsText}</p>
          </div>
        )}

        {spell.damage && spell.damage.length > 0 && (
          <div class="mb-3">
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
          </div>
        )}

        {spell.healingDice && (
          <div class="mb-3">
            <strong>Healing:</strong> {formatDice(spell.healingDice)}
          </div>
        )}

        {spell.tempHPDice && (
          <div class="mb-3">
            <strong>Temporary HP:</strong> {formatDice(spell.tempHPDice)}
          </div>
        )}

        {spell.resolution.kind === "save" && (
          <div class="mb-3">
            <strong>Saving Throw:</strong>{" "}
            <span class="text-capitalize">{spell.resolution.ability}</span>
            {spell.resolution.onSuccess && (
              <span> (on success: {spell.resolution.onSuccess})</span>
            )}
          </div>
        )}

        {spell.resolution.kind === "attack" && (
          <div class="mb-3">
            <strong>Attack Type:</strong>{" "}
            {spell.resolution.attackType === "meleeSpell" ? "Melee Spell Attack" :
             spell.resolution.attackType === "rangedSpell" ? "Ranged Spell Attack" :
             spell.resolution.attackType === "meleeWeapon" ? "Melee Weapon Attack" :
             "Ranged Weapon Attack"}
          </div>
        )}

        {spell.conditionsInflicted && spell.conditionsInflicted.length > 0 && (
          <div class="mb-3">
            <strong>Conditions:</strong>{" "}
            {spell.conditionsInflicted.map((cond, idx) => (
              <>
                <span class="text-capitalize">{cond}</span>
                {idx < spell.conditionsInflicted!.length - 1 ? ", " : ""}
              </>
            ))}
          </div>
        )}

        {spell.source && (
          <div class="text-muted small">
            <em>Source: {spell.source}</em>
          </div>
        )}
      </div>
    </>
  );
};
