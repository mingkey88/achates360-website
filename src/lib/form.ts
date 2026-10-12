/** A checkbox group as exported from the Wix contact form. */
export interface FormGroup { name: string; label: string; required: boolean; options: string[] }

// Wix splits a long checkbox list into side-by-side groups; the overflow group carries a
// default label ("Selection 2") that Wix painted white on white, so visitors never saw it.
const CONTINUATION = /^Selection \d+$/;

/**
 * Joins each continuation group onto the group before it, so the form shows one list and asks for
 * at least one choice across it (instead of one per invisible half). The record stays verbatim.
 */
export function mergeContinuationGroups(groups: FormGroup[]): FormGroup[] {
  const out: FormGroup[] = [];
  for (const g of groups) {
    const prev = out.at(-1);
    if (prev && CONTINUATION.test(g.label.trim())) {
      out[out.length - 1] = { ...prev, required: prev.required || g.required, options: [...prev.options, ...g.options] };
    } else out.push({ ...g, options: [...g.options] });
  }
  return out;
}
