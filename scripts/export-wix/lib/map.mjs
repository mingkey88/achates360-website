import { imgRef, videoRef } from './urls.mjs';
import { htmlToMarkdown } from './clean.mjs';

export const CARD_SLUGS = ['angeline', 'joseph-chan', 'donna', 'belinda', 'chuan', 'abby'];
export const BASIC_SLUGS = ['about', 'joinus'];
const BACK = /BACK TO PROJECTS/;
const COPYRIGHT = /^©\s*\d{4}$/;

export class MappingError extends Error {}

const seoOf = (raw) => ({
  title: raw.seo.title,
  description: raw.seo.description,
  ...(raw.seo.ogImage ? { ogImage: imgRef(raw.seo.ogImage) } : {}),
});

const image = (n) => ({ src: imgRef(n.file), alt: n.alt, ...(n.href ? { href: n.href } : {}) });

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
  switch (n.kind) {
    case 'text': {
      const md = htmlToMarkdown(n.html);
      return md ? { type: 'text', md } : null;
    }
    case 'image': return { type: 'image', ...image(n) };
    case 'gallery': return { type: 'gallery', items: galleryItems(n.items) };
    case 'bgvideo': return { type: 'video', src: videoRef(n.videoId), poster: imgRef(n.poster) };
    case 'embed': return { type: 'embed', provider: n.provider, id: n.id };
    case 'link': return { type: 'link', href: n.href, label: n.text };
    default: return null;
  }
}

const blocksOf = (nodes) => nodes.map(toBlock).filter(Boolean);

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
  const before = raw.nodes.slice(0, backIdx);
  const after = raw.nodes.slice(backIdx + 1);

  const heroNode = before.find((n) => n.kind === 'image' || n.kind === 'bgvideo');
  const badges = before.filter((n) => n.kind === 'image' && n !== heroNode).map(image);

  const textIdx = after.map((n, i) => (n.kind === 'text' ? i : -1)).filter((i) => i >= 0);
  if (textIdx.length === 0) throw new MappingError(`${raw.slug}: no title after back link`);
  const [titleI, clientI] = textIdx;
  const copyI = after.findIndex((n) => n.kind === 'text' && COPYRIGHT.test(n.text));

  const rest = after.filter((_, i) => i !== titleI && i !== clientI && i !== copyI);
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
    badges,
    backLink: { label: raw.nodes[backIdx].text, href: raw.nodes[backIdx].href },
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
  const textLink = (prefix) => {
    const t = texts.find((n) => n.links.some((l) => l.href.startsWith(prefix)));
    return t && { display: t.text, href: t.links.find((l) => l.href.startsWith(prefix)).href };
  };
  const phone = textLink('tel:');
  const email = textLink('mailto:');
  const vcf = links.find((l) => l.href.includes('.vcf'));
  if (!phone || !email || !vcf || images.length < 2 || texts.length < 3) {
    throw new MappingError(`${raw.slug}: not a business card layout`);
  }
  return {
    name: texts[0].text,
    blurb: texts[1].text,
    role: texts.at(-1).text,
    qr: image(images[0]),
    photo: image(images.at(-1)),
    links,
    phone,
    email,
    vcard: { label: vcf.label, href: `/cards/${raw.slug}.vcf` },
    seo: seoOf(raw),
  };
}

export const toBasic = (raw) => ({ seo: seoOf(raw), blocks: blocksOf(raw.nodes) });

function groupBySection(nodes) {
  const groups = [];
  for (const n of nodes) {
    const last = groups.at(-1);
    if (last && last.section === n.section) last.nodes.push(n);
    else groups.push({ section: n.section, nodes: [n] });
  }
  return groups;
}

function resolveTargets(menu, sectionOrder, keyBySection) {
  return menu.items.map((m) => {
    if (m.target === 'top' || m.target === 'footer') return m;
    const start = sectionOrder.indexOf(m.target);
    const hit = start < 0 ? undefined : sectionOrder.slice(start).find((s) => keyBySection.has(s));
    return { label: m.label, target: hit ? keyBySection.get(hit) : 'top' };
  });
}

