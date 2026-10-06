import { imgRef, videoRef } from './urls.mjs';
import { htmlToMarkdown } from './clean.mjs';

export const CARD_SLUGS = ['angeline', 'joseph-chan', 'donna', 'belinda', 'chuan', 'abby'];
export const BASIC_SLUGS = ['about', 'joinus'];
const BACK = /BACK TO PROJECTS/;
// A year or a year range, kept verbatim: "© 2018", "© 2021 - 2022", "© 2021-2022".
const COPYRIGHT = /^©\s*\d{4}(\s*[-–]\s*\d{4})?$/;

export class MappingError extends Error {}

const seoOf = (raw) => ({
  title: raw.seo.title,
  description: raw.seo.description,
  ...(raw.seo.ogImage ? { ogImage: imgRef(raw.seo.ogImage) } : {}),
});

const image = (n) => ({ src: imgRef(n.file), alt: n.alt, ...(n.href ? { href: n.href } : {}) });

// Wix's computed colours ("rgb(r, g, b)") as lowercase hex; anything else (e.g. a translucent
// rgba) is kept verbatim.
export function toHex(color) {
  const m = color?.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(1|1\.0+))?\)$/);
  return m ? '#' + m.slice(1, 4).map((v) => Number(v).toString(16).padStart(2, '0')).join('') : color;
}
// Case-study body copy colour (src/styles/tokens.css --color-text): a text block in this colour
// needs no colour of its own.
export const DEFAULT_TEXT_COLOR = '#605e5e';
const WHITE = '#ffffff';
const TRANSPARENT = /^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$/;
// The page background, only when it is not white (the clone's default --color-page).
function pageBackground(raw) {
  const bg = raw.pageBackground;
  if (!bg || TRANSPARENT.test(bg) || toHex(bg) === WHITE) return {};
  return { pageBackground: toHex(bg) };
}
// Desktop (1440) and mobile (iPhone 13) boxes of a node, when the render recorded them.
const layout = (n) => ({ ...(n.box ? { box: n.box } : {}), ...(n.mbox ? { mbox: n.mbox } : {}) });

function galleryItems(items) {
  return items.filter((i) => i.file).map((i) => ({
    title: i.title,
    description: i.description,
    ...(i.href ? { href: i.href } : {}),
    thumb: imgRef(i.file),
    alt: i.alt,
    ...(i.video ? { video: videoRef(i.video.videoId) } : {}),
  }));
}

export function toBlock(n) {
  const block = blockOf(n);
  return block && { ...block, ...layout(n) };
}

function blockOf(n) {
  switch (n.kind) {
    case 'text': {
      const md = htmlToMarkdown(n.html);
      const color = n.color && toHex(n.color);
      return md ? { type: 'text', md, ...(color && color !== DEFAULT_TEXT_COLOR ? { color } : {}) } : null;
    }
    case 'image': return { type: 'image', ...image(n) };
    case 'gallery': return { type: 'gallery', items: galleryItems(n.items) };
    case 'bgvideo': return { type: 'video', src: videoRef(n.videoId), poster: imgRef(n.poster) };
    // A Wix-hosted player not served from video.wixstatic.com has no file to download: reported
    // as unmapped (export log) rather than linked to a third-party URL.
    case 'player': return n.videoId ? { type: 'video', src: videoRef(n.videoId), poster: imgRef(n.poster), controls: true } : null;
    case 'embed': return { type: 'embed', provider: n.provider, id: n.id };
    case 'link': return { type: 'link', href: n.href, label: n.text };
    default: return null;
  }
}

const blocksOf = (nodes) => nodes.map(toBlock).filter(Boolean);

