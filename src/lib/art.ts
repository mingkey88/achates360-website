/**
 * Art direction for a case study: a layout that sets the page's own paragraphs, pictures and links in a
 * chosen order and arrangement. It only arranges: every paragraph, picture and link of the page is used
 * exactly once, words and files untouched (checkArt enforces it).
 *
 * Every project gets one made by autoArt (the standard template); a file in src/content/art/<slug>.yaml
 * replaces it for a page that needs a hand-made layout.
 *
 * Paragraphs are the page's text blocks split at blank lines, numbered from 0 in page order. Media are
 * the page's pictures, films and embedded players in page order (image blocks, gallery items, video and
 * embed blocks). Links are its button links (link blocks).
 */
import { toSegments } from './segments';

export type ArtLayout = 'lead' | 'full' | 'half' | 'pair' | 'trio' | 'grid4' | 'beside' | 'beside-left';
/** backdrop: a picture laid behind the section's pictures (as Wix set a sunburst behind the Konica stickers).
 * legible: the pictures carry text to read (screenshots of posts), so phones show them one to a row. */
export interface ArtSection { text?: number[]; media?: number[]; links?: number[]; layout?: ArtLayout; backdrop?: number; legible?: boolean }
export interface Art { sections: ArtSection[] }

export interface Media { kind: 'image' | 'video' | 'embed'; src?: any; alt: string; poster?: any; href?: string; controls?: boolean; block: any }

export function paragraphs(blocks: any[]): string[] {
  return blocks.filter((b) => b.type === 'text').flatMap((b) => split(b.md));
}
const split = (md: string) => String(md).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export function media(blocks: any[]): Media[] {
  const out: Media[] = [];
  for (const b of blocks) {
    if (b.type === 'image') out.push({ kind: 'image', src: b.src, alt: b.alt ?? '', href: b.href, block: b });
    else if (b.type === 'gallery') for (const it of b.items) out.push({ kind: 'image', src: it.thumb, alt: it.alt ?? '', href: it.href, block: { type: 'image', src: it.thumb, alt: it.alt ?? '', href: it.href } });
    else if (b.type === 'video') out.push({ kind: 'video', src: b.src, alt: '', poster: b.poster, controls: b.controls, block: b });
    else if (b.type === 'embed') out.push({ kind: 'embed', alt: '', block: b });
  }
  return out;
}

