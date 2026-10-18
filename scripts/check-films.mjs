// Checks every embedded Vimeo and YouTube film on the case studies with the providers' oEmbed endpoints
// (network required, so not part of the test run). A film answering anything but 200 cannot play: a
// removed or private YouTube film, or an unlisted Vimeo film whose private key (?h=…) is missing.
// Usage: npm run check:films
import { readFileSync, readdirSync } from 'node:fs';
import yaml from 'js-yaml';

const dir = new URL('../src/content/projects/', import.meta.url);
const known = readFileSync(new URL('../src/lib/unavailable-films.ts', import.meta.url), 'utf8');
let bad = 0, total = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
  const d = yaml.load(readFileSync(new URL(f, dir), 'utf8').split(/^---$/m)[1]);
  if (!d.listed) continue;
  for (const b of d.blocks ?? []) {
    if (b.type !== 'embed') continue;
    total++;
    const url = b.provider === 'youtube'
      ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${b.id}`)}`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${b.id}${b.hash ? `/${b.hash}` : ''}`)}`;
    const status = (await fetch(url).catch(() => ({ status: 0 }))).status;
    if (status === 200) continue;
    const listedAsKnown = known.includes(`${b.provider}:${b.id}`);
    console.log(`${listedAsKnown ? 'KNOWN' : 'BROKEN'}  /${f.replace(/\.md$/, '')}  ${b.provider} ${b.id}  (${status})`);
    if (!listedAsKnown) bad++;
  }
}
console.log(`films: ${total} checked, ${bad} newly broken`);
process.exit(bad ? 1 : 0);