// Controller ruling R13: mappers never discard content silently. A text whose Markdown is empty
// is a spacer, not content; every other node a mapper does not place is reported.
const isSpacer = (n) => n.kind === 'text' && !htmlToMarkdown(n.html);
const notBlockable = (nodes) => nodes.filter((n) => toBlock(n) === null && !isSpacer(n));
function describeNode(n) {
  const what = n.kind === 'text' ? JSON.stringify(n.text.slice(0, 40))
    : n.kind === 'link' ? `${JSON.stringify(n.text)} -> ${n.href}`
    : n.kind === 'image' ? n.file
    : n.kind === 'bgvideo' ? n.videoId
    : n.kind === 'player' ? n.src
    : n.kind === 'embed' ? `${n.provider}:${n.id}`
    : n.kind === 'gallery' ? `${n.items.length} items`
    : '';
  return what ? `${n.kind} ${what}` : n.kind;
}
const describeNodes = (nodes) => nodes.map(describeNode).join(', ');
const unmapped = (slug, nodes) => `${slug}: unmapped nodes: ${describeNodes(nodes)}`;

export function classify(raw) {
  if (raw.slug === 'home') return 'home';
  if (raw.slug === 'projects') return 'projectsIndex';
  if (CARD_SLUGS.includes(raw.slug)) return 'card';
  if (BASIC_SLUGS.includes(raw.slug)) return 'basic';
  return raw.nodes.some((n) => n.kind === 'link' && BACK.test(n.text)) ? 'project' : 'basic';
}

export function toProject(raw) {
  const backIdx = raw.nodes.findIndex((n) => n.kind === 'link' && BACK.test(n.text));
  if (backIdx < 0) throw new MappingError(`${raw.slug}: no back link`);
  // Ruling 19b: copyright-shaped text above the back link (bumitama and uel carry an off-canvas
  // "© 2021 - 2022" in the hero, visible only on very wide screens) is kept verbatim as heroCaption.
  const captions = raw.nodes.slice(0, backIdx).filter((n) => n.kind === 'text' && COPYRIGHT.test(n.text));
  const before = raw.nodes.slice(0, backIdx).filter((n) => !captions.includes(n));
  const after = raw.nodes.slice(backIdx + 1);

  const heroNode = before.find((n) => n.kind === 'image' || n.kind === 'bgvideo');
  const badges = before.filter((n) => n.kind === 'image' && n !== heroNode).map((n) => ({ ...image(n), ...(n.box ? { box: n.box } : {}) }));

  const textIdx = after.map((n, i) => (n.kind === 'text' ? i : -1)).filter((i) => i >= 0);
  if (textIdx.length === 0) throw new MappingError(`${raw.slug}: no title after back link`);
  const [titleI, clientI] = textIdx;
  const copyI = after.findIndex((n) => n.kind === 'text' && COPYRIGHT.test(n.text));

  const rest = after.filter((_, i) => i !== titleI && i !== clientI && i !== copyI);
  // Above the back link only the hero and badge images have a place in the record.
  const unused = [...before.filter((n) => n !== heroNode && n.kind !== 'image' && !isSpacer(n)), ...notBlockable(rest)];
  if (unused.length) throw new MappingError(unmapped(raw.slug, unused));
  const hero = !heroNode ? undefined
    : heroNode.kind === 'bgvideo'
      ? { type: 'video', src: videoRef(heroNode.videoId), poster: imgRef(heroNode.poster) }
      : { type: 'image', src: imgRef(heroNode.file), alt: heroNode.alt };

  return {
    title: after[titleI].text,
    ...(clientI !== undefined && clientI !== copyI ? { client: after[clientI].text } : {}),
    ...(copyI >= 0 ? { copyright: after[copyI].text } : {}),
    categories: [],
    listed: false,
    ...(hero ? { hero } : {}),
    ...(captions.length ? { heroCaption: captions.map((n) => n.text).join('\n') } : {}),
    badges,
    backLink: { label: raw.nodes[backIdx].text, href: raw.nodes[backIdx].href },
    ...pageBackground(raw),
    seo: seoOf(raw),
    blocks: blocksOf(rest),
  };
}