const plain = (md: string) => md.replace(/[*_#>`\[\]]|\(([^)]*)\)/g, '').trim();

export function links(blocks: any[]): any[] {
  return blocks.filter((b) => b.type === 'link');
}

/** A paragraph that is only bold words ("**Refining the Guest Experience**") or a one-line Markdown
 * heading ("##### Chinese New Year 2021") reads as a subheading. */
export function subheading(p: string): string | null {
  const m = p.match(/^\*\*([^*]+)\*\*$/) ?? p.match(/^#{1,6}[ \t]+([^\n]+)$/);
  return m ? m[1].replace(/\*\*/g, '').trim() || null : null;
}

/** A paragraph whose first line is only bold words, with text under it ("**2015: Game Changer**\nGame
 * changers are…"), reads as a subheading and its paragraph. */
export function runIn(p: string): { head: string; rest: string } | null {
  const m = p.match(/^\*\*([^*\n]+)\*\*[ \t]*\n([\s\S]+)$/) ?? p.match(/^#{1,6}[ \t]+([^\n]+)\n([\s\S]+)$/);
  const head = m?.[1].replace(/\*\*/g, '').trim();
  return m && head && m[2].trim() ? { head, rest: m[2].trim() } : null;
}

/** The longest opening paragraph set as a standfirst; a longer one opens the first passage instead. */
export const LEAD_MAX = 420;

/** Problems with a layout, as sentences; empty when every paragraph, picture and link is used once. */
export function checkArt(art: Art, paraCount: number, mediaCount: number, linkCount = 0): string[] {
  const problems: string[] = [];
  const tally = (key: 'text' | 'media' | 'links', count: number, noun: string) => {
    const seen = new Map<number, number>();
    for (const s of art.sections) for (const i of [...(s[key] ?? []), ...(key === 'media' && s.backdrop !== undefined ? [s.backdrop] : [])]) seen.set(i, (seen.get(i) ?? 0) + 1);
    for (const [i, n] of seen) {
      if (i < 0 || i >= count) problems.push(`${noun} ${i} does not exist (the page has ${count})`);
      else if (n > 1) problems.push(`${noun} ${i} is used ${n} times`);
    }
    for (let i = 0; i < count; i++) if (!seen.has(i)) problems.push(`${noun} ${i} is not used`);
  };
  tally('text', paraCount, 'paragraph');
  tally('media', mediaCount, 'picture');
  tally('links', linkCount, 'link');
  art.sections.forEach((s, i) => {
    if (!s.text?.length && !s.media?.length && !s.links?.length) problems.push(`section ${i} is empty`);
    if ((s.layout === 'beside' || s.layout === 'beside-left') && (!s.text?.length || !s.media?.length)) problems.push(`section ${i}: "${s.layout}" needs both text and media`);
    if (s.layout === 'lead' && (s.text?.length !== 1 || s.media?.length)) problems.push(`section ${i}: "lead" takes exactly one paragraph and no pictures`);
    if (s.backdrop !== undefined && !s.media?.length) problems.push(`section ${i}: a backdrop needs pictures to sit behind`);
  });
  return problems;
}

/** Shapes, by width ÷ height: wide shots run full width; squares and portraits ("tall") gather in grids. */
const WIDE = 1.7, TALL = 1.2;

/**
 * Pictures in a run, arranged by shape and kept in order: films (and embedded players) two to a row, a
 * lone one full width; wide shots full width, a run of them opening full width then two to a row; a run
 * of squares or portraits as an even grid (fours, else threes, a pair, or one at half width); other
 * landscapes in pairs, an odd one out full width. Rows of mixed shapes are set to one height (ArtRows).
 * film: whether a picture is a film; a portrait film is placed as a portrait.
 */
export function arrangeMedia(ids: number[], ratio: (i: number) => number, film: (i: number) => boolean = () => false): ArtSection[] {
  const out: ArtSection[] = [];
  const kind = (i: number) => (ratio(i) < TALL ? 'tall' : film(i) ? 'film' : ratio(i) >= WIDE ? 'wide' : 'land');
  const pairs = (run: number[]) => {
    const even = run.length - (run.length % 2);
    if (even) out.push({ media: run.slice(0, even), layout: 'pair' });
    if (even < run.length) out.push({ media: run.slice(even), layout: 'full' });
  };
  for (let a = 0; a < ids.length;) {
    const k = kind(ids[a]);
    let b = a + 1;
    while (b < ids.length && kind(ids[b]) === k) b++;
    const run = ids.slice(a, b);
    if (k === 'film') { if (run.length === 1) out.push({ media: run, layout: 'full' }); else pairs(run); }
    else if (k === 'wide') { out.push({ media: run.slice(0, 1), layout: 'full' }); pairs(run.slice(1)); }
    else if (k === 'tall') {
      // Full rows only: fours (or threes when they divide evenly), the remainder as a three or a pair
      // (five is three and two), never one left alone on a row.
      const n = run.length;
      if (n <= 3 || n % 4 === 0 || n % 3 === 0) out.push({ media: run, layout: n === 1 ? 'half' : n === 2 ? 'pair' : n === 3 || n % 4 !== 0 ? 'trio' : 'grid4' });
      else {
        const rest = n % 4 === 1 ? 5 : n % 4;
        if (n - rest) out.push({ media: run.slice(0, n - rest), layout: 'grid4' });
        const tail = run.slice(n - rest);
        if (tail.length === 5) out.push({ media: tail.slice(0, 3), layout: 'trio' }, { media: tail.slice(3), layout: 'pair' });
        else out.push({ media: tail, layout: tail.length === 3 ? 'trio' : 'pair' });
      }
    } else if (run.length === 1) out.push({ media: run, layout: 'full' });
    else if (run.length === 3) out.push({ media: run, layout: 'trio' });
    else pairs(run);
    a = b;
  }
  return out;
}

/**
 * The standard template for a case study, from its blocks in their visual order (segments.ts): the
 * first paragraph as the lead; each subheading opening a passage with its paragraphs; text that Wix set
 * beside a single picture stays beside it (sides alternating); runs of pictures arranged by shape
 * (arrangeMedia); button links under the passage before them.
 */
export function autoArt(blocks: any[], ratio: (m: Media) => number): Art {
  // Each block's own paragraph, media and link numbers (page order, as paragraphs/media/links count).
  const paraOf = new Map<any, number[]>(), mediaOf = new Map<any, number[]>(), linkOf = new Map<any, number>();
  let p = 0, m = 0, l = 0;
  for (const b of blocks) {
    if (b.type === 'text') paraOf.set(b, split(b.md).map(() => p++));
    else if (b.type === 'gallery') mediaOf.set(b, b.items.map(() => m++));
    else if (b.type === 'image' || b.type === 'video' || b.type === 'embed') mediaOf.set(b, [m++]);
    else if (b.type === 'link') linkOf.set(b, l++);
  }
  const all = media(blocks);
  const r = (i: number) => ratio(all[i]);
  const isFilm = (i: number) => all[i].kind !== 'image';
  const paras = paragraphs(blocks);

  const sections: ArtSection[] = [];
  let run: number[] = [];
  let besides = 0;
  const flush = () => { if (run.length) sections.push(...arrangeMedia(run, r, isFilm)); run = []; };
  const pushText = (ids: number[]) => {
    for (const i of ids) {
      const last = sections[sections.length - 1];
      if (i === 0 && !subheading(paras[i]) && !runIn(paras[i]) && plain(paras[i]).length <= LEAD_MAX) sections.push({ text: [i], layout: 'lead' });
      else if (subheading(paras[i]) || runIn(paras[i]) || !last?.text || last.media?.length || last.layout === 'lead' || last.links?.length) sections.push({ text: [i] });
      else last.text!.push(i);
    }
  };
  const pushLink = (b: any) => {
    const last = sections[sections.length - 1];
    if (last && !last.media?.length && last.layout !== 'lead') (last.links ??= []).push(linkOf.get(b)!);
    else sections.push({ links: [linkOf.get(b)!] });
  };
  const take = (b: any) => {
    if (paraOf.has(b)) { flush(); pushText(paraOf.get(b)!); }
    else if (mediaOf.has(b)) run.push(...mediaOf.get(b)!);
    else if (linkOf.has(b)) { flush(); pushLink(b); }
  };

  for (const seg of toSegments(blocks)) {
    if (seg.kind === 'single') take(seg.block);
    else if (seg.kind === 'grid') seg.blocks.forEach(take);
    else if (seg.kind === 'stage') for (const it of seg.items) { take(it.block); it.overlays.forEach((o) => take(o.block)); }
    else {
      const texts = seg.blocks.filter((b) => paraOf.has(b));
      const pics = seg.blocks.flatMap((b) => mediaOf.get(b) ?? []);
      if (texts.length === 1 && pics.length === 1 && paraOf.get(texts[0])!.length) {
        flush();
        sections.push({ text: [...paraOf.get(texts[0])!], media: pics, layout: besides++ % 2 ? 'beside-left' : 'beside' });
        seg.blocks.filter((b) => linkOf.has(b)).forEach(pushLink);
      } else seg.blocks.forEach(take);
    }
  }
  flush();
  // A lone portrait or square picture would sit at half width beside empty paper: set it beside the
  // plain passage before it instead, or failing that the one after it (sides alternating), as a printed
  // feature would.
  const plainText = (x?: ArtSection) => !!x && !!x.text?.length && !x.media?.length && !x.links?.length && !x.layout;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s.layout !== 'half') continue;
    const side = () => (besides++ % 2 ? 'beside-left' : 'beside') as ArtLayout;
    if (plainText(sections[i - 1])) { sections.splice(i - 1, 2, { text: sections[i - 1].text, media: s.media, layout: side() }); i--; }
    else if (plainText(sections[i + 1])) sections.splice(i, 2, { text: sections[i + 1].text, media: s.media, layout: side() });
  }
  return { sections };
}
