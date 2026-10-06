import { stringify, parse } from 'yaml';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export function toFrontmatter(data) {
  return `---\n${stringify(data, { lineWidth: 0 })}---\n`;
}

/**
 * Set only `keys` in a content file's frontmatter: each key is removed, then re-added at the end
 * when `fields` has it. Every other key keeps its value and order; the file is re-serialised with
 * toFrontmatter, which the export also writes with, so untouched keys come out byte-identical.
 */
export function setFrontmatterKeys(text, fields, keys) {
  const m = text.match(/^---\n([\s\S]*)---\n$/);
  if (!m) throw new Error('setFrontmatterKeys: not a frontmatter-only content file');
  const data = parse(m[1]);
  for (const k of keys) delete data[k];
  for (const k of keys) if (fields[k] !== undefined) data[k] = fields[k];
  return toFrontmatter(data);
}

/**
 * Which of the existing generated content files a full export may delete before it writes.
 * `existing` is [{ collection, id }] (one per .md file), `ids` the ids this run writes.
 * A file whose page this run writes is cleared, so a page whose collection changed (e.g. a
 * fallback to basic) is never left in two collections. A file whose page this run does NOT write
 * (it left the live sitemap, like /joseph-chan after Wix redirected it) is kept unless removals
 * are explicitly allowed: the card slugs and every snapshot URL are permanent.
 */
export function planCleanup(existing, ids, { allowRemovals = false } = {}) {
  const remove = [];
  const keep = [];
  for (const f of existing) (ids.has(f.id) || allowRemovals ? remove : keep).push(f);
  return { remove, keep };
}

/** The frontmatter data of an existing content file, or null when there is none. */
export async function readRecord(root, collection, id) {
  let text;
  try { text = await readFile(join(root, 'src/content', collection, `${id}.md`), 'utf8'); } catch { return null; }
  const m = text.match(/^---\n([\s\S]*)---\n$/);
  return m ? parse(m[1]) : null;
}

export async function writeRecord(root, { collection, id, data }) {
  const dir = join(root, 'src/content', collection);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${id}.md`);
  await writeFile(path, toFrontmatter(data));
  return path;
}

const LEVELS = [['query', 'Content queries'], ['warning', 'Warnings'], ['info', 'Notes']];

export function exportLog(entries) {
  const lines = ['# Export log', ''];
  for (const [level, title] of LEVELS) {
    const xs = entries.filter((e) => e.level === level).sort((a, b) => a.page.localeCompare(b.page));
    if (!xs.length) continue;
    lines.push(`## ${title}`, '', ...xs.map((e) => `- **${e.page}** — ${e.message}`), '');
  }
  return lines.join('\n');
}