export function toCard(raw) {
  const texts = raw.nodes.filter((n) => n.kind === 'text');
  const images = raw.nodes.filter((n) => n.kind === 'image');
  const links = [];
  for (const n of raw.nodes) {
    if (n.kind === 'link') links.push({ label: n.text, href: n.href });
    if (n.kind === 'text') for (const l of n.links) links.push({ label: l.text, href: l.href });
  }
  const textWithLink = (prefix) => texts.find((n) => n.links.some((l) => l.href.startsWith(prefix)));
  const textLink = (t, prefix) => t && { display: t.text, href: t.links.find((l) => l.href.startsWith(prefix)).href };
  const phoneNode = textWithLink('tel:');
  const emailNode = textWithLink('mailto:');
  const phone = textLink(phoneNode, 'tel:');
  const email = textLink(emailNode, 'mailto:');
  const vcf = links.find((l) => l.href.includes('.vcf'));
  if (!phone || !email || !vcf || images.length < 2 || texts.length < 3) {
    throw new MappingError(`${raw.slug}: not a business card layout`);
  }
  // A text made only of its links is carried verbatim by `links`.
  const squash = (t) => t.replace(/[\s\u200b]/g, '');
  const linkOnly = (n) => n.kind === 'text' && n.links.length > 0 && squash(n.text) === squash(n.links.map((l) => l.text).join(''));
  // Cards place the role before or after the blurb (chuan vs angeline), so only the name is
  // positional: the two texts that are not name, phone, email or link-only are the blurb and
  // the role, the blurb being the longer. Any other count is not this layout.
  const name = texts[0];
  const free = texts.filter((n) => n !== name && n !== phoneNode && n !== emailNode && !linkOnly(n) && !isSpacer(n));
  if (free.length !== 2) throw new MappingError(unmapped(raw.slug, free));
  const [blurb, role] = free[0].text.length >= free[1].text.length ? free : [free[1], free[0]];
  const used = new Set([name, blurb, role, phoneNode, emailNode, images[0], images.at(-1)]);
  const unused = raw.nodes.filter((n) => !used.has(n) && n.kind !== 'link' && !linkOnly(n) && !isSpacer(n));
  if (unused.length) throw new MappingError(unmapped(raw.slug, unused));
  return {
    name: name.text,
    blurb: blurb.text,
    role: role.text,
    qr: image(images[0]),
    photo: image(images.at(-1)),
    links,
    phone,
    email,
    vcard: { label: vcf.label, href: `/cards/${raw.slug}.vcf` },
    seo: seoOf(raw),
  };
}

export const toBasic = (raw) => ({ ...pageBackground(raw), seo: seoOf(raw), blocks: blocksOf(raw.nodes) });

export function mapBasic(raw) {
  const lost = notBlockable(raw.nodes);
  return { data: toBasic(raw), warnings: lost.length ? [unmapped(raw.slug, lost)] : [] };
}

function groupBySection(nodes) {
  const groups = [];
  for (const n of nodes) {
    const last = groups.at(-1);
    if (last && last.section === n.section) last.nodes.push(n);
    else groups.push({ section: n.section, nodes: [n] });
  }
  return groups;
}

function resolveTarget(m, sectionOrder, keyBySection, warn) {
  if (m.target === 'top' || m.target === 'footer') return { label: m.label, target: m.target };
  const start = sectionOrder.indexOf(m.target);
  const hit = start < 0 ? undefined : sectionOrder.slice(start).find((s) => keyBySection.has(s));
  if (!hit) warn(`menu item ${JSON.stringify(m.label)} -> ${m.target} matches no mapped section; sent to top`);
  return { label: m.label, target: hit ? keyBySection.get(hit) : 'top' };
}

// Placeholder is kept only when the field has one; a nameless field keeps name '' (named later).
const formField = ({ name, type, label, required, placeholder }) =>
  ({ name, type, label, required, ...(placeholder ? { placeholder } : {}) });

