import { stringify } from 'yaml';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export function toFrontmatter(data) {
  return `---\n${stringify(data, { lineWidth: 0 })}---\n`;
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
