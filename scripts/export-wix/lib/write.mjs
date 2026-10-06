import { stringify, parse } from 'yaml';
import { mkdir, writeFile } from 'node:fs/promises';
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