export function mapHome(raw) {
  const warnings = [];
  const warn = (msg) => warnings.push(`${raw.slug}: ${msg}`);
  const menus = raw.nodes.filter((n) => n.kind === 'anchorMenu');
  const menuNode = menus[0];
  if (menus.length > 1) warn(`extra anchor menus ignored: ${menus.slice(1).map((m) => m.items.map((i) => i.label).join('/')).join('; ')}`);
  const unusedIn = (g, used) => {
    const lost = g.nodes.filter((n) => !used.includes(n) && n.kind !== 'text' && !isSpacer(n));
    if (lost.length) warn(`unmapped nodes in section ${g.section}: ${describeNodes(lost)}`);
  };
  const groups = groupBySection(raw.nodes.filter((n) => n.kind !== 'anchorMenu'));
  const sectionOrder = groups.map((g) => g.section);
  const keyBySection = new Map();
  const slides = [];
  let allProjects;
  let contact;

  // Text in a section with no media/gallery/form (e.g. a heading strip) is carried forward to the
  // next keyed section, so no copy is dropped. A section holding only images and no link is an
  // award badge strip belonging to the previous slide, not a slide of its own.
  let pending = [];
  for (const g of groups) {
    const form = g.nodes.find((n) => n.kind === 'form');
    const gallery = g.nodes.find((n) => n.kind === 'gallery');
    const textsMd = [...pending, ...g.nodes.filter((n) => n.kind === 'text').map((n) => htmlToMarkdown(n.html)).filter(Boolean)];
    const onlyImages = g.nodes.every((n) => n.kind === 'image');
    const texts = g.nodes.filter((n) => n.kind === 'text');
    if (form) {
      unusedIn(g, [form]);
      // Rich text inside the <form> (e.g. the "Thanks for submitting!" success message) follows the section texts.
      const formMd = (form.texts ?? []).map((t) => htmlToMarkdown(t.html)).filter(Boolean);
      contact = { md: [...textsMd, ...formMd], form: { fields: form.fields.map(formField), groups: form.groups, submitLabel: form.submitLabel } };
      keyBySection.set(g.section, 'contact');
    } else if (gallery) {
      unusedIn(g, [gallery]);
      allProjects = { md: textsMd.join('\n\n'), items: galleryItems(gallery.items) };
      keyBySection.set(g.section, 'all-projects');
    } else if (onlyImages && slides.length && pending.length === 0) {
      slides.at(-1).badges.push(...g.nodes.map(image));
      continue;
    } else {
      const mediaNode = g.nodes.find((n) => n.kind === 'bgvideo') ?? g.nodes.find((n) => n.kind === 'image');
      if (!mediaNode) { unusedIn(g, texts); pending = textsMd; continue; }
      const id = `slide-${slides.length + 1}`;
      const cta = g.nodes.find((n) => n.kind === 'link');
      unusedIn(g, [mediaNode, cta, ...g.nodes.filter((n) => n.kind === 'image')]);
      slides.push({
        id,
        media: mediaNode.kind === 'bgvideo'
          ? { type: 'video', src: videoRef(mediaNode.videoId), poster: imgRef(mediaNode.poster) }
          : { type: 'image', src: imgRef(mediaNode.file), alt: mediaNode.alt },
        badges: g.nodes.filter((n) => n.kind === 'image' && n !== mediaNode).map(image),
        ...(textsMd.length ? { md: textsMd.join('\n\n') } : {}),
        ...(cta ? { cta: { label: cta.text, href: cta.href } } : {}),
      });
      keyBySection.set(g.section, id);
    }
    pending = [];
  }
  if (pending.length) warn(`trailing text with no section to attach to: ${pending.join(' / ')}`);
  if (!allProjects || !contact) throw new MappingError('home: missing gallery or form');
  const data = {
    seo: seoOf(raw),
    menu: menuNode ? menuNode.items.map((m) => resolveTarget(m, sectionOrder, keyBySection, warn)) : [],
    slides,
    allProjects,
    contact,
  };
  // The clone id (slide-n / all-projects / contact) of the keyed section at or after a Wix
  // section, or null: how anchor links into the homepage resolve (also used for site chrome).
  const targetOf = (section) => {
    const start = sectionOrder.indexOf(section);
    const hit = start < 0 ? undefined : sectionOrder.slice(start).find((s) => keyBySection.has(s));
    return hit ? keyBySection.get(hit) : null;
  };
  return { data, warnings, targetOf };
}

export const toHome = (raw) => mapHome(raw).data;
/** The homepage anchor (clone section id) a Wix section of the homepage maps to, or null. */
export const homeTarget = (raw, section) => mapHome(raw).targetOf(section);