// Placeholder is kept only when the field has one; a nameless field keeps name '' (named later).
const formField = ({ name, type, label, required, placeholder }) =>
  ({ name, type, label, required, ...(placeholder ? { placeholder } : {}) });

export function toHome(raw) {
  const menuNode = raw.nodes.find((n) => n.kind === 'anchorMenu');
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
    if (form) {
      // Rich text inside the <form> (e.g. the "Thanks for submitting!" success message) follows the section texts.
      const formMd = (form.texts ?? []).map((t) => htmlToMarkdown(t.html)).filter(Boolean);
      contact = { md: [...textsMd, ...formMd], form: { fields: form.fields.map(formField), groups: form.groups, submitLabel: form.submitLabel } };
      keyBySection.set(g.section, 'contact');
    } else if (gallery) {
      allProjects = { md: textsMd.join('\n\n'), items: galleryItems(gallery.items) };
      keyBySection.set(g.section, 'all-projects');
    } else if (onlyImages && slides.length && pending.length === 0) {
      slides.at(-1).badges.push(...g.nodes.map(image));
      continue;
    } else {
      const mediaNode = g.nodes.find((n) => n.kind === 'bgvideo') ?? g.nodes.find((n) => n.kind === 'image');
      if (!mediaNode) { pending = textsMd; continue; }
      const id = `slide-${slides.length + 1}`;
      const cta = g.nodes.find((n) => n.kind === 'link');
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
  if (pending.length) throw new MappingError(`home: trailing text with no section to attach to: ${pending.join(' / ')}`);
  if (!allProjects || !contact) throw new MappingError('home: missing gallery or form');
  return {
    seo: seoOf(raw),
    menu: menuNode ? resolveTargets(menuNode, sectionOrder, keyBySection) : [],
    slides,
    allProjects,
    contact,
  };
}

export function toProjectsIndex(raw) {
  const sections = [];
  let heading = '';
  const keyByComp = new Map();
  for (const n of raw.nodes) {
    if (n.kind === 'text') heading = n.text;
    if (n.kind === 'gallery') {
      const id = `cat-${sections.length + 1}`;
      sections.push({ id, heading, items: galleryItems(n.items) });
      if (!keyByComp.has(n.section)) keyByComp.set(n.section, id); // first category in a shared section
    }
  }
  const menuNode = raw.nodes.find((n) => n.kind === 'anchorMenu');
  const sectionOrder = [...new Set(raw.nodes.map((n) => n.section))];
  // On /projects every category sits in one Wix section and the menu's anchors sit in an outer
  // section, so section ids cannot tell the categories apart. Each menu label is the category
  // heading verbatim, so an exact label match picks the category; 'top'/'footer' stay as on the
  // live page, and anything unmatched falls back to the section walk.
  const byHeading = new Map(sections.map((s) => [s.heading, s.id]));
  const menu = menuNode ? resolveTargets(menuNode, sectionOrder, keyByComp).map((m, i) => {
    const orig = menuNode.items[i].target;
    if (orig === 'top' || orig === 'footer' || !byHeading.has(m.label)) return m;
    return { label: m.label, target: byHeading.get(m.label) };
  }) : [];
  return {
    seo: seoOf(raw),
    menu,
    sections,
  };
}

export function toSite(raw) {
  const logo = raw.chrome.find((n) => n.kind === 'image' && /logo/i.test(n.alt)) ?? raw.chrome.find((n) => n.kind === 'image');
  if (!logo) throw new MappingError('site: no logo found');
  return {
    logo: { src: imgRef(logo.file), alt: logo.alt, href: logo.href ?? '/' },
    footer: blocksOf(raw.footer),
  };
}

const MAPPERS = { project: ['projects', toProject], card: ['cards', toCard], basic: ['basic', toBasic],
  home: ['home', toHome], projectsIndex: ['projectsIndex', toProjectsIndex] };

export function mapPage(raw) {
  const [collection, fn] = MAPPERS[classify(raw)];
  try {
    return { collection, id: raw.slug, data: fn(raw), warnings: [] };
  } catch (e) {
    if (!(e instanceof MappingError)) throw e;
    return { collection: 'basic', id: raw.slug, data: toBasic(raw), warnings: [`${e.message} — fell back to basic page`] };
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
