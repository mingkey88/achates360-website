/**
 * llms.txt (llmstxt.org): a plain-language summary of the studio and its work that AI answer engines
 * read first (AEO/GEO, 13 Oct 2026). Built from the site's own content at build time, so it never
 * drifts from the pages: the About copy, the services, and each listed case study's client, year,
 * categories and the opening of its own write-up. All copy is the client's, quoted, not rewritten.
 */
export interface LlmsProject { title: string; url: string; client?: string; year?: string; categories: string[]; lead?: string }
export interface LlmsInput {
  summary: string; about: string[]; homeUrl: string; email?: string;
  pages: { name: string; url: string }[];
  services: { name: string; categories: string[] }[];
  clients: string[];
  projects: LlmsProject[];
}

/** Markdown to one line of plain text: links keep their words, emphasis and headings marks go. */
export function plain(md: string): string {
  return md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`\\]/g, '')
    .replace(/[\u200b-\u200d\ufeff]/g, '') // zero-width characters Wix leaves in text
    .replace(/\s+/g, ' ')
    .trim();
}

/** The opening of a write-up: whole sentences up to about `max` characters (at least one sentence). */
export function lead(text: string, max = 240): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = '';
  for (const s of sentences) {
    if (out && (out + s).length > max) break;
    out += s;
  }
  return out.trim();
}

export function llmsTxt(d: LlmsInput): string {
  const lines: string[] = ['# Achates 360', '', `> ${d.summary}`, ''];
  for (const p of d.about) lines.push(p, '');
  lines.push('## Contact', '', `- Website: ${d.homeUrl}`, ...(d.email ? [`- Email: ${d.email}`] : []), '- Location: Singapore', '');
  lines.push('## Pages', '', ...d.pages.map((p) => `- [${p.name}](${p.url})`), '');
  if (d.services.length) lines.push('## Services', '', ...d.services.map((s) => (s.categories.length ? `- ${s.name}: ${s.categories.join(', ')}` : `- ${s.name}`)), '');
  if (d.clients.length) lines.push('## Clients', '', d.clients.join(', '), '');
  lines.push('## Case studies', '');
  for (const p of d.projects) {
    const facts = [p.client, p.year].filter(Boolean).join(', ');
    const cats = p.categories.length ? ` (${p.categories.join(', ')})` : '';
    lines.push(`- [${p.title}](${p.url})${facts ? `: ${facts}` : ''}${cats}${p.lead ? `. ${p.lead}` : ''}`);
  }
  return lines.join('\n') + '\n';
}
