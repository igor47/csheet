import type { CastingTime, Range, Duration, Components, Dice, AreaOfEffect } from "@src/lib/dnd/spells";

export function formatCastingTime(castingTime: CastingTime): string {
  switch (castingTime.type) {
    case "action":
      return "1 action";
    case "bonusAction":
      return "1 bonus action";
    case "reaction":
      return castingTime.trigger
        ? `1 reaction (${castingTime.trigger})`
        : "1 reaction";
    case "minutes":
      return `${castingTime.value} ${castingTime.value === 1 ? "minute" : "minutes"}`;
    case "hours":
      return `${castingTime.value} ${castingTime.value === 1 ? "hour" : "hours"}`;
  }
}

export function formatRange(range: Range): string {
  switch (range.type) {
    case "self":
      return "Self";
    case "touch":
      return "Touch";
    case "distance":
      return `${range.feet} feet`;
    case "special":
      return range.text;
  }
}

export function formatDuration(duration: Duration): string {
  switch (duration.type) {
    case "instantaneous":
      return "Instantaneous";
    case "concentration":
      const maxUnit = duration.max.unit === "round" ? "rounds" :
                      duration.max.unit === "minute" ? "minutes" : "hours";
      return `Concentration, up to ${duration.max.value} ${maxUnit}`;
    case "timed":
      const unit = duration.unit === "round" ? "rounds" :
                   duration.unit === "minute" ? "minutes" :
                   duration.unit === "hour" ? "hours" : "days";
      return `${duration.value} ${unit}`;
    case "untilDispelled":
      return "Until dispelled";
    case "special":
      return duration.text;
  }
}

export function formatComponents(components: Components): string {
  const parts: string[] = [];

  if (components.verbal) parts.push("V");
  if (components.somatic) parts.push("S");
  if (components.material) {
    let materialPart = "M";
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

    if (details.length > 0) {
      materialPart += ` (${details.join(", ")})`;
    }

    parts.push(materialPart);
  }

  return parts.join(", ");
}

export function formatDice(dice: Dice): string {
  if (dice.length === 0) return "0";

  // Count occurrences of each die size
  const counts = new Map<number, number>();
  for (const die of dice) {
    counts.set(die, (counts.get(die) || 0) + 1);
  }

  // Format as "XdY + ZdW" etc
  const parts: string[] = [];
  for (const [size, count] of counts) {
    parts.push(`${count}d${size}`);
  }

  return parts.join(" + ");
}

export function formatAreaOfEffect(area: AreaOfEffect): string {
  const origin = area.origin === "self" ? " (self)" : "";

  switch (area.shape) {
    case "sphere":
      return `${area.radius}-foot-radius sphere${origin}`;
    case "cube":
      return `${area.size}-foot cube${origin}`;
    case "cone":
      return `${area.length}-foot cone${origin}`;
    case "cylinder":
      return `${area.radius}-foot-radius, ${area.height}-foot-high cylinder${origin}`;
    case "line":
      return `${area.length}-foot-long, ${area.width}-foot-wide line${origin}`;
  }
}
