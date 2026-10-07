import type { Flagged } from './placeholders';

/** A UI string from src/content/extras/strings.yaml. */
export interface UiString extends Flagged { text: string }

/** Lookup by id; an unknown id fails the build instead of rendering nothing. */
export function makeText(strings: readonly UiString[]): (id: string) => UiString {
  const byId = new Map(strings.map((s) => [s.id, s]));
  return (id) => {
    const s = byId.get(id);
    if (!s) throw new Error(`Missing UI string "${id}" in src/content/extras/strings.yaml`);
    return s;
  };
}