export function mapProjectsIndex(raw) {
  const warnings = [];
  const warn = (msg) => warnings.push(`${raw.slug}: ${msg}`);
  const sections = [];
  let heading = '';
  let headingNode = null; // a heading text not yet paired with a gallery
  const lost = [];
  const keyByComp = new Map();
  const menus = raw.nodes.filter((n) => n.kind === 'anchorMenu');
  for (const n of raw.nodes) {
    if (n.kind === 'text') {
      if (isSpacer(n)) continue;
      if (headingNode) lost.push(headingNode);
      heading = n.text;
      headingNode = n;
    } else if (n.kind === 'gallery') {
      const id = `cat-${sections.length + 1}`;
      sections.push({ id, heading, items: galleryItems(n.items) });
      headingNode = null;
      if (!keyByComp.has(n.section)) keyByComp.set(n.section, id); // first category in a shared section
    } else if (n.kind !== 'anchorMenu' || n !== menus[0]) {
      lost.push(n);
    }
  }
  if (headingNode) lost.push(headingNode);
  if (lost.length) warn(`unmapped nodes: ${describeNodes(lost)}`);
  const menuNode = menus[0];
  const sectionOrder = [...new Set(raw.nodes.map((n) => n.section))];
  // On /projects every category sits in one Wix section and the menu's anchors sit in an outer
  // section, so section ids cannot tell the categories apart. Each menu label is the category
  // heading verbatim, so an exact label match picks the category; 'top'/'footer' stay as on the
  // live page, and anything unmatched falls back to the section walk.
  const byHeading = new Map(sections.map((s) => [s.heading, s.id]));
  const menu = menuNode ? menuNode.items.map((m) => {
    if (m.target === 'top' || m.target === 'footer') return { label: m.label, target: m.target };
    if (byHeading.has(m.label)) return { label: m.label, target: byHeading.get(m.label) };
    warn(`menu label ${JSON.stringify(m.label)} matches no category heading`);
    return resolveTarget(m, sectionOrder, keyByComp, warn);
  }) : [];
  return { data: { seo: seoOf(raw), menu, sections }, warnings };
}

export const toProjectsIndex = (raw) => mapProjectsIndex(raw).data;

export function toSite(raw) {
  const logo = raw.chrome.find((n) => n.kind === 'image' && /logo/i.test(n.alt)) ?? raw.chrome.find((n) => n.kind === 'image');
  if (!logo) throw new MappingError('site: no logo found');
  return {
    logo: { src: imgRef(logo.file), alt: logo.alt, href: logo.href ?? '/' },
    footer: blocksOf(raw.footer),
  };
}

const strict = (fn) => (raw) => ({ data: fn(raw), warnings: [] });
const MAPPERS = { project: ['projects', strict(toProject)], card: ['cards', strict(toCard)], basic: ['basic', mapBasic],
  home: ['home', mapHome], projectsIndex: ['projectsIndex', mapProjectsIndex] };

export function mapPage(raw) {
  const [collection, fn] = MAPPERS[classify(raw)];
  try {
    const { data, warnings } = fn(raw);
    return { collection, id: raw.slug, data, warnings };
  } catch (e) {
    if (!(e instanceof MappingError)) throw e;
    const basic = mapBasic(raw);
    return { collection: 'basic', id: raw.slug, data: basic.data, warnings: [`${e.message} — fell back to basic page`, ...basic.warnings] };
  }
}

export function applyListing(projects, index) {
  let order = 0;
  const seen = new Map();
  for (const s of index.sections) {
    for (const item of s.items) {
      if (!item.href?.startsWith('/')) continue;
      const slug = item.href.slice(1);
      if (!seen.has(slug)) seen.set(slug, { order: order++, categories: [] });
      const entry = seen.get(slug);
      if (!entry.categories.includes(s.heading)) entry.categories.push(s.heading);
    }
  }
  for (const p of projects) {
    const hit = seen.get(p.id);
    if (!hit) continue;
    p.data.listed = true;
    p.data.categories = hit.categories;
    p.data.order = hit.order;
  }
}
