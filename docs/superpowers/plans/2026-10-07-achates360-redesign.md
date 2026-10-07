# Achates 360 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Astro clone's Wix-faithful presentation layer with the approved Ariyana-inspired design: new design system, templates for every page type, a new `/services` page, an expanded `/about`, placeholder-flagged content for the new sections, and a GSAP motion layer.

**Architecture:**
- Restyle in place on branch `redesign`. Every exported content collection stays untouched.
- Seven small YAML collections (`src/content/extras/`) hold the new sections. Each entry is flagged `placeholder`, and a guard fails production builds while any remain.
- Pure logic lives in unit-tested `src/lib/*.ts`, with templates kept thin.
- `scripts/verify-dist.mjs` gains checks on the built pages.
- Motion is per-page ES modules over GSAP. Reduced-motion and no-JS fallbacks are built in.

**Tech Stack:**
- Astro 7.3.5 (content collections, `astro:assets`, `astro:env`), TypeScript
- GSAP 3.15 (ScrollTrigger, SplitText)
- `@fontsource/bebas-neue` 5.3, `@fontsource/dm-sans` 5.3
- Tests and checks: vitest, Playwright (overflow check), Node 24 (`.nvmrc`)

**Spec:** `docs/superpowers/specs/2026-10-07-achates360-redesign-design.md` (read it before starting; the plan argues from it).

## Global Constraints

### Content and copy

- **Exported content is read-only.** Never edit anything in `src/content/{projects,cards,basic,home,projectsIndex,site}/`.
- **Copy from the export is reproduced verbatim:**
  - titles, including 🏆 markers and trailing spaces
  - clients, copyright lines and menu labels
  - About and Join us text, form labels, footer text
- CSS may change case, because Bebas Neue is caps-only. Templates never rewrite the strings themselves.
- **New copy lives only in `src/content/extras/*.yaml`.** Every entry has an explicit `placeholder: true|false`, with no default.
  - New UI strings live in `strings.yaml` and are read through `text(id)` (from `loadExtras()`).
  - Never hard-code new visible copy in a template. The two exceptions are the decorative `//` before the wordmark and the staging-only `Draft` tag.
- **No invented testimonials attributed to real people.** A placeholder testimonial uses the name `Client name` and the role `Role, Company`.
- **Client names** must match a project's `client` field exactly.

### Placeholders

- On staging, every placeholder item renders `data-placeholder` plus `<DraftTag>`.
- `SITE_ENV=production` builds throw while any placeholder remains (`assertPublishable`).

### URLs and links

- 69 URLs: the 68 in `scripts/export-wix/permanent-urls.json` plus `/services`. Card slugs are permanent.
- All internal hrefs go through `withBase()` (`src/lib/paths.ts`). External links get `linkAttrs()`.

### Design tokens

- Colours, exactly:

  | Token | Value |
  |---|---|
  | `--ink` | `#151414` |
  | `--charcoal` | `#2f2e2e` |
  | `--peach` | `#ebd2c5` |
  | `--paper` | `#f6f1ee` |
  | `--white` | `#ffffff` |
  | `--black` | `#0d0d0d` |
  | `--accent` | `#ff4b1f` |
  | `--muted` | `#8f8888` |

- Text on `--accent` is always `--ink`. `--muted` is used only at 24px or larger.
- The focus ring is 2px `--ink` on light grounds and `--peach` on dark ones (`.on-dark`).
- Fonts: Bebas Neue 400 (display) and DM Sans 300/400/500 plus 400 italic (text), self-hosted via `@fontsource`. No Helvetica stand-in and no Nunito Sans.
- Radii: `--r-card: 16px`, `--r-block: 32px`, `--r-pill: 999px`. Breakpoints, mobile-first: 480 / 768 / 1024 / 1440.

### Behaviour and performance

- No horizontal page scroll from 320 to 2560px wide.
- Each page has exactly one `<h1>`, plus `.site-header` and `.site-footer`.
- At most 80 KB of JavaScript (gzipped) on any page.
- `prefers-reduced-motion: reduce` turns off reveals, pinning, counters and marquees, and stops video autoplay.
- Content is visible with JS off, and within 3 seconds if JS fails to load.
- `data-split` and `data-reveal` hooks are added as templates are built. They do nothing until Task 11.

### Every task

- Each task ends with `npm test`, `npm run build` and `npm run verify` passing (Task 10 adds `npm run check:overflow`).
- Commit messages end with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **GSAP bundle fails to load (CSP, 404, old browser).** All hidden-until-revealed content must still appear within 3s.
   - Pinned by: Task 10 page check `motionFallback`, and the Task 11 QA step that blocks JS.
2. **A case study missing a hero, client, copyright, categories or badges.** No empty meta columns. The title sits on charcoal with the header solid, and the page still has exactly one h1.
   - Every project in the 6 Oct export has a hero, but future content may not.
   - Pinned by: Task 3 `metaColumns` tests and the Task 4 scratch-entry build check.
3. **"Next project" for the last project, a project missing from the homepage order, or a neighbour that was never built (password-protected).** It wraps, falls back to `/projects`, or skips that neighbour.
   - Pinned by: Task 3 `nextProject` tests.
4. **Long titles and clients at 320px** (e.g. "Singapore Road Safety Council, Traffic Police, Automobile Association of Singapore and People's Association", "INTERNATIONAL"). No sideways scroll.
   - Pinned by: Task 10 `check:overflow` (Playwright over every page at 320 and 375).
5. **Autoplaying or looping video when the visitor paused it, prefers reduced motion, or is on a touch screen.** It stays paused; previews never start on touch.
   - Pinned by: Task 4 `shouldPlay` tests (`src/lib/video-policy.ts`).

---

## File structure

```
src/
  content.config.ts                 MODIFY: + 7 extras collections
  content/extras/                   CREATE: services, process, timeline, stats, clients, testimonials, strings (.yaml)
  lib/
    placeholders.ts (+test)         CREATE: listPlaceholders, assertPublishable, phAttr
    strings.ts (+test)              CREATE: UiString, makeText
    extras.ts                       CREATE: loadExtras() (astro-aware; not unit-tested)
    extras-content.test.ts          CREATE: content rules over the YAML + project files
    page-kind.ts                    CREATE: PageKind
    markdown.ts (+test)             MODIFY: renderMd(md, base?, { demote })
    next-project.ts (+test)         CREATE: slugOf, nextProject
    segments.ts (+test)             CREATE: toSegments (rows -> single/grid/split)
    meta.ts (+test)                 CREATE: metaColumns, firstYear
    copy.ts (+test)                 CREATE: sentenceStarting, splitRoleHeading, titleFromSeo
    video-policy.ts (+test)         CREATE: shouldPlay
    menu.ts (+test)                 CREATE: withServices
    layout.ts                       MODIFY: comment only (rows.ts still imports it)
  styles/tokens.css base.css type.css   REWRITE/CREATE
  components/
    ui/{Pill,Sticker,Chip,Eyebrow,T,DraftTag,MediaCard,HeroMedia,Marquee,StatCounter}.astro  CREATE
    Header.astro Menu.astro Footer.astro                       CREATE/REWRITE
    Block.astro                                                REWRITE
    MediaRows.astro MetaStrip.astro NextProject.astro          CREATE
    FeaturedStack.astro ServicesPreview.astro StatsBand.astro ProjectGrid.astro
    Testimonials.astro LetsConnect.astro ServiceRows.astro ProcessSteps.astro Reel.astro Timeline.astro   CREATE
    BgVideo.astro Embed.astro Player.astro ContactForm.astro   MODIFY (styles; BgVideo gains pause button)
    Logo SiteMenu MobileMenu BackToTop Blocks Gallery AnchorMenu   DELETE
  layouts/ Base Project About JoinUs Categories Page Card       REWRITE/CREATE; Basic DELETE
  pages/ index.astro projects.astro services.astro [slug].astro REWRITE/CREATE
  scripts/motion/{index,reveal,hero,stack,counters,timeline,tilt,manifest}.ts (+ motion.test.ts)  CREATE
scripts/
  verify-dist.mjs (+test)           MODIFY: extra required paths, pageChecks, jsBudget
  new-pages.json                    CREATE: ["/services"]
  check-overflow.mjs                CREATE
  layout.test.mjs                   DELETE (asserted clone CSS tokens)
CONTENT-QUERIES.md README.md        MODIFY (Task 12)
```

---

### Task 1: Extras content collections and placeholder guard

**Files:**
- Create:
  - `src/content/extras/services.yaml`, `process.yaml`, `timeline.yaml`, `stats.yaml`, `clients.yaml`, `testimonials.yaml`, `strings.yaml`
  - `src/lib/placeholders.ts`, `src/lib/strings.ts`, `src/lib/extras.ts`
- Modify: `src/content.config.ts`
- Test:
  - `src/lib/placeholders.test.ts`
  - `src/lib/strings.test.ts`
  - `src/lib/extras-content.test.ts`

**Interfaces:**
- Produces:
  - `interface Flagged { id: string; placeholder: boolean }`
  - `listPlaceholders(groups: Record<string, readonly Flagged[]>): string[]`
  - `assertPublishable(groups, env: SiteEnv): void`
  - `phAttr(p: boolean): { 'data-placeholder'?: '' }`
  - `interface UiString extends Flagged { text: string }`
  - `makeText(strings: readonly UiString[]): (id: string) => UiString`
  - `loadExtras(): Promise<Extras>`, where `Extras = { services, process, timeline, stats, clients, testimonials, strings, text }`. `services` is sorted by `order`, `process` by `step`, `timeline` and `stats` by `order`.
  - Collections: `services`, `process`, `timeline`, `stats`, `clients`, `testimonials`, `strings`.

- [ ] **Step 1: Write the failing tests for the guard and strings**

`src/lib/placeholders.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { listPlaceholders, assertPublishable, phAttr } from './placeholders';

const groups = {
  services: [{ id: 'branding', placeholder: true }, { id: 'digital', placeholder: false }],
  strings: [{ id: 'wordmark', placeholder: false }, { id: 'hero-sticker', placeholder: true }],
};

describe('listPlaceholders', () => {
  it('lists group/id of every placeholder item, sorted', () => {
    expect(listPlaceholders(groups)).toEqual(['services/branding', 'strings/hero-sticker']);
  });
  it('is empty when nothing is a placeholder', () => {
    expect(listPlaceholders({ a: [{ id: 'x', placeholder: false }] })).toEqual([]);
  });
});

describe('assertPublishable', () => {
  it('allows placeholders on staging', () => {
    expect(() => assertPublishable(groups, 'staging')).not.toThrow();
  });
  it('blocks a production build and names every placeholder', () => {
    expect(() => assertPublishable(groups, 'production')).toThrow(/services\/branding[\s\S]*strings\/hero-sticker/);
  });
  it('allows production once every item is approved', () => {
    expect(() => assertPublishable({ a: [{ id: 'x', placeholder: false }] }, 'production')).not.toThrow();
  });
});

describe('phAttr', () => {
  it('marks placeholders only', () => {
    expect(phAttr(true)).toEqual({ 'data-placeholder': '' });
    expect(phAttr(false)).toEqual({});
  });
});
```

`src/lib/strings.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { makeText } from './strings';

const text = makeText([{ id: 'wordmark', text: 'ACHATES 360', placeholder: false }]);

describe('makeText', () => {
  it('returns the string entry by id', () => {
    expect(text('wordmark')).toEqual({ id: 'wordmark', text: 'ACHATES 360', placeholder: false });
  });
  it('fails the build on an unknown id, naming the file to edit', () => {
    expect(() => text('nope')).toThrow(/"nope".*strings\.yaml/);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/lib/placeholders.test.ts src/lib/strings.test.ts`
Expected: FAIL, "Failed to resolve import './placeholders'" (and './strings').

- [ ] **Step 3: Implement `placeholders.ts` and `strings.ts`**

`src/lib/placeholders.ts`:
```ts
import type { SiteEnv } from './seo';

/** An extras entry: every new piece of copy says whether it is still a placeholder. */
export interface Flagged { id: string; placeholder: boolean }

/** "group/id" of every placeholder item, sorted. */
export function listPlaceholders(groups: Record<string, readonly Flagged[]>): string[] {
  return Object.entries(groups)
    .flatMap(([group, items]) => items.filter((i) => i.placeholder).map((i) => `${group}/${i.id}`))
    .sort();
}

/** Production builds refuse to ship unapproved copy (spec §6.3). */
export function assertPublishable(groups: Record<string, readonly Flagged[]>, env: SiteEnv): void {
  if (env !== 'production') return;
  const left = listPlaceholders(groups);
  if (left.length === 0) return;
  throw new Error(
    `Production build blocked: ${left.length} placeholder item(s) still need approved copy ` +
    `(see CONTENT-QUERIES.md, "Redesign"):\n${left.map((l) => `  - ${l}`).join('\n')}`,
  );
}

/** Attribute that marks a rendered placeholder (verify-dist rejects it in production output). */
export function phAttr(placeholder: boolean): { 'data-placeholder'?: '' } {
  return placeholder ? { 'data-placeholder': '' } : {};
}
```

`src/lib/strings.ts`:
```ts
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
```

- [ ] **Step 4: Run them and confirm they pass**

Run: `npx vitest run src/lib/placeholders.test.ts src/lib/strings.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Write the seed YAML**

`src/content/extras/services.yaml`:
```yaml
# Services (spec §4.4). Titles and bodies are placeholder copy for the Art Director / MD.
# tags: existing project category names, verbatim. project: slug whose hero is the media.
- id: branding
  order: 1
  title: Branding & Identity
  body: "[Draft] Two lines on what this service covers, to be supplied by the Art Director."
  tags: [Strategic Branding, Graphic Design, Packaging & Merchandise]
  project: notter
  placeholder: true
- id: publications
  order: 2
  title: Publications & Reports
  body: "[Draft] Two lines on what this service covers, to be supplied by the Art Director."
  tags: [Publications, Content Creation]
  project: bumitama-annual-report
- id: campaigns
  order: 3
  title: Campaigns & Promotions
  body: "[Draft] Two lines on what this service covers, to be supplied by the Art Director."
  tags: [Advertising & Promotions, Events]
  project: dxv
  placeholder: true
- id: digital
  order: 4
  title: Digital & Social
  body: "[Draft] Two lines on what this service covers, to be supplied by the Art Director."
  tags: [Digital Communications, Social Media]
  project: dbs-wealth-feed
  placeholder: true
```
**Note:** the `publications` entry above is deliberately missing `placeholder`. Step 7's schema test must catch it. Add `placeholder: true` in Step 8.

`src/content/extras/process.yaml`:
```yaml
# Process steps on /services (spec §4.4). All placeholder.
- { id: brief, step: 1, title: Brief, body: "[Draft] What happens at this step.", placeholder: true }
- { id: concept, step: 2, title: Concept, body: "[Draft] What happens at this step.", placeholder: true }
- { id: design, step: 3, title: Design, body: "[Draft] What happens at this step.", placeholder: true }
- { id: deliver, step: 4, title: Deliver, body: "[Draft] What happens at this step.", placeholder: true }
```

`src/content/extras/timeline.yaml`:
```yaml
# About timeline (spec §4.5). Year = first year of the project's copyright; label = project title;
# image = project hero. Only the body is new copy.
- { id: purple-sage, order: 1, project: purple-sage, body: "[Draft] What this milestone meant for the studio.", placeholder: true }
- { id: nokia, order: 2, project: nokia, body: "[Draft] What this milestone meant for the studio.", placeholder: true }
- { id: road-safety, order: 3, project: singaporeroadsafetycampaign, body: "[Draft] What this milestone meant for the studio.", placeholder: true }
- { id: building-memories, order: 4, project: building-memories-artbook, body: "[Draft] What this milestone meant for the studio.", placeholder: true }
- { id: dxv, order: 5, project: dxv, body: "[Draft] What this milestone meant for the studio.", placeholder: true }
- { id: notter, order: 6, project: notter, body: "[Draft] What this milestone meant for the studio.", placeholder: true }
- { id: bumitama, order: 7, project: bumitama-annual-report, body: "[Draft] What this milestone meant for the studio.", placeholder: true }
- { id: st-regis, order: 8, project: st-regis-tearoom-patisserie, body: "[Draft] What this milestone meant for the studio.", placeholder: true }
```

`src/content/extras/stats.yaml`:
```yaml
# Stats (spec §6.3). Only facts the site already states may be placeholder: false.
- { id: founded, order: 1, value: 2001, label: Founded, placeholder: false }
- { id: projects, order: 2, value: listed-projects, label: Featured projects, placeholder: false }
- { id: awards, order: 3, value: 10, suffix: "+", label: "[Draft] Awards", placeholder: true }
- { id: clients, order: 4, value: 100, suffix: "+", label: "[Draft] Clients served", placeholder: true }
```

`src/content/extras/clients.yaml`:
```yaml
# Client wall: names verbatim from projects' `client` fields. Placeholder until the MD confirms
# each client may be listed.
- { id: dbs, name: DBS Bank, placeholder: true }
- { id: samsung, name: Samsung Electronics, placeholder: true }
- { id: ritz-carlton, name: The Ritz-Carlton, placeholder: true }
- { id: st-regis, name: The St. Regis Singapore, placeholder: true }
- { id: mann-hummel, name: MANN+HUMMEL, placeholder: true }
- { id: nokia, name: Nokia, placeholder: true }
- { id: kaplan, name: Kaplan Singapore, placeholder: true }
- { id: konica-minolta, name: Konica Minolta Business Solutions Asia, placeholder: true }
- { id: parkway-pantai, name: Parkway Pantai Limited, placeholder: true }
- { id: sco, name: Singapore Chinese Orchestra Co Ltd, placeholder: true }
- { id: uel, name: United Engineers Limited, placeholder: true }
- { id: vp-bank, name: VP Bank Ltd Singapore, placeholder: true }
```

`src/content/extras/testimonials.yaml`:
```yaml
# Never attach an invented quote to a real person or client: placeholders stay generic.
- { id: t1, quote: "[Draft] A short client testimonial goes here, quoted with the client's permission.", name: Client name, role: "Role, Company", placeholder: true }
- { id: t2, quote: "[Draft] A short client testimonial goes here, quoted with the client's permission.", name: Client name, role: "Role, Company", placeholder: true }
- { id: t3, quote: "[Draft] A short client testimonial goes here, quoted with the client's permission.", name: Client name, role: "Role, Company", placeholder: true }
```

`src/content/extras/strings.yaml`:
```yaml
# Every new UI string (spec §6.2). Read in templates via text('<id>').
- { id: wordmark, text: ACHATES 360, placeholder: false }
- { id: nav-label, text: Site, placeholder: true }
- { id: menu-open, text: Menu, placeholder: true }
- { id: menu-close, text: Back to site, placeholder: true }
- { id: menu-services, text: SERVICES, placeholder: true }
- { id: video-pause, text: Pause video, placeholder: true }
- { id: video-play, text: Play video, placeholder: true }
- { id: hero-sticker, text: Since 2001, placeholder: true }
- { id: hero-tagline, text: Design is thinking made visual, placeholder: true }
- { id: featured-eyebrow, text: Selected work, placeholder: true }
- { id: intro-eyebrow, text: Inside the studio, placeholder: true }
- { id: intro-cta, text: Learn more, placeholder: true }
- { id: services-eyebrow, text: What we do, placeholder: true }
- { id: services-cta, text: All services, placeholder: true }
- { id: clients-eyebrow, text: Trusted by, placeholder: true }
- { id: testimonials-eyebrow, text: Client feedback, placeholder: true }
- { id: connect-line, text: "Let's connect and let's work together", placeholder: true }
- { id: connect-cta, text: Get in touch, placeholder: true }
- { id: next-project, text: Next project, placeholder: true }
- { id: next-fallback, text: All projects, placeholder: true }
- { id: meta-client, text: Client, placeholder: true }
- { id: meta-year, text: Year, placeholder: true }
- { id: meta-services, text: Services, placeholder: true }
- { id: meta-recognition, text: Recognition, placeholder: true }
- { id: sections-label, text: Sections, placeholder: true }
- { id: services-heading, text: Services, placeholder: true }
- { id: services-sticker, text: Full service, placeholder: true }
- { id: process-heading, text: How we work, placeholder: true }
- { id: process-step, text: Step, placeholder: true }
- { id: reel-left, text: Play, placeholder: true }
- { id: reel-right, text: Reel, placeholder: true }
- { id: about-stats-eyebrow, text: In numbers, placeholder: true }
- { id: timeline-heading, text: Our story, placeholder: true }
- { id: role-sticker, text: "We're hiring", placeholder: true }
```

- [ ] **Step 6: Register the collections**

In `src/content.config.ts`:
- Change the loaders import to `import { glob, file } from 'astro/loaders';`.
- Add the following before `export const collections`, then replace the export line.
```ts
// Redesign content (spec §6.2): one YAML file per collection. `placeholder` is required, never
// defaulted, so every entry states whether its copy is approved.
const flagged = { id: z.string(), placeholder: z.boolean() };
const services = defineCollection({
  loader: file('src/content/extras/services.yaml'),
  schema: z.object({ ...flagged, order: z.number(), title: z.string(), body: z.string(), tags: z.array(z.string()).min(1), project: z.string() }).strict(),
});
const processSteps = defineCollection({
  loader: file('src/content/extras/process.yaml'),
  schema: z.object({ ...flagged, step: z.number().int().positive(), title: z.string(), body: z.string() }).strict(),
});
const timeline = defineCollection({
  loader: file('src/content/extras/timeline.yaml'),
  schema: z.object({ ...flagged, order: z.number(), project: z.string(), body: z.string() }).strict(),
});
const stats = defineCollection({
  loader: file('src/content/extras/stats.yaml'),
  schema: z.object({ ...flagged, order: z.number(), value: z.union([z.number(), z.literal('listed-projects')]), suffix: z.string().optional(), label: z.string() }).strict(),
});
const clients = defineCollection({
  loader: file('src/content/extras/clients.yaml'),
  schema: z.object({ ...flagged, name: z.string() }).strict(),
});
const testimonials = defineCollection({
  loader: file('src/content/extras/testimonials.yaml'),
  schema: z.object({ ...flagged, quote: z.string(), name: z.string(), role: z.string() }).strict(),
});
const strings = defineCollection({
  loader: file('src/content/extras/strings.yaml'),
  schema: z.object({ ...flagged, text: z.string() }).strict(),
});

export const collections = {
  projects, cards, basic, home, projectsIndex, site,
  services, process: processSteps, timeline, stats, clients, testimonials, strings,
};
```

- [ ] **Step 7: Write the content-rule test and watch it catch the missing flag**

`src/lib/extras-content.test.ts`:
```ts
// Content rules for src/content/extras (spec §6.3), checked against the exported project files.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const root = new URL('../content/', import.meta.url);
const extras = (name: string): any[] => parse(readFileSync(new URL(`extras/${name}.yaml`, root), 'utf8'));
const front = (slug: string): any => parse(readFileSync(new URL(`projects/${slug}.md`, root), 'utf8').split(/^---$/m)[1]);
const slugs = readdirSync(new URL('projects/', root)).map((f) => f.replace(/\.md$/, ''));
const projects = slugs.map(front);
const FILES = ['services', 'process', 'timeline', 'stats', 'clients', 'testimonials', 'strings'];

describe('every extras entry', () => {
  for (const f of FILES) {
    it(`${f}.yaml: states placeholder explicitly and has a unique id`, () => {
      const items = extras(f);
      expect(items.length).toBeGreaterThan(0);
      for (const i of items) expect(typeof i.placeholder, `${f}/${i.id}`).toBe('boolean');
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    });
  }
});

describe('references to real content', () => {
  it('services and timeline point at existing projects that have a hero', () => {
    for (const i of [...extras('services'), ...extras('timeline')]) {
      expect(existsSync(new URL(`projects/${i.project}.md`, root)), i.project).toBe(true);
      expect(front(i.project).hero, `${i.project} has no hero`).toBeTruthy();
    }
  });
  it('timeline projects have a copyright year to show', () => {
    for (const i of extras('timeline')) expect(front(i.project).copyright, i.project).toMatch(/\d{4}/);
  });
  it('service tags are existing project category names, verbatim', () => {
    const categories = new Set(projects.flatMap((p) => p.categories ?? []));
    for (const s of extras('services')) for (const t of s.tags) expect(categories.has(t), t).toBe(true);
  });
  it('client names match a project client field exactly', () => {
    const names = new Set(projects.map((p) => p.client).filter(Boolean));
    for (const c of extras('clients')) expect(names.has(c.name), c.name).toBe(true);
  });
});

describe('testimonials', () => {
  it('placeholders never carry a real-looking name or role', () => {
    for (const t of extras('testimonials').filter((t) => t.placeholder)) {
      expect(t.name).toBe('Client name');
      expect(t.role).toBe('Role, Company');
    }
  });
});
```

Run: `npx vitest run src/lib/extras-content.test.ts`
Expected: FAIL on `services.yaml: states placeholder explicitly…` for `services/publications` (expected 'undefined' to be 'boolean').

- [ ] **Step 8: Fix the seed and confirm the test passes**

In `services.yaml`, add `  placeholder: true` under `project: bumitama-annual-report`.
Run: `npx vitest run src/lib/extras-content.test.ts`
Expected: PASS.

- [ ] **Step 9: Write `src/lib/extras.ts`**

```ts
import { getCollection } from 'astro:content';
import { SITE_ENV } from 'astro:env/server';
import { assertPublishable } from './placeholders';
import { makeText } from './strings';

async function load() {
  const data = (name: Parameters<typeof getCollection>[0]) => getCollection(name).then((es) => es.map((e) => e.data as any));
  const [services, process, timeline, stats, clients, testimonials, strings] = await Promise.all(
    (['services', 'process', 'timeline', 'stats', 'clients', 'testimonials', 'strings'] as const).map(data),
  );
  const groups = {
    services: services.sort((a, b) => a.order - b.order),
    process: process.sort((a, b) => a.step - b.step),
    timeline: timeline.sort((a, b) => a.order - b.order),
    stats: stats.sort((a, b) => a.order - b.order),
    clients, testimonials, strings,
  };
  assertPublishable(groups, SITE_ENV);
  return { ...groups, text: makeText(strings) };
}

let cached: ReturnType<typeof load> | undefined;
/** All redesign content, checked once per build: a production build with placeholders throws here. */
export function loadExtras() {
  return (cached ??= load());
}
export type Extras = Awaited<ReturnType<typeof load>>;
```
**Note:** `data as any` keeps this file free of seven generated entry types. The templates read fields named in the schemas above.

- [ ] **Step 10: Prove the collections build, and that production is blocked**

Run: `npm test && npm run build && npm run verify`
Expected: all PASS. Nothing calls `loadExtras()` yet, so the build just validates the YAML against the schemas.

Then add a temporary call to prove the guard fires. Add this line at the end of the frontmatter of `src/pages/robots.txt.ts`:
`import { loadExtras } from '../lib/extras'; await loadExtras();`
Run: `SITE_ENV=production npx astro build`
Expected: FAIL with "Production build blocked: N placeholder item(s)…", listing `clients/dbs`, `services/branding` and so on.
Revert the temporary line: `git checkout src/pages/robots.txt.ts`.

- [ ] **Step 11: Commit**

```bash
git add src/content/extras src/content.config.ts src/lib/placeholders.ts src/lib/placeholders.test.ts src/lib/strings.ts src/lib/strings.test.ts src/lib/extras.ts src/lib/extras-content.test.ts
git commit -m "Extras collections for the redesign with placeholder guard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Design foundation: tokens, base layout, header, menu, footer

**Files:**
- Create:
  - `src/styles/type.css`, `src/lib/page-kind.ts`
  - `src/components/{Header,Menu}.astro`
  - `src/components/ui/{T,DraftTag}.astro`
- Rewrite:
  - `src/styles/tokens.css`, `src/styles/base.css`
  - `src/layouts/Base.astro`, `src/components/Footer.astro`
- Delete:
  - `src/components/{Logo,SiteMenu,MobileMenu,BackToTop}.astro`
  - `scripts/layout.test.mjs`
- Modify: `src/lib/layout.ts` (comment), `package.json` (deps)

**Interfaces:**
- Consumes: `loadExtras()`, `UiString` (Task 1); `withBase`, `linkAttrs`, `menuCurrent`, `pagePath` (paths.ts); `renderMd` (markdown.ts).
- Produces:
  - `type PageKind = 'home'|'project'|'projects'|'categories'|'services'|'about'|'joinus'|'page'|'card'`
  - `<Base title description? ogImage? page? overHero? bodyClass? background?>`. `page` defaults to `'page'`, and `bodyClass`/`background` are transitional until Task 7.
  - `<T s={UiString} />` renders the text plus a DraftTag when it's a placeholder.
  - `<DraftTag when={boolean} />`
  - Global classes: `.wrap .section .display .mega .h1 .h2 .h3 .label .lead .prose .on-dark .sr-only`
  - CSS tokens per Global Constraints, plus:
    - spacing `--s-1…--s-11` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192px
    - `--gutter`, `--section-y`, `--header-h: 64px`, `--max: 1440px`, `--ease-out`
    - font tokens `--font-display`, `--font-text`, sizes `--fs-*`

- [ ] **Step 1: Install fonts and GSAP**

Run: `npm install gsap@3.15.0 @fontsource/bebas-neue@5.3.0 @fontsource/dm-sans@5.3.0`
Expected: `package.json` dependencies gain the three packages. Leave `@fontsource/nunito-sans` in place, because the old homepage and cards still import it until Tasks 5 and 7.

- [ ] **Step 2: Remove the clone geometry test**

`scripts/layout.test.mjs` asserts the clone's CSS tokens (`--page-max`), which are going away. `rows.ts` still uses `layout.ts`.
```bash
git rm scripts/layout.test.mjs
```
In `src/lib/layout.ts`, replace the first comment block with:
```ts
/**
 * Wix page geometry at the 1440 render, used by src/lib/rows.ts to read the exported layout boxes
 * (which blocks sat side by side). The redesign's CSS no longer mirrors these numbers.
 */
```

- [ ] **Step 3: Write the tokens, base and type styles**

`src/styles/tokens.css`:
```css
/* Design tokens (spec §3). Light only: the site has no dark theme. */
:root {
  --ink: #151414;
  --charcoal: #2f2e2e;
  --peach: #ebd2c5;
  --paper: #f6f1ee;
  --white: #ffffff;
  --black: #0d0d0d;
  --accent: #ff4b1f;
  --muted: #8f8888;
  --line: rgb(21 20 20 / .12);

  --font-display: 'Bebas Neue', Impact, 'Arial Narrow', sans-serif;
  --font-text: 'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --fs-mega: min(19.5vw, 24rem);
  --fs-h1: clamp(3rem, 1.5rem + 8vw, 10rem);
  --fs-h2: clamp(2.75rem, 1.5rem + 5vw, 6rem);
  --fs-h3: clamp(1.75rem, 1.25rem + 2vw, 3rem);
  --fs-lead: clamp(1.125rem, 1rem + .6vw, 1.625rem);
  --fs-body: clamp(1rem, .95rem + .2vw, 1.125rem);
  --fs-small: clamp(.75rem, .7rem + .2vw, .875rem);
  --fs-label: .6875rem;
  --lh-display: .88;
  --lh-body: 1.55;

  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px;
  --s-7: 48px; --s-8: 64px; --s-9: 96px; --s-10: 128px; --s-11: 192px;
  --gutter: clamp(16px, 4vw, 60px);
  --section-y: clamp(64px, 10vw, 160px);
  --max: 1440px;
  --header-h: 64px;

  --r-card: 16px;
  --r-block: 32px;
  --r-pill: 999px;
  --ease-out: cubic-bezier(.22, 1, .36, 1);
}
```

`src/styles/base.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--paper); color: var(--ink);
  font: 400 var(--fs-body) / var(--lh-body) var(--font-text);
  overflow-x: clip;
}
img, video, svg { display: block; max-width: 100%; }
a { color: inherit; }
button { font: inherit; }
:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
.on-dark :focus-visible { outline-color: var(--peach); }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
}
.wrap { width: min(100% - 2 * var(--gutter), var(--max)); margin-inline: auto; }
.section { padding-block: var(--section-y); }
.on-dark { background: var(--charcoal); color: var(--peach); }
/* Pages without a hero start below the fixed header. */
body:not([data-over-hero]) > main { padding-top: calc(var(--header-h) + env(safe-area-inset-top, 0px)); }
```

`src/styles/type.css`:
```css
.display {
  margin: 0; font-family: var(--font-display); font-weight: 400; line-height: var(--lh-display);
  letter-spacing: .005em; text-wrap: balance; overflow-wrap: anywhere;
}
.mega { font-size: var(--fs-mega); line-height: .82; }
.h1 { font-size: var(--fs-h1); }
.h2 { font-size: var(--fs-h2); }
.h3 { font-size: var(--fs-h3); line-height: .95; }
.label { font-size: var(--fs-label); letter-spacing: .1em; text-transform: uppercase; font-weight: 500; }
.lead { font-size: var(--fs-lead); line-height: 1.35; font-weight: 300; }
.prose { max-width: 68ch; overflow-wrap: anywhere; }
.prose > :first-child { margin-top: 0; }
.prose > :last-child { margin-bottom: 0; }
.prose :is(p, ul, ol) { margin: 0 0 1em; }
.prose :is(h1, h2, h3, h4, h5, h6) { font: 400 var(--fs-h3) / .95 var(--font-display); margin: 1.2em 0 .4em; text-wrap: balance; }
.prose a { text-decoration-color: var(--accent); text-underline-offset: 3px; }
.prose li::marker { color: var(--accent); }
```

- [ ] **Step 4: Write `page-kind.ts`, `T` and `DraftTag`**

`src/lib/page-kind.ts`:
```ts
/** Which template built a page: set as <body data-page>, and keys the motion manifest (Task 11). */
export type PageKind = 'home' | 'project' | 'projects' | 'categories' | 'services' | 'about' | 'joinus' | 'page' | 'card';
```

`src/components/ui/DraftTag.astro`:
```astro
---
import { SITE_ENV } from 'astro:env/server';
// Staging-only marker on placeholder copy (spec §6.3). Production builds never get this far with
// placeholders (assertPublishable), and the tag is never rendered there.
interface Props { when: boolean }
const show = Astro.props.when && SITE_ENV !== 'production';
---
{show && <span class="draft-tag" aria-hidden="true">Draft</span>}
<style>
  .draft-tag {
    display: inline-block; margin-left: .4em; padding: 1px 6px; vertical-align: .6em;
    border: 1px dashed currentColor; border-radius: 4px;
    font: 500 9px/1.3 var(--font-text); letter-spacing: .1em; text-transform: uppercase; opacity: .8;
  }
</style>
```

`src/components/ui/T.astro`:
```astro
---
import DraftTag from './DraftTag.astro';
import type { UiString } from '../../lib/strings';
interface Props { s: UiString }
const { s } = Astro.props;
---
<span data-placeholder={s.placeholder ? '' : undefined}>{s.text}<DraftTag when={s.placeholder} /></span>
```

- [ ] **Step 5: Write the header**

`src/components/Header.astro`:
```astro
---
import { withBase, menuCurrent } from '../lib/paths';
import type { UiString } from '../lib/strings';
interface Link { label: string; href: string }
interface Props { menu: (Link & { items?: Link[] })[]; path: string; overHero: boolean; wordmark: UiString; menuLabel: UiString; navLabel: UiString }
const { menu, path, overHero, wordmark, menuLabel, navLabel } = Astro.props;
---
<header class="site-header" data-over-hero={overHero ? '' : undefined}>
  <div class="bar">
    <a class="wordmark" href={withBase('/')}><span aria-hidden="true">//&nbsp;</span>{wordmark.text}</a>
    <nav class="primary" aria-label={navLabel.text}>
      <ul>
        {menu.map((it) => {
          const current = menuCurrent(it, path);
          return (
            <li><a href={withBase(it.href)} aria-current={current === 'page' ? 'page' : undefined} data-current={current ?? undefined}>{it.label}</a></li>
          );
        })}
      </ul>
    </nav>
    <button class="menu-open" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="site-menu">
      <span class="sr-only">{menuLabel.text}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18M3 16h18" /></svg>
    </button>
  </div>
</header>
<script>
  // Solid after 80px of scroll (or always, without a hero); hides while scrolling down, returns on
  // scroll up or when anything in it takes keyboard focus.
  const header = document.querySelector<HTMLElement>('.site-header');
  if (header) {
    let last = window.scrollY;
    const update = () => {
      const y = window.scrollY;
      header.classList.toggle('is-solid', y > 80 || !header.hasAttribute('data-over-hero'));
      header.classList.toggle('is-hidden', y > last && y > 240 && !header.contains(document.activeElement));
      last = y;
    };
    window.addEventListener('scroll', update, { passive: true });
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
    update();
  }
</script>
<style>
  .site-header {
    position: fixed; inset: 0 0 auto; z-index: 50; padding-top: env(safe-area-inset-top, 0px);
    color: var(--ink); transition: transform .35s var(--ease-out), background-color .25s, color .25s;
  }
  .site-header[data-over-hero]:not(.is-solid) { color: var(--white); }
  .site-header.is-solid { background: var(--paper); box-shadow: 0 1px 0 var(--line); }
  .site-header.is-hidden { transform: translateY(-100%); }
  .bar { display: flex; align-items: center; gap: var(--s-5); height: var(--header-h); padding-inline: var(--gutter); }
  .wordmark { margin-right: auto; font: 400 1.625rem/1 var(--font-display); letter-spacing: .02em; text-decoration: none; white-space: nowrap; }
  .primary ul { display: none; list-style: none; margin: 0; padding: 0; gap: var(--s-5); }
  .primary a { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-small); font-weight: 500; letter-spacing: .08em; text-decoration: none; }
  .primary a::before { content: ''; width: 7px; height: 7px; border: 1.5px solid currentColor; border-radius: 50%; }
  .primary a[data-current]::before { background: currentColor; }
  .primary a:hover { text-decoration: underline; text-underline-offset: 4px; }
  .menu-open { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%; background: none; color: inherit; cursor: pointer; }
  .menu-open svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.6; }
  .site-header[data-over-hero]:not(.is-solid) :focus-visible { outline-color: var(--white); }
  @media (min-width: 1024px) { .primary ul { display: flex; } }
  @media (prefers-reduced-motion: reduce) { .site-header { transition: none; } }
</style>
```

- [ ] **Step 6: Write the full-screen menu**

`src/components/Menu.astro`:
```astro
---
import { withBase, linkAttrs, menuCurrent } from '../lib/paths';
import type { UiString } from '../lib/strings';
interface Link { label: string; href: string }
interface Props { menu: (Link & { items?: Link[] })[]; social: { alt: string; href: string }[]; path: string; closeLabel: UiString; navLabel: UiString }
const { menu, social, path, closeLabel, navLabel } = Astro.props;
---
<dialog id="site-menu" class="site-menu on-dark">
  <div class="inner wrap">
    <button class="menu-close" type="button">
      <span class="sr-only">{closeLabel.text}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
    </button>
    <nav aria-label={navLabel.text}>
      <ul class="top">
        {menu.map((it) => (
          <li>
            <a class="big" href={withBase(it.href)} aria-current={menuCurrent(it, path) === 'page' ? 'page' : undefined}>{it.label}</a>
            {it.items && it.items.length > 0 && (
              <ul class="sub" aria-label={it.label}>
                {it.items.map((s) => <li><a href={withBase(s.href)} aria-current={s.href === path ? 'page' : undefined}>{s.label}</a></li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
    {social.length > 0 && (
      <ul class="social">{social.map((s) => <li><a href={withBase(s.href)} {...linkAttrs(s.href)}>{s.alt}</a></li>)}</ul>
    )}
  </div>
</dialog>
<script>
  const dialog = document.querySelector<HTMLDialogElement>('#site-menu');
  const opener = document.querySelector<HTMLButtonElement>('.menu-open');
  if (dialog && opener) {
    opener.addEventListener('click', () => { dialog.showModal(); opener.setAttribute('aria-expanded', 'true'); });
    dialog.querySelector('.menu-close')!.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { opener.setAttribute('aria-expanded', 'false'); opener.focus(); });
    // An in-page link (e.g. /#contact while on the homepage) must close the menu too.
    dialog.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) dialog.close(); });
  }
</script>
<style>
  .site-menu {
    position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none;
    margin: 0; padding: 0; border: 0; overflow-y: auto; overscroll-behavior: contain;
  }
  .site-menu::backdrop { background: rgb(13 13 13 / .6); }
  .inner { display: grid; gap: var(--s-7); padding-block: calc(var(--header-h) + var(--s-6)) var(--s-8); }
  .menu-close {
    position: fixed; top: calc(10px + env(safe-area-inset-top, 0px)); right: var(--gutter);
    width: 44px; height: 44px; display: grid; place-items: center; padding: 0;
    border: 1.5px solid currentColor; border-radius: 50%; background: none; color: inherit; cursor: pointer;
  }
  .menu-close svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 1.8; }
  ul { list-style: none; margin: 0; padding: 0; }
  .top { display: grid; gap: var(--s-3); }
  .big { font: 400 clamp(3rem, 2rem + 6vw, 7.5rem)/.9 var(--font-display); text-decoration: none; overflow-wrap: anywhere; }
  .big:hover, .big[aria-current] { color: var(--accent); }
  .sub { columns: 2 220px; column-gap: var(--s-6); margin: var(--s-4) 0 var(--s-5); font-size: var(--fs-small); }
  .sub li { break-inside: avoid; padding-block: 3px; }
  .sub a { text-decoration: none; opacity: .85; }
  .sub a:hover, .sub a[aria-current] { opacity: 1; text-decoration: underline; }
  .social { display: flex; flex-wrap: wrap; gap: var(--s-5); font-size: var(--fs-small); letter-spacing: .08em; text-transform: uppercase; }
</style>
```

- [ ] **Step 7: Rewrite the footer**

`src/components/Footer.astro`:
```astro
---
import { renderMd } from '../lib/markdown';
import { withBase, linkAttrs } from '../lib/paths';
import type { UiString } from '../lib/strings';
interface Props { blocks: any[]; wordmark: UiString }
const { blocks, wordmark } = Astro.props;
// site.md footer blocks, verbatim: the intro line, then the legal lines; each "###### Label" text
// block (Contact, Social) opens a column. Social icons become text links named by their alt text.
const isLabel = (b: any) => b.type === 'text' && /^#{6}\s/.test(b.md);
const columns: any[][] = [[]];
for (const b of blocks) {
  if (isLabel(b)) columns.push([]);
  columns.at(-1)!.push(b);
}
const [[intro, ...legal], ...rest] = columns;
---
<footer class="site-footer">
  <div class="wrap grid">
    {intro && <div class="intro" set:html={renderMd(intro.md)} />}
    {rest.map((col) => (
      <div class="col">
        {col.filter((b) => b.type === 'text').map((b) => <div class="md" set:html={renderMd(b.md)} />)}
        {col.some((b) => b.type === 'image') && (
          <ul class="social">
            {col.filter((b) => b.type === 'image').map((b) => (
              <li>{b.href ? <a href={withBase(b.href)} {...linkAttrs(b.href)}>{b.alt}</a> : <span>{b.alt}</span>}</li>
            ))}
          </ul>
        )}
      </div>
    ))}
    <div class="legal">{legal.map((b) => <div class="md" set:html={renderMd(b.md)} />)}</div>
  </div>
  <p class="mega-mark" aria-hidden="true">{wordmark.text}</p>
</footer>
<style>
  .site-footer { background: var(--black); color: #e9e4e1; padding-top: var(--section-y); overflow: hidden; }
  .site-footer :focus-visible { outline-color: var(--peach); }
  .grid { display: grid; gap: var(--s-7); grid-template-columns: minmax(0, 1fr); }
  .intro :global(:is(h1, h2, h3, h4, h5, h6)) { margin: 0; font: 400 var(--fs-h3)/.95 var(--font-display); max-width: 18ch; text-wrap: balance; }
  .col { display: grid; gap: var(--s-3); align-content: start; font-size: var(--fs-small); }
  .md :global(h6) { margin: 0 0 var(--s-2); font: 500 var(--fs-label)/1 var(--font-text); letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
  .md :global(h5) { margin: 0; font: 400 var(--fs-small)/1.6 var(--font-text); }
  .md :global(p) { margin: 0; }
  .md :global(a), .social a { text-decoration-color: var(--accent); text-underline-offset: 3px; }
  .social { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); text-transform: uppercase; letter-spacing: .08em; }
  .legal { font-size: var(--fs-label); color: var(--muted); }
  .mega-mark {
    margin: var(--s-8) 0 0; padding-inline: var(--gutter); white-space: nowrap;
    font: 400 var(--fs-mega)/.78 var(--font-display);
    background: linear-gradient(180deg, #fff 10%, rgb(255 255 255 / 0) 95%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  @media (min-width: 768px) {
    .grid { grid-template-columns: 2fr repeat(auto-fit, minmax(160px, 1fr)); }
    .legal { grid-column: 1 / -1; }
  }
</style>
```

- [ ] **Step 8: Rewrite `Base.astro`**

```astro
---
import { getEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import { SITE_ENV } from 'astro:env/server';
import { robotsMeta, canonicalUrl } from '../lib/seo';
import { pagePath } from '../lib/paths';
import { loadExtras } from '../lib/extras';
import type { PageKind } from '../lib/page-kind';
import Header from '../components/Header.astro';
import Menu from '../components/Menu.astro';
import Footer from '../components/Footer.astro';
import '@fontsource/bebas-neue/400.css';
import '@fontsource/dm-sans/300.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/400-italic.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/type.css';

// overHero: the page opens with a full-bleed hero, so the header starts transparent over it.
// bodyClass/background: only for clone templates not yet redesigned (removed in Task 7).
interface Props { title: string; description?: string; ogImage?: ImageMetadata; page?: PageKind; overHero?: boolean; bodyClass?: string; background?: string }
const { title, description, ogImage, page = 'page', overHero = false, bodyClass, background } = Astro.props;
const site = (await getEntry('site', 'site'))!.data;
const { text } = await loadExtras();
const robots = robotsMeta(SITE_ENV);
const og = ogImage ? new URL((await getImage({ src: ogImage, width: 1200, format: 'jpg' })).src, Astro.site).href : undefined;
const canonical = canonicalUrl(Astro.url.pathname, Astro.site!, import.meta.env.BASE_URL);
const path = pagePath(Astro.url.pathname);
const icon = async (w: number) => site.favicon && (await getImage({ src: site.favicon.src, width: w, height: w, format: 'png' })).src;
const [icon32, icon192, icon180] = await Promise.all([icon(32), icon(192), icon(180)]);
const menu = site.menu ?? [];
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {robots && <meta name="robots" content={robots} />}
    <link rel="canonical" href={canonical} />
    {icon32 && <link rel="icon" href={icon32} sizes="32x32" type="image/png" />}
    {icon192 && <link rel="icon" href={icon192} sizes="192x192" type="image/png" />}
    {icon180 && <link rel="apple-touch-icon" href={icon180} />}
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
    {og && <meta property="og:image" content={og} />}
    <meta property="og:site_name" content="Achates 360" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#f6f1ee" />
    {/* `js` gates hidden-until-revealed styles; motion-ready lifts them. If the motion bundle never
        arrives, the timeout lifts them after 3s so nothing stays invisible (Review Focus 1). */}
    <script is:inline>document.documentElement.classList.add('js');setTimeout(function(){document.documentElement.classList.add('motion-ready')},3000);</script>
  </head>
  <body data-page={page} data-over-hero={overHero ? '' : undefined} class={bodyClass} style={background ? `background: ${background}` : undefined}>
    <Header menu={menu} path={path} overHero={overHero} wordmark={text('wordmark')} menuLabel={text('menu-open')} navLabel={text('nav-label')} />
    <Menu menu={menu} social={site.menuSocial ?? []} path={path} closeLabel={text('menu-close')} navLabel={text('nav-label')} />
    <main id="main"><slot /></main>
    <Footer blocks={site.footer} wordmark={text('wordmark')} />
  </body>
</html>
```
Then delete the old chrome:
```bash
git rm src/components/Logo.astro src/components/SiteMenu.astro src/components/MobileMenu.astro src/components/BackToTop.astro
```

- [ ] **Step 9: Build, verify and look**

Run: `npm test && npm run build && npm run verify`
Expected: PASS, with 68/68 pages. The old page bodies will look unstyled at this stage, because they still use clone tokens; that's expected until Tasks 4–7.

Run `npm run preview`, open `http://localhost:4321/achates360-website/about`, and check:
- the header shows "// ACHATES 360" and the five menu labels at ≥1024px
- the menu button opens a charcoal full-screen dialog listing the PROJECTS sub-items
- the black footer ends in the faded wordmark

- [ ] **Step 10: Commit**

```bash
git add -A src/styles src/lib/page-kind.ts src/lib/layout.ts src/components src/layouts/Base.astro package.json package-lock.json
git commit -m "Redesign foundation: tokens, type, header, full-screen menu, footer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Pure helpers: markdown demote, next project, segments, meta, copy, video policy

**Files:**
- Modify: `src/lib/markdown.ts`, `src/lib/markdown.test.ts`
- Create, each with a `.test.ts`:
  - `src/lib/next-project.ts`
  - `src/lib/segments.ts`
  - `src/lib/meta.ts`
  - `src/lib/copy.ts`
  - `src/lib/video-policy.ts`

**Interfaces:**
- Produces:
  - `renderMd(md: string, base?: string, opts?: { demote?: number }): string`
  - `slugOf(href: string | undefined): string | null`
  - `nextProject(slug: string, order: readonly string[], exists: (s: string) => boolean): string | null`
  - `type Segment<T> = { kind: 'single'; block: T } | { kind: 'grid'; blocks: T[]; cols: 2 | 3 } | { kind: 'split'; blocks: T[] }`
  - `toSegments<T extends Boxed & { type: string }>(blocks: T[]): Segment<T>[]`
  - `type MetaKey = 'client' | 'year' | 'services' | 'recognition'`
  - `metaColumns(d: { client?: string; copyright?: string; categories: readonly string[]; badges: readonly unknown[] }): MetaKey[]`
  - `firstYear(copyright?: string): string | null`
  - `sentenceStarting(md: string, prefix: string): string | null`
  - `splitRoleHeading(md: string): { title: string; rest: string } | null`
  - `titleFromSeo(t: string): string`
  - `shouldPlay(s: { onScreen: boolean; reduced: boolean; userPaused: boolean; allowedHere: boolean }): boolean`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/markdown.test.ts`:
```ts
describe('renderMd demote', () => {
  it('shifts heading levels so page structure keeps one h1', () => {
    expect(renderMd('# Red Packets', '/', { demote: 2 })).toContain('<h3');
  });
  it('never goes past h6', () => {
    expect(renderMd('##### Contact', '/', { demote: 3 })).toContain('<h6');
  });
  it('leaves headings alone by default', () => {
    expect(renderMd('# Join us', '/')).toContain('<h1');
  });
});
```

`src/lib/next-project.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { slugOf, nextProject } from './next-project';

const order = ['dbs-affluent-segment-ai-assets', 'mannhummel', 'copy-of-international-green-building', 'notter'];
const built = new Set(['dbs-affluent-segment-ai-assets', 'mannhummel', 'notter', 'infographics']);
const exists = (s: string) => built.has(s);

describe('slugOf', () => {
  it('reads a homepage case-study link', () => expect(slugOf('/notter')).toBe('notter'));
  it('ignores the homepage, anchors, external links and nested paths', () => {
    for (const h of ['/', '/#contact', 'https://x.com/a', '/a/b', undefined]) expect(slugOf(h)).toBeNull();
  });
});

describe('nextProject', () => {
  it('returns the next project in homepage order', () => {
    expect(nextProject('dbs-affluent-segment-ai-assets', order, exists)).toBe('mannhummel');
  });
  it('skips a neighbour that was never built (password-protected page)', () => {
    expect(nextProject('mannhummel', order, exists)).toBe('notter');
  });
  it('wraps from the last project to the first', () => {
    expect(nextProject('notter', order, exists)).toBe('dbs-affluent-segment-ai-assets');
  });
  it('is null for a project missing from the homepage order (band links to /projects)', () => {
    expect(nextProject('infographics', order, exists)).toBeNull();
  });
  it('is null when there is nothing else to go to', () => {
    expect(nextProject('notter', ['notter', 'notter'], exists)).toBeNull();
  });
});
```

`src/lib/segments.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { toSegments } from './segments';

const at = (type: string, x: number, y: number, w = 300, h = 200) => ({ type, box: { x, y, w, h } });

describe('toSegments', () => {
  it('keeps a lone block as a single segment', () => {
    const t = { type: 'text' };
    expect(toSegments([t])).toEqual([{ kind: 'single', block: t }]);
  });
  it('makes side-by-side media a grid: 2 and 4 in two columns, 3, 5 and 6 in three', () => {
    const row = (n: number) => Array.from({ length: n }, (_, i) => at('image', 240 + i * 160, 100, 150, 150));
    expect(toSegments(row(2))[0]).toMatchObject({ kind: 'grid', cols: 2 });
    expect(toSegments(row(3))[0]).toMatchObject({ kind: 'grid', cols: 3 });
    expect(toSegments(row(4))[0]).toMatchObject({ kind: 'grid', cols: 2 });
    expect(toSegments(row(5))[0]).toMatchObject({ kind: 'grid', cols: 3 });
  });
  it('makes text beside media a split row', () => {
    const segs = toSegments([at('text', 240, 100, 400), at('image', 700, 100, 400)]);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind).toBe('split');
  });
  it('stacks blocks that sit one under another', () => {
    const segs = toSegments([at('image', 240, 100), at('image', 240, 400)]);
    expect(segs.map((s) => s.kind)).toEqual(['single', 'single']);
  });
});
```

`src/lib/meta.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { metaColumns, firstYear } from './meta';

describe('metaColumns', () => {
  it('lists every filled column in order', () => {
    expect(metaColumns({ client: 'Artisan Super Food', copyright: '© 2020', categories: ['Graphic Design'], badges: [{}] }))
      .toEqual(['client', 'year', 'services', 'recognition']);
  });
  it('omits empty columns (no client, blank copyright, no categories, no badges)', () => {
    expect(metaColumns({ client: '  ', copyright: undefined, categories: [], badges: [] })).toEqual([]);
    expect(metaColumns({ categories: ['Events'], badges: [] })).toEqual(['services']);
  });
});

describe('firstYear', () => {
  it('reads the first year of a range in either dash', () => {
    expect(firstYear('© 2000 - 2014')).toBe('2000');
    expect(firstYear('© 2013 – 2016')).toBe('2013');
    expect(firstYear('© 2020')).toBe('2020');
  });
  it('is null without a year', () => {
    expect(firstYear(undefined)).toBeNull();
    expect(firstYear('©')).toBeNull();
  });
});
```

`src/lib/copy.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sentenceStarting, splitRoleHeading, titleFromSeo } from './copy';

const about = 'We are an integrated creative agency.  \n \n\nThe name Achates 360 reflects our company philosophy of being a faithful companion and trusted friend to our clients. Relationships are central to our company’s ethos.  \n​\n\nBelieving that design is thinking made visual.';

describe('sentenceStarting', () => {
  it('returns the first sentence of the paragraph that starts with the prefix, verbatim', () => {
    expect(sentenceStarting(about, 'The name Achates 360')).toBe('The name Achates 360 reflects our company philosophy of being a faithful companion and trusted friend to our clients.');
  });
  it('is null when no paragraph starts with the prefix', () => {
    expect(sentenceStarting(about, 'Since starting')).toBeNull();
  });
});

describe('splitRoleHeading', () => {
  it('takes the first heading as the role title without markdown markers', () => {
    const md = '#### **CLIENT ACCOUNT EXECUTIVE / MANAGER** \n\n**Job Description**\n\nThe Account Executive…';
    expect(splitRoleHeading(md)).toEqual({ title: 'CLIENT ACCOUNT EXECUTIVE / MANAGER', rest: '**Job Description**\n\nThe Account Executive…' });
  });
  it('is null without a heading', () => expect(splitRoleHeading('Just text')).toBeNull());
});

describe('titleFromSeo', () => {
  it('drops the site suffix', () => expect(titleFromSeo('Project Categories | Achates 360')).toBe('Project Categories'));
  it('keeps a title without a suffix', () => expect(titleFromSeo('Projects')).toBe('Projects'));
});
```

`src/lib/video-policy.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { shouldPlay } from './video-policy';

const base = { onScreen: true, reduced: false, userPaused: false, allowedHere: true };

describe('shouldPlay', () => {
  it('plays an on-screen video when nothing forbids it', () => expect(shouldPlay(base)).toBe(true));
  it('never plays off screen', () => expect(shouldPlay({ ...base, onScreen: false })).toBe(false));
  it('never autoplays under reduced motion', () => expect(shouldPlay({ ...base, reduced: true })).toBe(false));
  it('stays paused after the visitor paused it, even when it scrolls back on screen', () => {
    expect(shouldPlay({ ...base, userPaused: true })).toBe(false);
  });
  it('does not play where the layout does not load it (desktop-only video on a phone)', () => {
    expect(shouldPlay({ ...base, allowedHere: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npx vitest run src/lib`
Expected: FAIL. The new files can't be resolved, and the demote test fails because `<h1` is rendered instead of `<h3`.

- [ ] **Step 3: Implement**

`src/lib/markdown.ts`: change the signature to `export function renderMd(md: string, base?: string, opts: { demote?: number } = {}): string`, and extend `walkTokens`:
```ts
    walkTokens(token) {
      if (token.type === 'link') token.href = withBase(token.href, base);
      // demote: shift heading levels (e.g. a homepage slide's "# …" inside a card) so each page
      // keeps a single h1. The words are untouched.
      if (token.type === 'heading' && opts.demote) token.depth = Math.min(6, token.depth + opts.demote);
    },
```

`src/lib/next-project.ts`:
```ts
/** Slug of a homepage link to a case study ("/notter" -> "notter"); null for anything else. */
export function slugOf(href: string | undefined): string | null {
  const m = href?.match(/^\/([a-z0-9-]+)$/i);
  return m ? m[1] : null;
}

/**
 * The case study after `slug` in the homepage's All Projects order (spec §4.2), wrapping from the
 * last to the first, among slugs that were built. Null when `slug` is not in that order or nothing
 * else remains: the band then links to /projects.
 */
export function nextProject(slug: string, order: readonly string[], exists: (s: string) => boolean): string | null {
  const seq = [...new Set(order)].filter(exists);
  const i = seq.indexOf(slug);
  if (i === -1 || seq.length < 2) return null;
  return seq[(i + 1) % seq.length];
}
```

`src/lib/segments.ts`:
```ts
import { groupRows, type Boxed } from './rows';

/** How a case study lays out one Wix row (spec §4.2). */
export type Segment<T> =
  | { kind: 'single'; block: T }
  | { kind: 'grid'; blocks: T[]; cols: 2 | 3 }
  | { kind: 'split'; blocks: T[] };

const GRIDDABLE = new Set(['image', 'video', 'embed']);

/**
 * Wix's side-by-side arrangements (rows.ts groupRows) become: one block on its own; media side by
 * side as a 2- or 3-column grid (4 → 2×2; 5 and 6 → rows of 3); anything mixing text with media as
 * a split row.
 */
export function toSegments<T extends Boxed & { type: string }>(blocks: T[]): Segment<T>[] {
  return groupRows(blocks).map((row): Segment<T> => {
    if (row.length === 1) return { kind: 'single', block: row[0] };
    if (row.every((b) => GRIDDABLE.has(b.type))) return { kind: 'grid', blocks: row, cols: row.length === 2 || row.length === 4 ? 2 : 3 };
    return { kind: 'split', blocks: row };
  });
}
```

`src/lib/meta.ts`:
```ts
export type MetaKey = 'client' | 'year' | 'services' | 'recognition';

/** The case-study meta strip's columns (spec §4.2): empty ones are omitted. */
export function metaColumns(d: { client?: string; copyright?: string; categories: readonly string[]; badges: readonly unknown[] }): MetaKey[] {
  const out: MetaKey[] = [];
  if (d.client?.trim()) out.push('client');
  if (d.copyright?.trim()) out.push('year');
  if (d.categories.length) out.push('services');
  if (d.badges.length) out.push('recognition');
  return out;
}

/** "© 2013 – 2016" → "2013". */
export function firstYear(copyright?: string): string | null {
  return copyright?.match(/\d{4}/)?.[0] ?? null;
}
```

`src/lib/copy.ts`:
```ts
// Pulling existing copy out of exported markdown without changing a word.

/** The first sentence of the paragraph that starts with `prefix`, verbatim. */
export function sentenceStarting(md: string, prefix: string): string | null {
  for (const para of md.split(/\n\s*\n/)) {
    const t = para.replace(/\s*\n\s*/g, ' ').trim();
    if (!t.startsWith(prefix)) continue;
    return t.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t;
  }
  return null;
}

/** A Join us role block: its first heading (markers stripped) and the markdown after it. */
export function splitRoleHeading(md: string): { title: string; rest: string } | null {
  const m = md.match(/^[ \t]*#{1,6}[ \t]+(.+?)[ \t]*$/m);
  if (!m || m.index === undefined) return null;
  const title = m[1].replace(/\*\*|__/g, '').trim();
  const rest = md.slice(m.index + m[0].length).replace(/^\s*\n/, '');
  return { title, rest };
}

/** "Project Categories | Achates 360" → "Project Categories". */
export function titleFromSeo(t: string): string {
  return t.split(' | ')[0].trim();
}
```

`src/lib/video-policy.ts`:
```ts
/**
 * Whether a background or looping video should be playing (spec §5, Review Focus 5). A visitor's
 * pause wins over everything; reduced motion never autoplays.
 */
export function shouldPlay(s: { onScreen: boolean; reduced: boolean; userPaused: boolean; allowedHere: boolean }): boolean {
  return s.onScreen && s.allowedHere && !s.reduced && !s.userPaused;
}
```

- [ ] **Step 4: Run all the tests**

Run: `npm test`
Expected: PASS, with every existing test plus the new ones.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "Helpers for the redesign: heading demote, next project, segments, meta, copy, video policy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: UI primitives and the case-study template (57 pages)

**Files:**
- Create:
  - `src/components/ui/{Pill,Sticker,Chip,Eyebrow,MediaCard,HeroMedia}.astro`
  - `src/components/{MediaRows,MetaStrip,NextProject}.astro`
- Rewrite: `src/components/Block.astro`, `src/layouts/Project.astro`
- Modify:
  - `src/components/BgVideo.astro` (pause button, uses `shouldPlay`)
  - `src/components/Embed.astro`, `src/components/Player.astro` (styles)

**Interfaces:**
- Consumes: Task 3 helpers; `loadExtras().text`; `T`, `DraftTag` (Task 2); `withBase`, `linkAttrs`, `mediaUrl`, `backLinkHref`, `BLANK_IMAGE`.
- Produces (props):
  - `<Pill href? variant?='outline'|'fill'|'light' type?>`
  - `<Sticker tilt?=-5 tone?='accent'|'peach'|'ink' class? data-*?>`
  - `<Chip>`
  - `<Eyebrow as?='p'|'h2' id?>`
  - `<MediaCard image alt href? title? subtitle? sticker? previewVideo? ratio?='4 / 3' sizes widths? tilt? eager?>`
  - `<HeroMedia media class? eager?=true>`
  - `<BgVideo src poster class? desktopOnly? pauseLabel? playLabel?>`: a pause button shows when both labels are given.
  - `<Block block pageTitle? lead? sizes? demote?>`
  - `<MediaRows blocks pageTitle?>`
  - `<MetaStrip client? copyright? categories badges labels>`
  - `<NextProject href title label>`
  - Root classes: `.next-project`, `.media-card`.

- [ ] **Step 1: Write the primitives**

`src/components/ui/Pill.astro`:
```astro
---
import { withBase, linkAttrs } from '../../lib/paths';
interface Props { href?: string; variant?: 'outline' | 'fill' | 'light'; type?: 'button' | 'submit'; class?: string }
const { href, variant = 'outline', type = 'button', class: cls } = Astro.props;
const classes = ['pill', `pill-${variant}`, cls];
---
{href
  ? <a class:list={classes} href={withBase(href)} {...linkAttrs(href)}><span class="dash" aria-hidden="true"></span><slot /></a>
  : <button class:list={classes} type={type}><span class="dash" aria-hidden="true"></span><slot /></button>}
<style>
  .pill {
    display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 9px 20px 7px;
    border: 1.5px solid currentColor; border-radius: var(--r-pill); background: transparent; color: inherit;
    font: 400 1.125rem/1 var(--font-display); letter-spacing: .04em; text-decoration: none; cursor: pointer;
    transition: background-color .2s, color .2s, border-color .2s;
  }
  .dash { width: 14px; height: 1.5px; background: currentColor; transition: width .25s var(--ease-out); }
  .pill:is(:hover, :focus-visible) .dash { width: 26px; }
  .pill-outline:hover { background: var(--ink); border-color: var(--ink); color: var(--paper); }
  .pill-fill { background: var(--accent); border-color: var(--accent); color: var(--ink); }
  .pill-fill:hover { background: var(--ink); border-color: var(--ink); color: var(--accent); }
  .pill-light { color: var(--white); }
  .pill-light:hover { background: var(--white); border-color: var(--white); color: var(--ink); }
  @media (prefers-reduced-motion: reduce) { .pill, .dash { transition: none; } }
</style>
```

`src/components/ui/Sticker.astro`:
```astro
---
// data-* attributes pass through (e.g. data-hero-sticker for the hero motion).
interface Props { tilt?: number; tone?: 'accent' | 'peach' | 'ink'; class?: string; [key: `data-${string}`]: string | boolean | undefined }
const { tilt = -5, tone = 'accent', class: cls, ...rest } = Astro.props;
---
<span class:list={['sticker', `sticker-${tone}`, cls]} style={`--tilt: ${tilt}deg`} {...rest}><slot /></span>
<style>
  .sticker {
    display: inline-block; padding: 4px 10px 1px; transform: rotate(var(--tilt));
    font: 400 clamp(1rem, .9rem + .4vw, 1.375rem)/1.1 var(--font-display); letter-spacing: .03em;
  }
  .sticker-accent { background: var(--accent); color: var(--ink); }
  .sticker-peach { background: var(--peach); color: var(--ink); }
  .sticker-ink { background: var(--ink); color: var(--peach); }
</style>
```

`src/components/ui/Chip.astro`:
```astro
<span class="chip"><slot /></span>
<style>
  .chip {
    display: inline-block; padding: 5px 11px; border-radius: var(--r-pill); background: var(--white); color: var(--ink);
    font: 500 var(--fs-label)/1.2 var(--font-text); letter-spacing: .06em; text-transform: uppercase;
  }
</style>
```

`src/components/ui/Eyebrow.astro`:
```astro
---
interface Props { as?: 'p' | 'h2'; id?: string }
const { as: Tag = 'p', id } = Astro.props;
---
<Tag class="eyebrow" id={id}><span class="dot" aria-hidden="true"></span><slot /></Tag>
<style>
  .eyebrow { display: flex; align-items: center; gap: 8px; margin: 0 0 var(--s-4); font: 500 var(--fs-small)/1.2 var(--font-text); letter-spacing: .02em; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: currentColor; flex: none; }
</style>
```

`src/components/ui/HeroMedia.astro`:
```astro
---
import { Image } from 'astro:assets';
import BgVideo from '../BgVideo.astro';
import { BLANK_IMAGE } from '../../lib/paths';
import { loadExtras } from '../../lib/extras';
// A full-bleed hero (spec §4.1/§4.2). Video loads at >=768px; phones get its poster still, as in
// the clone. The <picture> hands desktop a blank source so the still is never fetched there.
// Images load eagerly as the LCP candidate.
type Media = { type: 'image'; src: ImageMetadata; alt: string } | { type: 'video'; src: string; poster: ImageMetadata };
interface Props { media: Media; class?: string; eager?: boolean }
const { media, class: cls, eager = true } = Astro.props;
const { text } = await loadExtras();
const load = eager ? 'eager' : 'lazy';
---
<div class:list={['hero-media', cls]} data-bgvideo-viewport>
  {media.type === 'video' ? (
    <>
      <BgVideo src={media.src} poster={media.poster} desktopOnly class="hm-video" pauseLabel={text('video-pause').text} playLabel={text('video-play').text} />
      <picture class="hm-pic">
        <source media="(min-width: 768px)" srcset={BLANK_IMAGE} />
        <Image class="hm-still" src={media.poster} alt="" widths={[480, 960, 1440]} sizes="100vw" loading={load} fetchpriority={eager ? 'high' : undefined} />
      </picture>
    </>
  ) : (
    <Image class="hm-image" src={media.src} alt={media.alt} widths={[480, 960, 1440, 1920, 2560]} sizes="100vw" loading={load} fetchpriority={eager ? 'high' : undefined} />
  )}
</div>
<style>
  .hero-media { position: absolute; inset: 0; overflow: hidden; background: var(--charcoal); }
  .hero-media :global(:is(.hm-video, .hm-still, .hm-image)) { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .hm-pic { display: contents; }
  @media (min-width: 768px) { .hero-media :global(.hm-still) { display: none; } }
  @media (max-width: 767px) { .hero-media :global(.hm-video) { display: none; } }
</style>
```

`src/components/ui/MediaCard.astro`:
```astro
---
import { Image } from 'astro:assets';
import { withBase, mediaUrl, linkAttrs } from '../../lib/paths';
import Sticker from './Sticker.astro';
// A rounded image card. previewVideo: a muted preview that plays on hover, only on hover-capable
// pointers and without reduced motion (Review Focus 5).
interface Props {
  image: ImageMetadata; alt: string; href?: string; title?: string; subtitle?: string; sticker?: string;
  previewVideo?: string; ratio?: string; sizes: string; widths?: number[]; tilt?: boolean; eager?: boolean;
}
const { image, alt, href, title, subtitle, sticker, previewVideo, ratio = '4 / 3', sizes, widths = [320, 640, 960, 1280], tilt = false, eager = false } = Astro.props;
const Wrap = href ? 'a' : 'div';
const wrapAttrs = href ? { href: withBase(href), ...linkAttrs(href) } : {};
---
<Wrap class="media-card" {...wrapAttrs} data-tilt={tilt ? '' : undefined} data-preview={previewVideo ? '' : undefined} data-reveal>
  <div class="mc-media" style={`aspect-ratio: ${ratio}`}>
    <Image src={image} alt={alt} widths={widths} sizes={sizes} loading={eager ? 'eager' : 'lazy'} />
    {previewVideo && <video class="mc-preview" data-src={mediaUrl(previewVideo)} muted loop playsinline preload="none" aria-hidden="true"></video>}
    {sticker && <Sticker class="mc-sticker" tilt={4}>{sticker}</Sticker>}
  </div>
  {(title || subtitle) && (
    <div class="mc-text">
      {title && <p class="mc-title">{title}</p>}
      {subtitle && <p class="mc-sub">{subtitle}</p>}
    </div>
  )}
</Wrap>
<script>
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover = window.matchMedia('(hover: hover)');
  for (const card of document.querySelectorAll<HTMLElement>('.media-card[data-preview]')) {
    const v = card.querySelector<HTMLVideoElement>('.mc-preview')!;
    card.addEventListener('pointerenter', () => {
      if (reduce.matches || !hover.matches) return;
      if (!v.getAttribute('src')) v.src = v.dataset.src!;
      card.classList.add('is-playing');
      v.play().catch(() => card.classList.remove('is-playing'));
    });
    card.addEventListener('pointerleave', () => { card.classList.remove('is-playing'); v.pause(); });
  }
</script>
<style>
  .media-card { display: block; color: inherit; text-decoration: none; }
  .mc-media { position: relative; overflow: hidden; border-radius: var(--r-card); background: var(--peach); }
  .mc-media :global(img), .mc-preview { width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--ease-out); }
  .mc-preview { position: absolute; inset: 0; opacity: 0; transition: opacity .25s; }
  .is-playing .mc-preview { opacity: 1; }
  a.media-card:hover .mc-media :global(img) { transform: scale(1.04); }
  .mc-media :global(.mc-sticker) { position: absolute; top: var(--s-3); right: var(--s-3); }
  .mc-text { padding-top: var(--s-3); }
  .mc-title { margin: 0; font: 400 clamp(1.375rem, 1.1rem + .8vw, 1.875rem)/1 var(--font-display); overflow-wrap: anywhere; }
  .mc-sub { margin: 4px 0 0; font-size: var(--fs-small); color: #5d5654; }
  @media (prefers-reduced-motion: reduce) { .mc-media :global(img) { transition: none; } }
</style>
```

- [ ] **Step 2: Give `BgVideo` a pause button driven by `shouldPlay`**

Replace `src/components/BgVideo.astro` with:
```astro
---
import { getImage } from 'astro:assets';
import { mediaUrl } from '../lib/paths';
// Background video (muted, looping, no controls). It plays only while on screen, never under
// reduced motion, and never again after the visitor pauses it (WCAG 2.2.2; src/lib/video-policy).
// desktopOnly: loads only at >=768px once within a screen of the viewport. pauseLabel/playLabel:
// render a pause/play button (required for any looping video a visitor sees for >5s).
interface Props { src: string; poster: ImageMetadata; class?: string; desktopOnly?: boolean; pauseLabel?: string; playLabel?: string }
const { src, poster, class: cls, desktopOnly = false, pauseLabel, playLabel } = Astro.props;
const posterUrl = (await getImage({ src: poster, width: 1920, format: 'webp' })).src;
const toggle = pauseLabel && playLabel;
---
<div class:list={['bgvideo', cls]}>
  {desktopOnly
    ? <video data-src={mediaUrl(src)} data-poster={posterUrl} muted loop playsinline preload="none" aria-hidden="true"></video>
    : <video src={mediaUrl(src)} poster={posterUrl} muted loop playsinline preload="metadata" aria-hidden="true"></video>}
  {toggle && (
    <button class="bv-toggle" type="button" aria-pressed="false" data-pause={pauseLabel} data-play={playLabel}>
      <span class="sr-only">{pauseLabel}</span>
      <svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>
      <svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
    </button>
  )}
</div>
<script>
  import { shouldPlay } from '../lib/video-policy';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 768px)');
  const videos = [...document.querySelectorAll<HTMLVideoElement>('.bgvideo video')];
  const near = new Set<Element>();
  const seen = new Set<Element>();
  const area = (v: HTMLVideoElement) => v.closest('[data-bgvideo-viewport]') ?? v;
  const lazy = (v: HTMLVideoElement) => v.dataset.src !== undefined;

  const update = (v: HTMLVideoElement) => {
    const allowedHere = !lazy(v) || desktop.matches;
    if (lazy(v) && allowedHere && !v.getAttribute('src') && near.has(area(v))) {
      if (v.dataset.poster) v.poster = v.dataset.poster;
      v.preload = 'metadata';
      v.src = v.dataset.src!;
    }
    const play = shouldPlay({ onScreen: seen.has(area(v)), reduced: reduce.matches, userPaused: v.dataset.userPaused === 'true', allowedHere })
      && !!v.getAttribute('src');
    if (play) v.play().catch(() => {});
    else v.pause();
  };
  const watch = (set: Set<Element>, rootMargin: string) => new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? set.add(e.target) : set.delete(e.target);
    for (const v of videos) if (entries.some((e) => e.target === area(v))) update(v);
  }, { rootMargin });
  const nearIO = watch(near, '100% 0px');
  const seenIO = watch(seen, '0px');
  for (const el of new Set(videos.map(area))) { nearIO.observe(el); seenIO.observe(el); }
  for (const v of videos) update(v);
  reduce.addEventListener('change', () => videos.forEach(update));
  desktop.addEventListener('change', () => videos.forEach(update));

  for (const btn of document.querySelectorAll<HTMLButtonElement>('.bv-toggle')) {
    const v = btn.parentElement!.querySelector('video')!;
    const label = btn.querySelector('.sr-only')!;
    const sync = () => {
      const paused = v.dataset.userPaused === 'true';
      btn.setAttribute('aria-pressed', String(paused));
      label.textContent = paused ? btn.dataset.play! : btn.dataset.pause!;
    };
    // Reduced motion starts paused, so the button offers Play from the start.
    if (reduce.matches) v.dataset.userPaused = 'true';
    btn.addEventListener('click', () => {
      v.dataset.userPaused = v.dataset.userPaused === 'true' ? 'false' : 'true';
      sync();
      update(v);
      // An explicit Play under reduced motion is the visitor's choice: honour it.
      if (v.dataset.userPaused === 'false' && reduce.matches && v.getAttribute('src')) v.play().catch(() => {});
    });
    sync();
  }
</script>
<style>
  .bgvideo { position: relative; overflow: hidden; }
  .bgvideo video { display: block; width: 100%; height: 100%; object-fit: cover; }
  .bv-toggle {
    position: absolute; right: var(--s-4); bottom: var(--s-4); z-index: 2; width: 44px; height: 44px;
    display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%;
    background: rgb(246 241 238 / .85); color: var(--ink); cursor: pointer;
  }
  .bv-toggle svg { width: 18px; height: 18px; fill: currentColor; }
  .bv-toggle .i-play, .bv-toggle[aria-pressed='true'] .i-pause { display: none; }
  .bv-toggle[aria-pressed='true'] .i-play { display: block; }
</style>
```
**Note:** the toggle sits inside `.hm-video`, which is hidden below 768px, so phones (which show the still) get no button. That's correct, because nothing moves on phones.

- [ ] **Step 3: Restyle `Embed` and `Player`**

In `src/components/Embed.astro`, replace the style rule `background: var(--color-video-bg);` with `background: var(--ink); border-radius: var(--r-card); overflow: hidden;`.
In `src/components/Player.astro`, replace its style block's rule with:
`.player video { display: block; width: 100%; height: auto; background: var(--ink); border-radius: var(--r-card); }`

- [ ] **Step 4: Rewrite `Block.astro`**

```astro
---
import { Image } from 'astro:assets';
import { renderMd } from '../lib/markdown';
import { withBase, backLinkHref, linkAttrs } from '../lib/paths';
import BgVideo from './BgVideo.astro';
import Embed from './Embed.astro';
import Player from './Player.astro';
import MediaCard from './ui/MediaCard.astro';
import Pill from './ui/Pill.astro';
// One exported content block in the new design. Copy is rendered verbatim; the clone's per-block
// colours (b.color) belonged to Wix's layout and are not used.
interface Props { block: any; pageTitle?: string; lead?: boolean; sizes?: string; demote?: number }
const { block: b, pageTitle, lead = false, sizes = '(max-width: 767px) 100vw, (max-width: 1440px) 92vw, 1320px', demote = 0 } = Astro.props;
const label = pageTitle ? `${pageTitle} video` : undefined;
---
{b.type === 'text' && <div class:list={['block-text', 'prose', { lead }]} data-reveal set:html={renderMd(b.md, undefined, { demote })} />}
{b.type === 'link' && <p class="block-link"><Pill href={backLinkHref(b.href)}>{b.label}</Pill></p>}
{b.type === 'image' && (b.href
  ? <a class="block-image" href={withBase(b.href)} {...linkAttrs(b.href)} data-reveal><Image class="block-img" src={b.src} alt={b.alt} widths={[480, 960, 1440, 1920]} sizes={sizes} /></a>
  : <div class="block-image" data-reveal><Image class="block-img" src={b.src} alt={b.alt} widths={[480, 960, 1440, 1920]} sizes={sizes} /></div>)}
{b.type === 'gallery' && (
  <ul class="block-gallery">
    {b.items.map((it: any) => <li><MediaCard image={it.thumb} alt={it.alt} href={it.href} previewVideo={it.video} ratio="auto" sizes="(max-width: 767px) 100vw, 45vw" /></li>)}
  </ul>
)}
{b.type === 'video' && (b.controls
  ? <Player src={b.src} poster={b.poster} label={label} />
  : <BgVideo src={b.src} poster={b.poster} class="block-video" />)}
{b.type === 'embed' && <Embed provider={b.provider} id={b.id} title={label} />}
```
**Note:** the inline (non-hero) `BgVideo` in case studies has no toggle. In the clone these are short muted loops placed as images. Task 12's QA lists any that loop longer than 5 seconds, and those get `pauseLabel`/`playLabel` passed through.

- [ ] **Step 5: Write `MediaRows`, `MetaStrip` and `NextProject`**

`src/components/MediaRows.astro`:
```astro
---
import Block from './Block.astro';
import { toSegments } from '../lib/segments';
// The case-study body (spec §4.2): Wix's rows as single blocks, media grids or text+media splits.
// The first text block reads as the lead paragraph.
interface Props { blocks: any[]; pageTitle?: string }
const { blocks, pageTitle } = Astro.props;
const segments = toSegments(blocks);
const firstText = blocks.find((b) => b.type === 'text');
const isText = (b: any) => b.type === 'text' || b.type === 'link';
---
<div class="media-rows">
  {segments.map((s) => {
    if (s.kind === 'single') {
      return <div class:list={['seg', isText(s.block) ? 'seg-text' : 'seg-media']}><Block block={s.block} pageTitle={pageTitle} lead={s.block === firstText} /></div>;
    }
    if (s.kind === 'grid') {
      return (
        <div class="seg seg-grid" style={`--cols: ${s.cols}`}>
          {s.blocks.map((b) => <Block block={b} pageTitle={pageTitle} sizes={`(max-width: 767px) 100vw, ${Math.round(92 / s.cols)}vw`} />)}
        </div>
      );
    }
    return (
      <div class="seg seg-split">
        {s.blocks.map((b) => <div class={isText(b) ? 'cell-text' : 'cell-media'}><Block block={b} pageTitle={pageTitle} lead={b === firstText} sizes="(max-width: 767px) 100vw, 46vw" /></div>)}
      </div>
    );
  })}
</div>
<style>
  .media-rows { display: grid; gap: var(--s-4); }
  .seg-text { padding-block: var(--s-6); }
  .seg-text + .seg-text { padding-top: 0; }
  .media-rows :global(.lead) { font-size: var(--fs-lead); line-height: 1.35; font-weight: 300; max-width: 40ch; }
  .seg-grid, .seg-split { display: grid; gap: var(--s-4); grid-template-columns: minmax(0, 1fr); }
  .seg-split { gap: var(--s-6); align-items: start; }
  .media-rows :global(:is(.block-image, .bgvideo)) { display: block; border-radius: var(--r-card); overflow: hidden; }
  .media-rows :global(.block-img) { width: 100%; height: auto; }
  .media-rows :global(.block-gallery) { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); }
  .media-rows :global(.block-link) { margin: 0; }
  @media (min-width: 768px) {
    .seg-grid { grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); }
    .seg-grid > :global(.block-image) { height: 100%; }
    .seg-grid :global(.block-img) { height: 100%; object-fit: cover; }
    .seg-split { grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
  }
</style>
```

`src/components/MetaStrip.astro`:
```astro
---
import { Image } from 'astro:assets';
import { withBase, linkAttrs } from '../lib/paths';
import { metaColumns, type MetaKey } from '../lib/meta';
import type { UiString } from '../lib/strings';
import Chip from './ui/Chip.astro';
import T from './ui/T.astro';
interface Props {
  client?: string; copyright?: string; categories: string[];
  badges: { src: ImageMetadata; alt: string; href?: string }[]; labels: Record<MetaKey, UiString>;
}
const { client, copyright, categories, badges, labels } = Astro.props;
const cols = metaColumns({ client, copyright, categories, badges });
---
{cols.length > 0 && (
  <dl class="meta wrap">
    {cols.map((k) => (
      <div class="meta-col">
        <dt class="label"><T s={labels[k]} /></dt>
        <dd>
          {k === 'client' && client}
          {k === 'year' && copyright}
          {k === 'services' && <ul class="chips">{categories.map((c) => <li><Chip>{c}</Chip></li>)}</ul>}
          {k === 'recognition' && (
            <ul class="badges">
              {badges.map((b) => {
                const img = <Image src={b.src} alt={b.alt} height={72} densities={[1, 2]} />;
                return <li>{b.href ? <a href={withBase(b.href)} {...linkAttrs(b.href)}>{img}</a> : img}</li>;
              })}
            </ul>
          )}
        </dd>
      </div>
    ))}
  </dl>
)}
<style>
  .meta { display: grid; gap: var(--s-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); margin-block: 0; padding-block: var(--s-6); border-bottom: 1px solid var(--line); }
  .meta-col { min-width: 0; }
  dt { margin-bottom: var(--s-2); color: #5d5654; }
  dd { margin: 0; overflow-wrap: anywhere; }
  .chips, .badges { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .badges :global(img) { height: 72px; width: auto; }
</style>
```

`src/components/NextProject.astro`:
```astro
---
import { withBase } from '../lib/paths';
import type { UiString } from '../lib/strings';
import T from './ui/T.astro';
interface Props { href: string; title: string; label: UiString }
const { href, title, label } = Astro.props;
---
<section class="next-project">
  <a class="np wrap" href={withBase(href)}>
    <span class="label"><T s={label} /></span>
    <span class="np-title" data-split>{title}</span>
    <span class="np-arrow" aria-hidden="true">→</span>
  </a>
</section>
<style>
  .next-project { background: var(--charcoal); color: var(--peach); }
  .next-project :focus-visible { outline-color: var(--peach); }
  .np { display: grid; gap: var(--s-3); padding-block: var(--section-y); text-decoration: none; }
  .np-title { font: 400 var(--fs-h2)/var(--lh-display) var(--font-display); color: var(--white); overflow-wrap: anywhere; text-wrap: balance; }
  .np-arrow { font: 400 var(--fs-h3)/1 var(--font-display); color: var(--accent); transition: transform .3s var(--ease-out); }
  .np:hover .np-arrow { transform: translateX(12px); }
  @media (prefers-reduced-motion: reduce) { .np-arrow { transition: none; } }
</style>
```

- [ ] **Step 6: Rewrite `Project.astro`**

```astro
---
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import Base from './Base.astro';
import HeroMedia from '../components/ui/HeroMedia.astro';
import Sticker from '../components/ui/Sticker.astro';
import Pill from '../components/ui/Pill.astro';
import MetaStrip from '../components/MetaStrip.astro';
import MediaRows from '../components/MediaRows.astro';
import NextProject from '../components/NextProject.astro';
import { loadExtras } from '../lib/extras';
import { backLinkHref } from '../lib/paths';
import { nextProject, slugOf } from '../lib/next-project';
interface Props { entry: CollectionEntry<'projects'> }
const { id, data: d } = Astro.props.entry;
const { text } = await loadExtras();
const home = (await getEntry('home', 'home'))!.data;
const built = new Set((await getCollection('projects')).map((e) => e.id));
const order = home.allProjects.items.map((i) => slugOf(i.href)).filter((s): s is string => s !== null);
const next = nextProject(id, order, (s) => built.has(s));
const nextTitle = next ? (await getEntry('projects', next))!.data.title : text('next-fallback').text;
const labels = { client: text('meta-client'), year: text('meta-year'), services: text('meta-services'), recognition: text('meta-recognition') };
---
<Base title={d.seo.title} description={d.seo.description} ogImage={d.seo.ogImage} page="project" overHero={!!d.hero}>
  <section class:list={['p-hero', { 'p-hero-plain': !d.hero }]}>
    {d.hero && <HeroMedia media={d.hero} />}
    <div class="p-hero-text wrap">
      {d.categories[0] && <Sticker>{d.categories[0]}</Sticker>}
      <h1 class="display h1" data-split>{d.title}</h1>
    </div>
  </section>
  {d.heroCaption && <p class="sr-only">{d.heroCaption}</p>}
  <MetaStrip client={d.client} copyright={d.copyright} categories={d.categories} badges={d.badges} labels={labels} />
  <article class="wrap p-body"><MediaRows blocks={d.blocks} pageTitle={d.title} /></article>
  {d.backLink && <p class="wrap p-back"><Pill href={backLinkHref(d.backLink.href)}>{d.backLink.label}</Pill></p>}
  <NextProject href={next ? `/${next}` : '/projects'} title={nextTitle} label={text('next-project')} />
</Base>
<style>
  .p-hero { position: relative; display: flex; align-items: flex-end; min-height: 60svh; color: var(--white); isolation: isolate; }
  .p-hero::after { content: ''; position: absolute; inset: 0; z-index: 0; background: linear-gradient(180deg, rgb(0 0 0 / .35), rgb(0 0 0 / 0) 35%, rgb(0 0 0 / .6)); pointer-events: none; }
  .p-hero-text { position: relative; z-index: 1; display: grid; justify-items: start; gap: var(--s-4); padding-block: var(--s-9) var(--s-7); }
  .p-hero-plain { min-height: 0; background: var(--charcoal); color: var(--peach); }
  .p-hero-plain::after { display: none; }
  .p-body { padding-block: var(--s-7) var(--s-8); }
  .p-back { margin: 0; padding-bottom: var(--s-8); }
  @media (min-width: 768px) { .p-hero { min-height: 85svh; } }
</style>
```

- [ ] **Step 7: Build, verify and check a no-hero project (Review Focus 2)**

Run: `npm test && npm run build && npm run verify`
Expected: PASS, 68/68.

Every exported project has a hero, so prove the no-hero path (Review Focus 2) with a scratch entry. This is a new file; no exported file is touched:
```bash
python3 - <<'PY'
import re
src = open('src/content/projects/infographics.md').read()
src = re.sub(r'^hero:\n(?:  .*\n)+', '', src, flags=re.M)        # drop the hero block
src = re.sub(r'^client:.*\n', '', src, flags=re.M)                # and the client
src = re.sub(r'^badges:\n(?:  .*\n)+', 'badges: []\n', src, flags=re.M)
open('src/content/projects/zz-no-hero-check.md', 'w').write(src)
PY
npx astro build
f=dist/zz-no-hero-check.html
grep -c '<h1' $f; grep -c 'class="next-project"' $f; grep -c 'p-hero-plain' $f; grep -c 'data-over-hero' $f
grep -o '<dt class="label">' $f | wc -l
rm src/content/projects/zz-no-hero-check.md && npm run build
```
Expected:
- `<h1`: 1
- `next-project`: 1
- `p-hero-plain`: 1
- `data-over-hero`: 0, so the header is solid
- the `<dt>` count is the number of remaining meta fields (copyright, categories); there's no Client column and no Recognition column

Then run `npm run preview` and check `/notter` at 1440 and 375:
- full-bleed hero with the title over it
- meta strip with 3 chips and the award badge
- the Vimeo film full width
- a 2-column image grid
- the "Next project" band
- no horizontal scroll

- [ ] **Step 8: Commit**

```bash
git add src/components src/layouts/Project.astro
git commit -m "Immersive case-study template with meta strip, media rows and next-project band

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Homepage (work first)

**Files:**
- Create:
  - `src/components/ui/{Marquee,StatCounter}.astro`
  - `src/components/{FeaturedStack,ServicesPreview,StatsBand,ProjectGrid,Testimonials,LetsConnect}.astro`
- Rewrite: `src/pages/index.astro`
- Modify: `src/components/ContactForm.astro` (`<style>` only)

**Interfaces:**
- Consumes: `loadExtras()` (all groups), `sentenceStarting`, `slugOf`, `renderMd(…, { demote })`, `HeroMedia`, `MediaCard`, `Pill`, `Sticker`, `Eyebrow`, `T`, `DraftTag`, `BgVideo`, `phAttr`.
- Produces (props):
  - `<ProjectGrid items={GalleryItem[]} />`, where `GalleryItem = { title; description; href?; thumb; alt; video? }`
  - `<Marquee reverse? speed?=40 class?>`
  - `<StatCounter value: number; suffix?; label: string; placeholder: boolean>`
  - `<LetsConnect line: UiString; cta?: UiString; href?: string>`
  - `<StatsBand stats listedCount clients quote eyebrow>`
  - `<Testimonials items eyebrow>`
  - `<ServicesPreview services eyebrow cta>`
  - `<FeaturedStack items eyebrow>`
  - `statValue(stat, listedCount): number`, exported from `src/lib/meta.ts` with a test in this task.

- [ ] **Step 1: Add `statValue` to `meta.ts`, with a test**

Append to `src/lib/meta.test.ts`:
```ts
import { statValue } from './meta';
describe('statValue', () => {
  it('passes numbers through', () => expect(statValue({ value: 2001 }, 49)).toBe(2001));
  it('resolves listed-projects to the build-time count', () => expect(statValue({ value: 'listed-projects' }, 49)).toBe(49));
});
```
Run: `npx vitest run src/lib/meta.test.ts`
Expected: FAIL ("statValue is not a function").
Append to `src/lib/meta.ts`:
```ts
/** A stat's number: `listed-projects` is counted at build time (spec §6.3). */
export function statValue(s: { value: number | 'listed-projects' }, listedCount: number): number {
  return s.value === 'listed-projects' ? listedCount : s.value;
}
```
Run it again. Expected: PASS.

- [ ] **Step 2: Write `Marquee` and `StatCounter`**

`src/components/ui/Marquee.astro`:
```astro
---
// CSS-only infinite marquee (spec §5): pauses on hover; under reduced motion it stops and the row
// can be scrolled sideways instead. The second copy is hidden from assistive tech.
interface Props { reverse?: boolean; speed?: number; class?: string }
const { reverse = false, speed = 40, class: cls } = Astro.props;
const html = await Astro.slots.render('default');
---
<div class:list={['marquee', cls]} style={`--speed: ${speed}s`} data-reverse={reverse ? '' : undefined}>
  <div class="mq-track">
    <div class="mq-group"><Fragment set:html={html} /></div>
    <div class="mq-group" aria-hidden="true"><Fragment set:html={html} /></div>
  </div>
</div>
<style>
  .marquee { overflow: hidden; }
  .mq-track { display: flex; width: max-content; animation: mq var(--speed) linear infinite; }
  .marquee[data-reverse] .mq-track { animation-direction: reverse; }
  .mq-group { display: flex; flex-shrink: 0; align-items: center; gap: var(--mq-gap, 3rem); padding-right: var(--mq-gap, 3rem); }
  .marquee:hover .mq-track { animation-play-state: paused; }
  @keyframes mq { to { transform: translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) {
    .marquee { overflow-x: auto; }
    .mq-track { animation: none; }
    .mq-group[aria-hidden] { display: none; }
  }
</style>
```

`src/components/ui/StatCounter.astro`:
```astro
---
import DraftTag from './DraftTag.astro';
// The final number is in the HTML; motion (Task 11) counts up to it. Years and other values of
// 1000 or more are shown as they are, without counting.
interface Props { value: number; suffix?: string; label: string; placeholder: boolean }
const { value, suffix, label, placeholder } = Astro.props;
---
<div class="stat" data-placeholder={placeholder ? '' : undefined}>
  <p class="stat-num"><span data-count={value < 1000 ? value : undefined}>{value}</span>{suffix}</p>
  <p class="stat-label">{label}<DraftTag when={placeholder} /></p>
</div>
<style>
  .stat-num { margin: 0; font: 400 clamp(3.5rem, 2.5rem + 4vw, 6.5rem)/.9 var(--font-display); color: var(--accent); font-variant-numeric: tabular-nums; }
  .stat-label { margin: var(--s-2) 0 0; font-size: var(--fs-label); letter-spacing: .1em; text-transform: uppercase; font-weight: 500; }
</style>
```

- [ ] **Step 3: Write `ProjectGrid`, `FeaturedStack`, `ServicesPreview`, `StatsBand`, `Testimonials` and `LetsConnect`**

`src/components/ProjectGrid.astro`:
```astro
---
import MediaCard from './ui/MediaCard.astro';
// Gallery items from the export (homepage All Projects, /projects sections, /copy-of-projects),
// titles and descriptions verbatim (🏆 markers included).
interface Item { title: string; description: string; href?: string; thumb: ImageMetadata; alt: string; video?: string }
interface Props { items: Item[] }
const { items } = Astro.props;
---
<ul class="project-grid">
  {items.map((it) => (
    <li><MediaCard image={it.thumb} alt={it.alt} href={it.href} title={it.title} subtitle={it.description} previewVideo={it.video} sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" tilt /></li>
  ))}
</ul>
<style>
  .project-grid { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-7) var(--s-5); grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); }
  .project-grid li { min-width: 0; }
</style>
```

`src/components/FeaturedStack.astro`:
```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import BgVideo from './BgVideo.astro';
import Sticker from './ui/Sticker.astro';
import Pill from './ui/Pill.astro';
import Eyebrow from './ui/Eyebrow.astro';
import T from './ui/T.astro';
import { renderMd } from '../lib/markdown';
import { withBase, linkAttrs, BLANK_IMAGE } from '../lib/paths';
import { loadExtras } from '../lib/extras';
import type { UiString } from '../lib/strings';
type Slide = CollectionEntry<'home'>['data']['slides'][number];
type Project = CollectionEntry<'projects'>['data'];
// The six homepage slides as sticky stacking cards (spec §4.1); motion adds the scale-back.
interface Props { items: { slide: Slide; project?: Project }[]; eyebrow: UiString }
const { items, eyebrow } = Astro.props;
const { text } = await loadExtras();
---
<section class="featured section" aria-labelledby="featured-title">
  <div class="wrap"><Eyebrow as="h2" id="featured-title"><T s={eyebrow} /></Eyebrow></div>
  <ol class="stack wrap" data-stack>
    {items.map(({ slide, project }, i) => (
      <li class="stack-card" style={`--i: ${i}`}>
        <div class="sc-media" data-bgvideo-viewport>
          {slide.media.type === 'video' ? (
            <>
              <BgVideo src={slide.media.src} poster={slide.media.poster} desktopOnly class="sc-video" pauseLabel={text('video-pause').text} playLabel={text('video-play').text} />
              <picture class="sc-pic">
                <source media="(min-width: 768px)" srcset={BLANK_IMAGE} />
                <Image class="sc-still" src={slide.media.poster} alt="" widths={[480, 960]} sizes="100vw" />
              </picture>
            </>
          ) : (
            <Image class="sc-image" src={slide.media.src} alt={slide.media.alt} widths={[480, 960, 1440, 1920]} sizes="(max-width: 1440px) 92vw, 1320px" />
          )}
        </div>
        <div class="sc-text">
          {project?.categories[0] && <Sticker>{project.categories[0]}</Sticker>}
          {project && <h3 class="display h3">{project.title}</h3>}
          {project?.client && <p class="sc-client">{project.client}</p>}
          {slide.md && <div class="sc-md" set:html={renderMd(slide.md, undefined, { demote: 3 })} />}
          {slide.badges.length > 0 && (
            <ul class="sc-badges">
              {slide.badges.map((b) => {
                const img = <Image src={b.src} alt={b.alt} widths={[80, 160]} sizes="80px" />;
                return <li>{b.href ? <a href={withBase(b.href)} {...linkAttrs(b.href)}>{img}</a> : img}</li>;
              })}
            </ul>
          )}
          {slide.cta && <Pill href={slide.cta.href} variant="light">{slide.cta.label}</Pill>}
        </div>
      </li>
    ))}
  </ol>
</section>
<style>
  .stack { list-style: none; padding: 0; margin-top: var(--s-5); display: grid; gap: var(--s-6); }
  .stack-card {
    position: sticky; top: calc(var(--header-h) + var(--s-3) + var(--i) * 10px);
    height: min(76svh, 760px); border-radius: var(--r-block); overflow: hidden; color: var(--white);
    transform-origin: 50% 0;
  }
  .sc-media { position: absolute; inset: 0; background: var(--charcoal); }
  .sc-media :global(:is(.sc-video, .sc-still, .sc-image)) { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .sc-pic { display: contents; }
  .stack-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgb(0 0 0 / 0) 40%, rgb(0 0 0 / .65)); pointer-events: none; }
  .sc-text { position: absolute; inset: auto 0 0; z-index: 1; display: grid; justify-items: start; gap: var(--s-3); padding: var(--s-6); }
  .sc-text h3 { max-width: 16ch; }
  .sc-client { margin: 0; font-size: var(--fs-small); letter-spacing: .06em; text-transform: uppercase; }
  .sc-md :global(:is(h2, h3, h4, h5, h6)) { margin: 0; font: 400 var(--fs-h3)/.95 var(--font-display); }
  .sc-badges { list-style: none; margin: 0; padding: 0; display: flex; gap: var(--s-2); }
  .sc-badges :global(img) { width: 64px; height: 64px; object-fit: contain; }
  .stack-card :focus-visible { outline-color: var(--white); }
  @media (min-width: 768px) {
    .sc-media :global(.sc-still) { display: none; }
    .sc-text { padding: var(--s-8); }
  }
  @media (max-width: 767px) { .sc-media :global(.sc-video) { display: none; } }
</style>
```

`src/components/ServicesPreview.astro`:
```astro
---
import Eyebrow from './ui/Eyebrow.astro';
import Chip from './ui/Chip.astro';
import Pill from './ui/Pill.astro';
import T from './ui/T.astro';
import DraftTag from './ui/DraftTag.astro';
import type { UiString } from '../lib/strings';
interface Service { id: string; title: string; tags: string[]; placeholder: boolean }
interface Props { services: Service[]; eyebrow: UiString; cta: UiString }
const { services, eyebrow, cta } = Astro.props;
---
<section class="services-preview section" aria-labelledby="sp-title">
  <div class="wrap">
    <Eyebrow as="h2" id="sp-title"><T s={eyebrow} /></Eyebrow>
    <ul class="rows">
      {services.map((s) => (
        <li class="row" data-placeholder={s.placeholder ? '' : undefined} data-reveal>
          <h3 class="display h2" data-split>{s.title}<DraftTag when={s.placeholder} /></h3>
          <ul class="tags">{s.tags.map((t) => <li><Chip>{t}</Chip></li>)}</ul>
        </li>
      ))}
    </ul>
    <Pill href="/services"><T s={cta} /></Pill>
  </div>
</section>
<style>
  .services-preview { background: var(--peach); }
  .rows { list-style: none; margin: 0 0 var(--s-7); padding: 0; }
  .row { display: grid; gap: var(--s-4); padding-block: var(--s-6); border-top: 1px solid var(--line); }
  .tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  @media (min-width: 1024px) { .row { grid-template-columns: 1.3fr 1fr; align-items: end; } }
</style>
```

`src/components/StatsBand.astro`:
```astro
---
import Eyebrow from './ui/Eyebrow.astro';
import Marquee from './ui/Marquee.astro';
import StatCounter from './ui/StatCounter.astro';
import T from './ui/T.astro';
import DraftTag from './ui/DraftTag.astro';
import { statValue } from '../lib/meta';
import type { UiString } from '../lib/strings';
interface Stat { id: string; value: number | 'listed-projects'; suffix?: string; label: string; placeholder: boolean }
interface Props {
  stats: Stat[]; listedCount: number; clients: { id: string; name: string; placeholder: boolean }[];
  quote?: { quote: string; name: string; role: string; placeholder: boolean }; eyebrow: UiString;
}
const { stats, listedCount, clients, quote, eyebrow } = Astro.props;
const anyClientDraft = clients.some((c) => c.placeholder);
---
<section class="stats-band section" aria-labelledby="sb-title">
  <div class="wrap grid">
    {stats.map((s) => <StatCounter value={statValue(s, listedCount)} suffix={s.suffix} label={s.label} placeholder={s.placeholder} />)}
  </div>
  <div class="wrap clients" data-placeholder={anyClientDraft ? '' : undefined}>
    <Eyebrow as="h2" id="sb-title"><T s={eyebrow} /><DraftTag when={anyClientDraft} /></Eyebrow>
  </div>
  <Marquee class="client-mq" speed={50}>
    {clients.map((c) => <span class="client">{c.name}</span>)}
  </Marquee>
  {quote && (
    <figure class="wrap quote" data-placeholder={quote.placeholder ? '' : undefined} data-reveal>
      <blockquote>{quote.quote}</blockquote>
      <figcaption><strong>{quote.name}</strong> · {quote.role}<DraftTag when={quote.placeholder} /></figcaption>
    </figure>
  )}
</section>
<style>
  .stats-band {
    background-color: var(--black); color: #e9e4e1;
    background-image: linear-gradient(rgb(255 255 255 / .06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .06) 1px, transparent 1px);
    background-size: 64px 64px;
  }
  .stats-band :focus-visible { outline-color: var(--peach); }
  .grid { display: grid; gap: var(--s-7) var(--s-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); }
  .clients { margin-top: var(--s-9); }
  .client-mq { --mq-gap: 3.5rem; }
  .client { font: 400 clamp(2rem, 1.5rem + 2vw, 3.5rem)/1 var(--font-display); white-space: nowrap; }
  .quote { margin-top: var(--s-9); max-width: 44ch; margin-inline: auto; }
  .quote blockquote { margin: 0; font-size: var(--fs-lead); line-height: 1.35; font-weight: 300; }
  .quote figcaption { margin-top: var(--s-4); font-size: var(--fs-small); }
</style>
```

`src/components/Testimonials.astro`:
```astro
---
import Eyebrow from './ui/Eyebrow.astro';
import T from './ui/T.astro';
import DraftTag from './ui/DraftTag.astro';
import type { UiString } from '../lib/strings';
interface Props { items: { id: string; quote: string; name: string; role: string; placeholder: boolean }[]; eyebrow: UiString }
const { items, eyebrow } = Astro.props;
const tilts = [-4, 3, -2, 4];
---
<section class="testimonials section" aria-labelledby="tm-title">
  <div class="wrap">
    <Eyebrow as="h2" id="tm-title"><T s={eyebrow} /></Eyebrow>
    <ul class="cards">
      {items.map((t, i) => (
        <li class="card" style={`--tilt: ${tilts[i % tilts.length]}deg`} data-placeholder={t.placeholder ? '' : undefined} data-reveal>
          <figure>
            <blockquote>{t.quote}</blockquote>
            <figcaption><strong class="name">{t.name}</strong><span>{t.role}</span><DraftTag when={t.placeholder} /></figcaption>
          </figure>
        </li>
      ))}
    </ul>
  </div>
</section>
<style>
  .cards { list-style: none; margin: var(--s-7) 0 0; padding: 0; display: grid; gap: var(--s-6); grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); }
  .card { padding: var(--s-6); border-radius: var(--r-card); background: var(--white); transform: rotate(var(--tilt)); }
  .card:nth-child(even) { background: var(--charcoal); color: var(--peach); }
  figure { margin: 0; display: grid; gap: var(--s-5); }
  blockquote { margin: 0; font-size: var(--fs-lead); line-height: 1.35; font-weight: 300; }
  figcaption { display: grid; gap: 2px; font-size: var(--fs-small); }
  .name { font: 400 1.375rem/1 var(--font-display); letter-spacing: .02em; }
  @media (max-width: 767px) { .card { transform: none; } }
</style>
```

`src/components/LetsConnect.astro`:
```astro
---
import Marquee from './ui/Marquee.astro';
import Pill from './ui/Pill.astro';
import T from './ui/T.astro';
import DraftTag from './ui/DraftTag.astro';
import type { UiString } from '../lib/strings';
interface Props { line: UiString; cta?: UiString; href?: string }
const { line, cta, href } = Astro.props;
---
<section class="connect" data-placeholder={line.placeholder ? '' : undefined} aria-label={line.text}>
  <Marquee speed={36}><span class="solid">{line.text}</span></Marquee>
  <Marquee speed={44} reverse><span class="outline">{line.text}</span></Marquee>
  <DraftTag when={line.placeholder} />
  {cta && href && <div class="cta"><Pill href={href} variant="fill"><T s={cta} /></Pill></div>}
</section>
<style>
  .connect { position: relative; padding-block: var(--section-y); overflow: hidden; --mq-gap: 2.5rem; }
  .connect :global(.marquee) { pointer-events: none; }
  .solid, .outline { font: 400 clamp(4rem, 2rem + 9vw, 11rem)/.9 var(--font-display); white-space: nowrap; }
  .solid { color: #8f8888; }
  .outline { color: transparent; -webkit-text-stroke: 1.5px var(--ink); }
  .cta { position: absolute; inset: 0; display: grid; place-items: center; }
  .cta :global(.pill) { font-size: clamp(1.25rem, 1rem + 1vw, 2rem); padding: 14px 28px 11px; }
</style>
```
**Note:** `aria-label` on the section plus `aria-hidden` on the second marquee copy means screen readers get the line once.

- [ ] **Step 4: Restyle `ContactForm`**

Replace everything between `<style>` and `</style>` in `src/components/ContactForm.astro` with the rules below. The markup and script stay unchanged.
```css
  .contact { background: var(--accent); color: var(--ink); padding-block: var(--section-y); }
  .contact { display: grid; gap: var(--s-7); padding-inline: max(var(--gutter), calc((100% - var(--max)) / 2)); }
  .intro :global(h2) { margin: 0; font: 400 var(--fs-h2)/var(--lh-display) var(--font-display); text-wrap: balance; overflow-wrap: anywhere; }
  .enquiry { display: grid; gap: var(--s-4); }
  .field { display: grid; gap: 6px; }
  .label, legend { font: 500 var(--fs-label)/1.2 var(--font-text); letter-spacing: .1em; text-transform: uppercase; }
  input:not([type='checkbox']), textarea {
    width: 100%; min-height: 48px; padding: 12px 18px; border: 1.5px solid var(--ink); border-radius: var(--r-pill);
    background: rgb(246 241 238 / .9); color: var(--ink); font: 400 var(--fs-body)/1.4 var(--font-text);
  }
  textarea { min-height: 140px; border-radius: var(--r-card); resize: vertical; }
  .groups { display: grid; gap: var(--s-4); }
  .group { margin: 0; padding: 0; border: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .group legend { margin-bottom: var(--s-2); }
  .option { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1.5px solid var(--ink); border-radius: var(--r-pill); cursor: pointer; }
  .option input { width: 18px; height: 18px; accent-color: var(--ink); }
  .group.invalid .option { border-style: dashed; }
  .group-error { width: 100%; margin: 0; font-size: var(--fs-small); font-weight: 500; }
  .req { color: inherit; }
  button[type='submit'] {
    justify-self: start; min-height: 52px; padding: 12px 32px 9px; border: 0; border-radius: var(--r-pill);
    background: var(--ink); color: var(--accent); font: 400 1.5rem/1 var(--font-display); letter-spacing: .04em; cursor: pointer;
  }
  button[type='submit'][aria-disabled='true'] { opacity: .6; }
  .status { margin: 0; min-height: 1.5em; font-weight: 500; }
  .success :global(*) { margin: 0; font: 400 var(--fs-h3)/1 var(--font-display); }
  .contact :focus-visible { outline-color: var(--ink); }
  @media (min-width: 1024px) { .contact { grid-template-columns: 1fr 1.2fr; align-items: start; } }
```

- [ ] **Step 5: Rewrite `index.astro`**

```astro
---
import { getCollection, getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import HeroMedia from '../components/ui/HeroMedia.astro';
import Sticker from '../components/ui/Sticker.astro';
import Eyebrow from '../components/ui/Eyebrow.astro';
import Pill from '../components/ui/Pill.astro';
import T from '../components/ui/T.astro';
import FeaturedStack from '../components/FeaturedStack.astro';
import ServicesPreview from '../components/ServicesPreview.astro';
import StatsBand from '../components/StatsBand.astro';
import ProjectGrid from '../components/ProjectGrid.astro';
import Testimonials from '../components/Testimonials.astro';
import LetsConnect from '../components/LetsConnect.astro';
import ContactForm from '../components/ContactForm.astro';
import { loadExtras } from '../lib/extras';
import { renderMd } from '../lib/markdown';
import { sentenceStarting } from '../lib/copy';
import { slugOf } from '../lib/next-project';

const d = (await getEntry('home', 'home'))!.data;
const about = (await getEntry('basic', 'about'))!.data;
const x = await loadExtras();
const { text } = x;
const aboutMd = about.blocks.filter((b) => b.type === 'text').map((b: any) => b.md).join('\n\n');
const intro = sentenceStarting(aboutMd, 'The name Achates 360');
if (!intro) throw new Error('Homepage intro: no About paragraph starts with "The name Achates 360" (spec §4.1)');
const words = intro.split(' ');
const [introDark, introMuted] = [words.slice(0, 5).join(' '), words.slice(5).join(' ')];
const projects = new Map((await getCollection('projects')).map((e) => [e.id, e.data]));
const featured = d.slides.map((slide) => ({ slide, project: projects.get(slugOf(slide.cta?.href) ?? '') }));
const listedCount = [...projects.values()].filter((p) => p.listed).length;
const hero = d.slides[0];
---
<Base title={d.seo.title} description={d.seo.description} ogImage={d.seo.ogImage} page="home" overHero>
  <section class="h-hero" data-hero>
    <HeroMedia media={hero.media} />
    <div class="h-hero-text">
      <Sticker class="h-sticker" data-hero-sticker><T s={text('hero-sticker')} /></Sticker>
      <h1 class="display mega" data-hero-title>{text('wordmark').text}</h1>
      <p class="label h-tagline wrap"><T s={text('hero-tagline')} /></p>
    </div>
  </section>

  <FeaturedStack items={featured} eyebrow={text('featured-eyebrow')} />

  <section class="h-intro wrap section" aria-labelledby="intro-title">
    <Eyebrow><T s={text('intro-eyebrow')} /></Eyebrow>
    <h2 id="intro-title" class="display h2 two-tone" data-split>{introDark} <span class="muted">{introMuted}</span></h2>
    <Pill href="/about" variant="fill"><T s={text('intro-cta')} /></Pill>
  </section>

  <ServicesPreview services={x.services} eyebrow={text('services-eyebrow')} cta={text('services-cta')} />
  <StatsBand stats={x.stats} listedCount={listedCount} clients={x.clients} quote={x.testimonials[0]} eyebrow={text('clients-eyebrow')} />

  <section id="all-projects" class="h-all wrap section">
    <div class="h-all-heading" set:html={renderMd(d.allProjects.md)} />
    <ProjectGrid items={d.allProjects.items} />
  </section>

  <Testimonials items={x.testimonials} eyebrow={text('testimonials-eyebrow')} />
  <LetsConnect line={text('connect-line')} />
  <ContactForm md={d.contact.md} form={d.contact.form} />
</Base>
<style>
  .h-hero { position: relative; min-height: 100svh; display: flex; align-items: flex-end; color: var(--white); isolation: isolate; overflow: hidden; }
  .h-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgb(0 0 0 / .4), rgb(0 0 0 / .1) 40%, rgb(0 0 0 / .55)); pointer-events: none; }
  .h-hero-text { position: relative; z-index: 1; width: 100%; padding-bottom: var(--s-7); display: grid; }
  .h-hero-text :global(.h-sticker) { justify-self: start; margin: 0 0 var(--s-4) var(--gutter); }
  .h-hero-text h1 { padding-inline: calc(var(--gutter) * .6); white-space: nowrap; }
  .h-tagline { margin: var(--s-4) auto 0; }
  .two-tone { max-width: 22ch; margin-block: var(--s-4) var(--s-7); }
  .two-tone .muted { color: var(--muted); }
  .h-all-heading :global(h2) { margin: 0 0 var(--s-7); font: 400 var(--fs-h2)/var(--lh-display) var(--font-display); }
  .h-all-heading :global(a) { text-decoration: none; }
  .h-all-heading :global(a:hover) { text-decoration: underline; text-decoration-color: var(--accent); }
  #all-projects { scroll-margin-top: var(--header-h); }
</style>
```
- [ ] **Step 6: Remove the clone's homepage-only dependencies**

`index.astro` no longer imports `AnchorMenu`, `Gallery` or `@fontsource/nunito-sans`. Confirm:
```bash
grep -rn "nunito-sans\|AnchorMenu\|Gallery.astro" src --include=*.astro
```
Expected: matches only in `src/pages/projects.astro`, `src/layouts/Basic.astro` and `src/layouts/Card.astro`, which are replaced in Tasks 6 and 7.

- [ ] **Step 7: Build, verify and look**

Run: `npm test && npm run build && npm run verify`
Expected: PASS, 68/68.
```bash
grep -c '<h1' dist/index.html
grep -c 'id="contact"' dist/index.html
grep -c 'id="all-projects"' dist/index.html
```
Expected: 1, 1, 1. Then preview `/` at 1440 and 375 and check:
- the hero video with the giant wordmark
- six stacking cards
- the intro with grey continuation text and the services on peach
- the black stats band with a client marquee
- the project grid with hover previews (desktop)
- tilted testimonials, the "Let's connect" marquees and the orange enquiry form
- DRAFT tags on every placeholder

- [ ] **Step 8: Commit**

```bash
git add src/components src/pages/index.astro src/lib/meta.ts src/lib/meta.test.ts
git commit -m "Work-first homepage: hero, featured stack, intro, services, stats, grid, testimonials, connect

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `/projects` and `/copy-of-projects`

**Files:**
- Rewrite: `src/pages/projects.astro`
- Create: `src/layouts/Categories.astro`
- Modify: `src/pages/[slug].astro` (route `copy-of-projects` to `Categories`)

**Interfaces:**
- Consumes: `ProjectGrid`, `Block`, `loadExtras().text`, `renderMd`, `titleFromSeo`, `site.menu` (for the verbatim PROJECTS label).
- Produces: `<Categories entry={CollectionEntry<'basic'>} />`.

- [ ] **Step 1: Rewrite `/projects`**

```astro
---
import { getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import ProjectGrid from '../components/ProjectGrid.astro';
import { loadExtras } from '../lib/extras';
const d = (await getEntry('projectsIndex', 'projects'))!.data;
const site = (await getEntry('site', 'site'))!.data;
const { text } = await loadExtras();
// The page heading is the site menu's own PROJECTS label, verbatim.
const heading = site.menu?.find((m) => m.href === '/projects')?.label ?? d.sections[0].heading;
const ids = new Set(d.sections.map((s) => s.id));
const chips = d.menu.filter((i) => i.target !== 'footer').map((i) => ({ label: i.label, id: ids.has(i.target) ? i.target : d.sections[0].id }));
---
<Base title={d.seo.title} description={d.seo.description} ogImage={d.seo.ogImage} page="projects">
  <header class="wrap pi-head"><h1 class="display h1" data-split>{heading}</h1></header>
  <nav class="chips-bar" aria-label={text('sections-label').text}>
    <ul class="wrap">{chips.map((c) => <li><a href={`#${c.id}`} data-chip={c.id}>{c.label}</a></li>)}</ul>
  </nav>
  {d.sections.map((s) => (
    <section id={s.id} class="pi-section wrap" aria-labelledby={`${s.id}-h`}>
      <h2 id={`${s.id}-h`} class="display h2" data-split>{s.heading}</h2>
      <ProjectGrid items={s.items} />
    </section>
  ))}
</Base>
<script>
  // The chip for the section in view gets aria-current; the row scrolls to keep it visible.
  const chips = new Map([...document.querySelectorAll<HTMLAnchorElement>('[data-chip]')].map((a) => [a.dataset.chip!, a]));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      chips.forEach((a) => a.removeAttribute('aria-current'));
      const a = chips.get(e.target.id);
      if (!a) continue;
      a.setAttribute('aria-current', 'true');
      a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.pi-section').forEach((s) => io.observe(s));
</script>
<style>
  .pi-head { padding-block: var(--s-8) var(--s-6); }
  .chips-bar { position: sticky; top: calc(var(--header-h) + env(safe-area-inset-top, 0px)); z-index: 10; background: var(--paper); border-block: 1px solid var(--line); }
  .chips-bar ul { list-style: none; margin-inline: auto; padding: var(--s-3) 0; display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
  .chips-bar a {
    display: inline-block; white-space: nowrap; padding: 8px 14px; border: 1.5px solid var(--ink); border-radius: var(--r-pill);
    font: 500 var(--fs-label)/1.2 var(--font-text); letter-spacing: .08em; text-transform: uppercase; text-decoration: none;
  }
  .chips-bar a[aria-current] { background: var(--ink); color: var(--paper); }
  .pi-section { padding-block: var(--s-8); scroll-margin-top: calc(var(--header-h) + 64px); }
  .pi-section h2 { margin-bottom: var(--s-7); }
</style>
```
**Note:** the header hides as you scroll down, and the chips bar keeps `top: var(--header-h)`. The gap left above the bar is a deliberate breathing strip, so don't chase it.

- [ ] **Step 2: Write `Categories.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import Base from './Base.astro';
import ProjectGrid from '../components/ProjectGrid.astro';
import Block from '../components/Block.astro';
import { renderMd } from '../lib/markdown';
import { titleFromSeo } from '../lib/copy';
// /copy-of-projects (spec §4.3): each "## Category" text block heads the gallery after it.
interface Props { entry: CollectionEntry<'basic'> }
const d = Astro.props.entry.data;
---
<Base title={d.seo.title} description={d.seo.description} ogImage={d.seo.ogImage} page="categories">
  <header class="wrap cat-head"><h1 class="display h1" data-split>{titleFromSeo(d.seo.title)}</h1></header>
  <div class="wrap cat-body">
    {d.blocks.map((b: any) => {
      if (b.type === 'text') return <div class="cat-heading" set:html={renderMd(b.md)} />;
      if (b.type === 'gallery') return <ProjectGrid items={b.items} />;
      return <Block block={b} />;
    })}
  </div>
</Base>
<style>
  .cat-head { padding-block: var(--s-8) var(--s-6); }
  .cat-body { padding-bottom: var(--s-9); }
  .cat-heading :global(h2) { margin: var(--s-9) 0 var(--s-6); font: 400 var(--fs-h2)/var(--lh-display) var(--font-display); }
</style>
```

- [ ] **Step 3: Route `copy-of-projects` to it**

In `src/pages/[slug].astro`:
- Add `import Categories from '../layouts/Categories.astro';`
- Replace the last line with:
```astro
{props.kind === 'basic' && (props.entry.id === 'copy-of-projects' ? <Categories entry={props.entry} /> : <Basic entry={props.entry} />)}
```

- [ ] **Step 4: Build, verify and look**

Run: `npm test && npm run build && npm run verify`
Expected: PASS.
```bash
grep -c '<h1' dist/projects.html dist/copy-of-projects.html
```
Expected: 1 each. Preview `/projects`:
- the chips stick under the header
- tapping one scrolls to its section, and the chip for the section in view highlights
- 🏆 titles show exactly as exported on `/copy-of-projects`

- [ ] **Step 5: Commit**

```bash
git add src/pages/projects.astro src/pages/[slug].astro src/layouts/Categories.astro
git commit -m "Projects index with sticky category chips; project categories page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `/joinus`, business cards, generic page; remove the clone presentation layer

**Files:**
- Create: `src/layouts/JoinUs.astro`, `src/layouts/Page.astro`
- Modify:
  - `src/layouts/Card.astro` (font import, `<style>`, Base props)
  - `src/pages/[slug].astro`
  - `src/layouts/Base.astro` (drop transitional props; `page` required)
- Delete:
  - `src/layouts/Basic.astro`
  - `src/components/{Blocks,Gallery,AnchorMenu}.astro`
  - `@fontsource/nunito-sans`

**Interfaces:**
- Consumes: `splitRoleHeading`, `titleFromSeo`, `MediaRows`, `Block`, `Sticker`, `T`, `renderMd`.
- Produces: `<JoinUs entry>`, `<Page entry>`. Base Props become `{ title; description?; ogImage?; page: PageKind; overHero? }`.

- [ ] **Step 1: Write `JoinUs.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { Image } from 'astro:assets';
import Base from './Base.astro';
import Sticker from '../components/ui/Sticker.astro';
import T from '../components/ui/T.astro';
import { renderMd } from '../lib/markdown';
import { splitRoleHeading } from '../lib/copy';
import { loadExtras } from '../lib/extras';
// /joinus (spec §4.6): the first text block is the page heading ("# Join us"); each later text
// block with a heading is a role, with the image just before it as its picture. Native <details>
// works without JS.
interface Props { entry: CollectionEntry<'basic'> }
const d = Astro.props.entry.data;
const { text } = await loadExtras();
const [head, ...rest] = d.blocks as any[];
const roles: { title: string; md: string; image?: any }[] = [];
const others: any[] = [];
let pending: any;
for (const b of rest) {
  if (b.type === 'image') { pending = b; continue; }
  const split = b.type === 'text' ? splitRoleHeading(b.md) : null;
  if (split) { roles.push({ title: split.title, md: split.rest, image: pending }); pending = undefined; }
  else others.push(b);
}
if (pending) others.push(pending);
// Nothing may silently disappear: a block shape this template does not place fails the build.
if (others.length) throw new Error(`/joinus: ${others.length} block(s) not placed in a role card; extend JoinUs.astro`);
---
<Base title={d.seo.title} description={d.seo.description} ogImage={d.seo.ogImage} page="joinus">
  <header class="wrap ju-head" set:html={renderMd(head.md)} />
  <div class="wrap roles">
    {roles.map((r, i) => (
      <details class="role" open={i === 0} data-reveal>
        <summary>
          <Sticker><T s={text('role-sticker')} /></Sticker>
          <h2 class="display h2">{r.title}</h2>
        </summary>
        <div class="role-body">
          {r.image && <Image class="role-img" src={r.image.src} alt={r.image.alt} widths={[480, 960]} sizes="(max-width: 1023px) 100vw, 40vw" />}
          <div class="prose" set:html={renderMd(r.md)} />
        </div>
      </details>
    ))}
  </div>
</Base>
<style>
  .ju-head { padding-block: var(--s-8) var(--s-6); }
  .ju-head :global(h1) { margin: 0; font: 400 var(--fs-h1)/var(--lh-display) var(--font-display); }
  .roles { display: grid; gap: var(--s-5); padding-bottom: var(--s-9); }
  .role { border-radius: var(--r-card); background: var(--white); padding: var(--s-6); }
  summary { display: grid; justify-items: start; gap: var(--s-3); cursor: pointer; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  summary h2::after { content: ' +'; color: var(--accent); }
  .role[open] summary h2::after { content: ' –'; }
  .role-body { display: grid; gap: var(--s-6); margin-top: var(--s-6); }
  .role-body :global(.role-img) { width: 100%; height: auto; border-radius: var(--r-card); }
  @media (min-width: 1024px) { .role-body { grid-template-columns: 2fr 3fr; align-items: start; } }
</style>
```
- [ ] **Step 2: Write `Page.astro` (any other basic page)**

```astro
---
import type { CollectionEntry } from 'astro:content';
import Base from './Base.astro';
import MediaRows from '../components/MediaRows.astro';
import { titleFromSeo } from '../lib/copy';
// Fallback for a basic page with no dedicated template (none exist in the 6 Oct export): its
// blocks in the case-study flow; an sr-only h1 from the SEO title when the copy has none.
interface Props { entry: CollectionEntry<'basic'> }
const d = Astro.props.entry.data;
const hasH1 = d.blocks.some((b: any) => b.type === 'text' && /^#\s/m.test(b.md));
---
<Base title={d.seo.title} description={d.seo.description} ogImage={d.seo.ogImage} page="page">
  {!hasH1 && <h1 class="sr-only">{titleFromSeo(d.seo.title)}</h1>}
  <div class="wrap section"><MediaRows blocks={d.blocks} pageTitle={d.seo.title} /></div>
</Base>
```

- [ ] **Step 3: Restyle the business card**

In `src/layouts/Card.astro`:
- Delete the line `import '@fontsource/nunito-sans/800.css';` and its comment.
- Delete `const PAGE_BG = …` and its comment.
- Change the Base tag to `<Base title={d.seo.title} description={d.seo.description} ogImage={d.seo.ogImage} page="card">`.

Keep every element and the icon-link logic (CONTENT-QUERIES #1). Replace the whole `<style>` block with:
```css
  :global(body[data-page='card']) { background: var(--charcoal); }
  .card-section { display: grid; place-items: center; padding: var(--s-6) var(--gutter) var(--s-9); }
  .card {
    width: min(100%, 440px); display: grid; justify-items: start; gap: var(--s-4);
    padding: var(--s-7) var(--s-6); border-radius: var(--r-block); background: var(--peach); color: var(--ink);
  }
  .card :global(.photo) { width: 140px; height: 140px; border-radius: 50%; object-fit: cover; }
  .name { margin: var(--s-2) 0 0; font: 400 var(--fs-h2)/var(--lh-display) var(--font-display); overflow-wrap: anywhere; }
  .role { margin: 0; font: 500 var(--fs-label)/1.3 var(--font-text); letter-spacing: .1em; text-transform: uppercase; }
  .blurb { margin: 0; font-size: var(--fs-small); }
  .contact { display: flex; align-items: center; gap: var(--s-2); width: 100%; }
  .contact .icon { flex: none; width: 44px; height: 44px; display: grid; place-items: center; border: 1.5px solid var(--ink); border-radius: 50%; }
  .contact .icon svg { width: 20px; height: 20px; fill: currentColor; }
  .contact .text {
    flex: 1; min-width: 0; min-height: 44px; display: flex; align-items: center; padding: 8px 18px;
    border: 1.5px solid var(--ink); border-radius: var(--r-pill); text-decoration: none; overflow-wrap: anywhere;
  }
  .contact .text:hover, .contact .icon:hover { background: var(--ink); color: var(--peach); }
  .vcard {
    display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 22px 7px;
    border-radius: var(--r-pill); background: var(--accent); color: var(--ink); text-decoration: none;
    font: 400 1.25rem/1 var(--font-display); letter-spacing: .04em;
  }
  .vcard svg { width: 22px; height: 22px; fill: currentColor; }
  .card :global(.qr) { width: 148px; height: auto; margin-top: var(--s-4); border-radius: 8px; }
  @media (max-width: 767px) { :global(body[data-page='card']) { background: var(--peach); } .card { padding-inline: 0; } }
```
These rules cover every class in the card markup: `card-section`, `card`, `photo`, `name`, `role`, `blurb`, `contact`/`icon`/`text`, `vcard` and `qr`.

- [ ] **Step 4: Route basic pages and remove the clone layer**

`src/pages/[slug].astro` imports become:
```astro
import Project from '../layouts/Project.astro';
import Card from '../layouts/Card.astro';
import JoinUs from '../layouts/JoinUs.astro';
import Categories from '../layouts/Categories.astro';
import Page from '../layouts/Page.astro';
```
Its last line becomes:
```astro
{props.kind === 'basic' && (
  props.entry.id === 'joinus' ? <JoinUs entry={props.entry} />
  : props.entry.id === 'copy-of-projects' ? <Categories entry={props.entry} />
  : <Page entry={props.entry} />
)}
```
(`/about` renders through `Page` until Task 9.)

In `src/layouts/Base.astro`:
- Props become `interface Props { title: string; description?: string; ogImage?: ImageMetadata; page: PageKind; overHero?: boolean }`.
- Destructuring becomes `const { title, description, ogImage, page, overHero = false } = Astro.props;`.
- `<body>` becomes `<body data-page={page} data-over-hero={overHero ? '' : undefined}>`.
- Delete the transitional comment.

Then run:
```bash
git rm src/layouts/Basic.astro src/components/Blocks.astro src/components/Gallery.astro src/components/AnchorMenu.astro
npm uninstall @fontsource/nunito-sans
grep -rn "nunito\|--color-\|var(--m)\|Blocks\.astro\|Gallery\.astro\|AnchorMenu" src
```
Expected: no matches. Any `--color-*` or `--m` left is a clone token to replace with the new tokens.

- [ ] **Step 5: Build, verify and check**

Run: `npm test && npm run build && npm run verify`
Expected: PASS, 68/68. `astro check` passes with `page` now required on every Base call.
```bash
for f in joinus about angeline copy-of-projects; do echo "$f $(grep -c '<h1' dist/$f.html)"; done
```
Expected: each prints 1. Preview `/angeline` at 375:
- a peach card with photo, name, pill phone and email links, the orange vCard button and the QR code
- the phone and mail icons keep their own (verbatim) targets

- [ ] **Step 6: Commit**

```bash
git add -A src package.json package-lock.json
git commit -m "Join us roles, restyled business cards, generic page; remove clone presentation layer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `/services` and the SERVICES menu item

**Files:**
- Create:
  - `src/lib/menu.ts` (+ `menu.test.ts`)
  - `src/pages/services.astro`
  - `src/components/{ServiceRows,ProcessSteps,Reel}.astro`
  - `scripts/new-pages.json`
- Modify:
  - `src/layouts/Base.astro` (menu via `withServices`)
  - `src/lib/routes.ts` (reserve `services`)
  - `scripts/verify-dist.mjs`, `scripts/verify-dist.test.mjs`

**Interfaces:**
- Consumes: `loadExtras()` (services, process, text), projects collection (hero media by slug), the home slide-1 media (reel), `LetsConnect`, `Sticker`, `Chip`, `T`, `DraftTag`, `BgVideo`, `Player`, `phAttr`.
- Produces:
  - `withServices(menu: NavLink[], label: string, href?: string): NavLink[]`
  - `requiredPaths(sitemap, permanent, extra = [])`

- [ ] **Step 1: Write the failing tests**

`src/lib/menu.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { withServices } from './menu';

const menu = [{ label: 'HOME', href: '/' }, { label: 'PROJECTS', href: '/projects', items: [{ label: 'Notter', href: '/notter' }] }, { label: 'CONTACT', href: '/#contact' }];

describe('withServices', () => {
  it('inserts SERVICES right after PROJECTS', () => {
    expect(withServices(menu, 'SERVICES').map((m) => m.label)).toEqual(['HOME', 'PROJECTS', 'SERVICES', 'CONTACT']);
  });
  it('does not change the menu it was given', () => {
    withServices(menu, 'SERVICES');
    expect(menu).toHaveLength(3);
  });
  it('is idempotent when the menu already links /services', () => {
    const once = withServices(menu, 'SERVICES');
    expect(withServices(once, 'SERVICES')).toEqual(once);
  });
  it('appends when there is no PROJECTS item', () => {
    expect(withServices([{ label: 'HOME', href: '/' }], 'SERVICES').at(-1)).toEqual({ label: 'SERVICES', href: '/services' });
  });
});
```

Append to `scripts/verify-dist.test.mjs`:
```js
describe('extra required paths', () => {
  it('requires new redesign pages alongside the sitemap and permanent lists', () => {
    expect(requiredPaths(['/'], ['/', '/angeline'], ['/services'])).toEqual(['/', '/angeline', '/services']);
  });
  it('the committed new-pages list holds /services', () => {
    const extra = JSON.parse(readFileSync(new URL('./new-pages.json', import.meta.url), 'utf8'));
    expect(extra).toEqual(['/services']);
  });
});
```
Run: `npx vitest run src/lib/menu.test.ts scripts/verify-dist.test.mjs`
Expected: FAIL. `./menu` is missing, `/services` isn't in the result, and `new-pages.json` is missing.

- [ ] **Step 2: Implement**

`src/lib/menu.ts`:
```ts
export interface NavLink { label: string; href: string; items?: NavLink[] }

/** The site menu with SERVICES after PROJECTS (spec §3.5); site.md itself is never edited. */
export function withServices(menu: NavLink[], label: string, href = '/services'): NavLink[] {
  if (menu.some((m) => m.href === href)) return menu;
  const item = { label, href };
  const at = menu.findIndex((m) => m.href === '/projects');
  return at === -1 ? [...menu, item] : [...menu.slice(0, at + 1), item, ...menu.slice(at + 1)];
}
```
`scripts/new-pages.json`:
```json
["/services"]
```
In `scripts/verify-dist.mjs`:
- Change `requiredPaths` to:
```js
export function requiredPaths(sitemap, permanent, extra = []) {
  return [...new Set([...sitemap, ...permanent, ...extra])].sort();
}
```
- In the CLI block, read `const extra = JSON.parse(await readFile('scripts/new-pages.json', 'utf8'));`.
- Call `requiredPaths(sitemap, permanent, extra)`.
- Add `, new ${extra.length}` to the `pages:` log line.

In `src/lib/routes.ts`, change `RESERVED` to `['index', 'projects', 'services', 'robots.txt']`.
In `src/layouts/Base.astro`:
- import `withServices` from `'../lib/menu'`.
- set `const menu = withServices(site.menu ?? [], text('menu-services').text);`.

- [ ] **Step 3: Write `ServiceRows`, `ProcessSteps` and `Reel`**

`src/components/ServiceRows.astro`:
```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import BgVideo from './BgVideo.astro';
import Chip from './ui/Chip.astro';
import DraftTag from './ui/DraftTag.astro';
import { loadExtras } from '../lib/extras';
type Hero = NonNullable<CollectionEntry<'projects'>['data']['hero']>;
interface Props { services: { id: string; title: string; body: string; tags: string[]; placeholder: boolean; hero: Hero }[] }
const { services } = Astro.props;
const { text } = await loadExtras();
---
<ol class="service-rows wrap">
  {services.map((s) => (
    <li class="svc" data-placeholder={s.placeholder ? '' : undefined}>
      <div class="svc-text">
        <h2 class="display h2" data-split>{s.title}<DraftTag when={s.placeholder} /></h2>
        <p>{s.body}</p>
        <ul class="tags">{s.tags.map((t) => <li><Chip>{t}</Chip></li>)}</ul>
      </div>
      <div class="svc-media" data-reveal data-bgvideo-viewport>
        {s.hero.type === 'video'
          ? <BgVideo src={s.hero.src} poster={s.hero.poster} class="svc-video" pauseLabel={text('video-pause').text} playLabel={text('video-play').text} />
          : <Image src={s.hero.src} alt={s.hero.alt} widths={[480, 960, 1440]} sizes="(max-width: 1023px) 100vw, 45vw" />}
      </div>
    </li>
  ))}
</ol>
<style>
  .service-rows { list-style: none; margin: 0 auto; padding: 0 0 var(--section-y); }
  .svc { display: grid; gap: var(--s-6); padding-block: var(--s-8); border-top: 1px solid var(--line); }
  .svc-text p { max-width: 44ch; margin: var(--s-4) 0; }
  .tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .svc-media { position: relative; aspect-ratio: 4 / 3; border-radius: var(--r-card); overflow: hidden; background: var(--charcoal); }
  .svc-media :global(img), .svc-media :global(.svc-video) { width: 100%; height: 100%; object-fit: cover; }
  @media (min-width: 1024px) { .svc { grid-template-columns: 1fr 1fr; align-items: center; } }
</style>
```

`src/components/ProcessSteps.astro`:
```astro
---
import T from './ui/T.astro';
import DraftTag from './ui/DraftTag.astro';
import type { UiString } from '../lib/strings';
interface Props { steps: { id: string; step: number; title: string; body: string; placeholder: boolean }[]; heading: UiString; stepLabel: UiString }
const { steps, heading, stepLabel } = Astro.props;
---
<section class="process wrap" aria-labelledby="process-title">
  <h2 id="process-title" class="display h2" data-split><T s={heading} /></h2>
  <ol class="steps">
    {steps.map((s) => (
      <li class="step" data-placeholder={s.placeholder ? '' : undefined} data-reveal>
        <details>
          <summary>
            <span class="label">{stepLabel.text} {String(s.step).padStart(2, '0')}</span>
            <span class="display step-title">{s.title}<DraftTag when={s.placeholder} /></span>
          </summary>
          <p>{s.body}</p>
        </details>
      </li>
    ))}
  </ol>
</section>
<style>
  .process { padding: var(--s-8) var(--s-6); border-radius: var(--r-block); background: #ece6e2; text-align: center; }
  .steps { list-style: none; margin: var(--s-7) 0 0; padding: 0; display: grid; gap: var(--s-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); position: relative; }
  .step { position: relative; }
  .step::before { content: ''; display: block; width: 14px; height: 14px; margin: 0 auto var(--s-4); background: var(--ink); clip-path: polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%); }
  details { padding: var(--s-5); border-radius: var(--r-card); background: var(--white); }
  summary { display: grid; gap: var(--s-2); cursor: pointer; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  .step-title { font-size: var(--fs-h3); }
  details p { margin: var(--s-4) 0 0; font-size: var(--fs-small); }
  @media (min-width: 1024px) { .steps::before { content: ''; position: absolute; top: 6px; left: 12%; right: 12%; border-top: 2px dotted var(--muted); } }
</style>
```
**Note:** the `step-label` text plus a number is built in the template from the `process-step` string ("Step") and the entry's `step`. No copy is invented.

`src/components/Reel.astro`:
```astro
---
import Player from './Player.astro';
import T from './ui/T.astro';
import type { UiString } from '../lib/strings';
interface Props { src: string; poster: ImageMetadata; left: UiString; right: UiString; label: string }
const { src, poster, left, right, label } = Astro.props;
---
<section class="reel section" aria-label={label}>
  <span class="side display" aria-hidden="true"><T s={left} /></span>
  <div class="reel-video" data-reveal><Player src={src} poster={poster} label={label} /></div>
  <span class="side display" aria-hidden="true"><T s={right} /></span>
</section>
<style>
  .reel { display: grid; grid-template-columns: 1fr; justify-items: center; gap: var(--s-4); padding-inline: var(--gutter); }
  .side { font-size: var(--fs-h2); color: #c9c2be; }
  .reel-video { width: min(100%, 860px); }
  @media (min-width: 1024px) { .reel { grid-template-columns: 1fr minmax(0, 860px) 1fr; align-items: center; } .side:last-child { justify-self: end; } }
</style>
```

- [ ] **Step 4: Write `services.astro`**

```astro
---
import { getCollection, getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import Sticker from '../components/ui/Sticker.astro';
import T from '../components/ui/T.astro';
import ServiceRows from '../components/ServiceRows.astro';
import ProcessSteps from '../components/ProcessSteps.astro';
import Reel from '../components/Reel.astro';
import LetsConnect from '../components/LetsConnect.astro';
import { loadExtras } from '../lib/extras';
const x = await loadExtras();
const { text } = x;
const projects = new Map((await getCollection('projects')).map((e) => [e.id, e.data]));
const services = x.services.map((s: any) => {
  const hero = projects.get(s.project)?.hero;
  if (!hero) throw new Error(`services/${s.id}: project "${s.project}" has no hero to show`);
  return { ...s, hero };
});
const reel = (await getEntry('home', 'home'))!.data.slides[0].media;
if (reel.type !== 'video') throw new Error('Reel: homepage slide-1 is no longer a video');
const heading = text('services-heading');
---
<Base title={`${heading.text} | Achates 360`} description={x.services.map((s: any) => s.title).join(', ')} page="services">
  <header class="wrap sv-head" data-placeholder={heading.placeholder ? '' : undefined}>
    <Sticker><T s={text('services-sticker')} /></Sticker>
    <h1 class="display mega" data-split><T s={heading} /></h1>
  </header>
  <ServiceRows services={services} />
  <ProcessSteps steps={x.process} heading={text('process-heading')} stepLabel={text('process-step')} />
  <Reel src={reel.src} poster={reel.poster} left={text('reel-left')} right={text('reel-right')} label={`${text('reel-left').text} ${text('reel-right').text}`} />
  <LetsConnect line={text('connect-line')} cta={text('connect-cta')} href="/#contact" />
</Base>
<style>
  .sv-head { padding-block: var(--s-8) var(--s-7); display: grid; justify-items: start; gap: var(--s-4); }
</style>
```
**Note:** the `<title>` "Services | Achates 360" and the description are built from placeholder strings, so the production guard covers them too. Add both to the Task 12 queries.

- [ ] **Step 5: Build, verify and check**

Run: `npm test && npm run build && npm run verify`
Expected: PASS. The `pages:` line now reads 69/69, plus "new 1".
```bash
grep -c 'href="/achates360-website/services"' dist/about.html
grep -c '<h1' dist/services.html
```
Expected: ≥1 (header and menu) and 1. Preview `/services`:
- the giant heading with its sticker
- four service rows with chips and media (the DXV video has a pause button)
- the grey process block with expanding steps, then PLAY | REEL around the reel and the connect marquee with "Get in touch" linking to `/#contact`

- [ ] **Step 6: Commit**

```bash
git add src scripts
git commit -m "Services page and SERVICES menu item; verify requires /services

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Expanded `/about`

**Files:**
- Create: `src/layouts/About.astro`, `src/components/Timeline.astro`
- Modify: `src/pages/[slug].astro` (route `about`)

**Interfaces:**
- Consumes:
  - `loadExtras()` (stats, timeline, clients, testimonials, text)
  - the projects collection
  - `firstYear`, `statValue`
  - `StatCounter`, `Marquee`, `Testimonials`, `LetsConnect`, `Block`, `Eyebrow`, `T`, `DraftTag`
  - site menu label for `/about`
- Produces: `<About entry>`, `<Timeline items heading>`.

- [ ] **Step 1: Write `Timeline.astro`**

```astro
---
import { Image } from 'astro:assets';
import Sticker from './ui/Sticker.astro';
import T from './ui/T.astro';
import DraftTag from './ui/DraftTag.astro';
import type { UiString } from '../lib/strings';
// Years and labels come from real projects (spec §6.2); only `body` is new copy. Base layout is a
// native snap scroller; motion pins it and scrolls it sideways on desktop (Task 11).
interface Item { id: string; year: string; label: string; body: string; image: ImageMetadata; alt: string; placeholder: boolean }
interface Props { items: Item[]; heading: UiString }
const { items, heading } = Astro.props;
---
<section class="timeline" data-timeline aria-labelledby="tl-title">
  <h2 id="tl-title" class="display h2 wrap" data-split><T s={heading} /></h2>
  <ol class="tl-track">
    {items.map((it, i) => (
      <li class="tl-item" data-placeholder={it.placeholder ? '' : undefined}>
        <p class="tl-year display">{it.year}</p>
        <Sticker tilt={i % 2 ? 4 : -5} tone={i % 2 ? 'peach' : 'accent'}>{it.label}</Sticker>
        <p class="tl-body">{it.body}<DraftTag when={it.placeholder} /></p>
        <Image class="tl-img" src={it.image} alt={it.alt} widths={[400, 800]} sizes="(max-width: 767px) 80vw, 380px" />
      </li>
    ))}
  </ol>
</section>
<style>
  .timeline { padding-block: var(--section-y); overflow: hidden; }
  .tl-track { list-style: none; margin: var(--s-7) 0 0; padding: 0 var(--gutter); display: flex; gap: var(--s-7); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: thin; }
  .tl-item { flex: 0 0 min(80vw, 380px); scroll-snap-align: start; display: grid; justify-items: start; gap: var(--s-4); }
  .tl-year { font-size: clamp(5rem, 3rem + 7vw, 10rem); line-height: .8; }
  .tl-body { margin: 0; padding-top: var(--s-4); border-top: 1px solid var(--line); font-size: var(--fs-small); }
  .tl-item :global(.tl-img) { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--r-card); }
  .timeline:global(.is-pinned) .tl-track { overflow: visible; scroll-snap-type: none; width: max-content; }
</style>
```

- [ ] **Step 2: Write `About.astro`**

```astro
---
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import Base from './Base.astro';
import Block from '../components/Block.astro';
import Eyebrow from '../components/ui/Eyebrow.astro';
import Marquee from '../components/ui/Marquee.astro';
import StatCounter from '../components/ui/StatCounter.astro';
import T from '../components/ui/T.astro';
import DraftTag from '../components/ui/DraftTag.astro';
import Timeline from '../components/Timeline.astro';
import Testimonials from '../components/Testimonials.astro';
import LetsConnect from '../components/LetsConnect.astro';
import { loadExtras } from '../lib/extras';
import { firstYear, statValue } from '../lib/meta';
// /about (spec §4.5): the existing About blocks verbatim on charcoal, then the new sections.
interface Props { entry: CollectionEntry<'basic'> }
const d = Astro.props.entry.data;
const x = await loadExtras();
const { text } = x;
const site = (await getEntry('site', 'site'))!.data;
const heading = site.menu?.find((m) => m.href === '/about')?.label ?? 'About';
const all = await getCollection('projects');
const projects = new Map(all.map((e) => [e.id, e.data]));
const listedCount = all.filter((e) => e.data.listed).length;
const timeline = x.timeline.map((t: any) => {
  const p = projects.get(t.project)!;
  const year = firstYear(p.copyright);
  if (!year || !p.hero) throw new Error(`timeline/${t.id}: project "${t.project}" needs a copyright year and a hero`);
  const image = p.hero.type === 'image' ? p.hero.src : p.hero.poster;
  const alt = p.hero.type === 'image' ? p.hero.alt : '';
  return { id: t.id, year, label: p.title, body: t.body, image, alt, placeholder: t.placeholder };
});
const anyClientDraft = x.clients.some((c: any) => c.placeholder);
---
<Base title={d.seo.title} description={d.seo.description} ogImage={d.seo.ogImage} page="about">
  <section class="ab-intro on-dark">
    <div class="wrap ab-grid">
      <h1 class="display h1" data-split>{heading}</h1>
      <div class="ab-blocks">{d.blocks.map((b: any) => <Block block={b} pageTitle={d.seo.title} />)}</div>
    </div>
  </section>
  <section class="wrap section ab-stats" aria-labelledby="ab-stats-t">
    <Eyebrow as="h2" id="ab-stats-t"><T s={text('about-stats-eyebrow')} /></Eyebrow>
    <div class="ab-stat-grid">{x.stats.map((s: any) => <StatCounter value={statValue(s, listedCount)} suffix={s.suffix} label={s.label} placeholder={s.placeholder} />)}</div>
  </section>
  <Timeline items={timeline} heading={text('timeline-heading')} />
  <section class="ab-clients section" aria-labelledby="ab-clients-t" data-placeholder={anyClientDraft ? '' : undefined}>
    <div class="wrap"><Eyebrow as="h2" id="ab-clients-t"><T s={text('clients-eyebrow')} /><DraftTag when={anyClientDraft} /></Eyebrow></div>
    <Marquee speed={55}>{x.clients.map((c: any) => <span class="client">{c.name}</span>)}</Marquee>
  </section>
  <Testimonials items={x.testimonials} eyebrow={text('testimonials-eyebrow')} />
  <LetsConnect line={text('connect-line')} cta={text('connect-cta')} href="/#contact" />
</Base>
<style>
  .ab-intro { padding-block: var(--s-8) var(--section-y); }
  .ab-grid { display: grid; gap: var(--s-7); }
  .ab-blocks { display: grid; gap: var(--s-6); max-width: 62ch; }
  .ab-blocks :global(.block-text) { font-size: var(--fs-lead); line-height: 1.4; font-weight: 300; }
  .ab-blocks :global(.block-image) { border-radius: var(--r-card); overflow: hidden; }
  .ab-blocks :global(.block-img) { width: 100%; height: auto; }
  .ab-blocks :global(.pill) { color: var(--peach); }
  .ab-stat-grid { display: grid; gap: var(--s-7) var(--s-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); }
  .ab-clients { background: var(--peach); --mq-gap: 3.5rem; }
  .client { font: 400 clamp(2rem, 1.5rem + 2vw, 3.5rem)/1 var(--font-display); white-space: nowrap; }
  @media (min-width: 1024px) { .ab-grid { grid-template-columns: 1fr 1.4fr; align-items: start; } }
</style>
```
In `src/pages/[slug].astro`:
- add `import About from '../layouts/About.astro';`
- add the branch `props.entry.id === 'about' ? <About entry={props.entry} />` before `joinus`.

- [ ] **Step 3: Build, verify and check**

Run: `npm test && npm run build && npm run verify`
Expected: PASS, 69/69.
```bash
grep -c '<h1' dist/about.html
grep -c 'faithful companion' dist/about.html
```
Expected: 1 and ≥1, which shows the About copy is still there verbatim. Preview `/about`:
- the charcoal intro, then the stats
- the timeline as a swipe row with years 2001 → 2025 from real projects
- the client marquee, testimonials, then the connect band

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "Expanded About: verbatim intro, stats, project-sourced timeline, clients, testimonials

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Built-page checks: structure, placeholders, JS budget, overflow

**Files:**
- Modify: `scripts/verify-dist.mjs`, `scripts/verify-dist.test.mjs`, `package.json` (script `check:overflow`)
- Create: `scripts/check-overflow.mjs`

**Interfaces:**
- Produces (exports of `verify-dist.mjs`):
  - `pageChecks(pages: {file, html}[], { production: boolean, base: string }): {file, problem}[]`
  - `scriptFiles(html: string): string[]`
  - `importsOf(js: string): string[]`
  - `jsWeights(pages, readJs: (urlPath) => Promise<string|null>): Promise<{file, bytes}[]>`, which gives gzip bytes per page.
  - `JS_BUDGET = 80 * 1024`

- [ ] **Step 1: Write the failing tests**

Append to `scripts/verify-dist.test.mjs`:
```js
import { pageChecks, scriptFiles, importsOf, jsWeights, JS_BUDGET } from './verify-dist.mjs';
import { gzipSync } from 'node:zlib';

const page = (body, attrs = 'data-page="page"') =>
  `<html><head><script>document.documentElement.classList.add('js');setTimeout(function(){document.documentElement.classList.add('motion-ready')},3000);</script></head><body ${attrs}><header class="site-header"><a href="/b/services">S</a></header><main>${body}</main><footer class="site-footer"></footer></body></html>`;

describe('pageChecks', () => {
  const opts = { production: false, base: '/b' };
  it('passes a well-formed page', () => {
    expect(pageChecks([{ file: 'a.html', html: page('<h1>A</h1>') }], opts)).toEqual([]);
  });
  it('requires exactly one h1', () => {
    expect(pageChecks([{ file: 'a.html', html: page('<h2>x</h2>') }], opts)[0].problem).toMatch(/h1/);
    expect(pageChecks([{ file: 'a.html', html: page('<h1>a</h1><h1>b</h1>') }], opts)[0].problem).toMatch(/2 h1/);
  });
  it('requires the site header, footer and the services link', () => {
    const html = '<body data-page="page"><h1>x</h1></body>';
    const problems = pageChecks([{ file: 'a.html', html }], opts).map((p) => p.problem).join(' | ');
    expect(problems).toMatch(/site-header/);
    expect(problems).toMatch(/site-footer/);
    expect(problems).toMatch(/services/);
  });
  it('requires the next-project band on case studies', () => {
    expect(pageChecks([{ file: 'p.html', html: page('<h1>P</h1>', 'data-page="project"') }], opts)[0].problem).toMatch(/next-project/);
  });
  it('rejects placeholder markup in a production build only', () => {
    const html = page('<h1>A</h1><span data-placeholder>x</span>');
    expect(pageChecks([{ file: 'a.html', html }], opts)).toEqual([]);
    expect(pageChecks([{ file: 'a.html', html }], { ...opts, production: true })[0].problem).toMatch(/placeholder/);
  });
  it('requires the 3s motion fallback wherever content waits for a reveal', () => {
    const html = page('<h1 data-split>A</h1>').replace(/setTimeout[^<]*/, '');
    expect(pageChecks([{ file: 'a.html', html }], opts)[0].problem).toMatch(/fallback/);
  });
});

describe('JS budget', () => {
  it('finds module script files and their static imports', () => {
    expect(scriptFiles('<script type="module" src="/b/_astro/a.js"></script><script src="/x.js"></script>')).toEqual(['/b/_astro/a.js']);
    expect(importsOf('import{a}from"./c.js";import"./d.js";const x=import("./lazy.js")')).toEqual(['./c.js', './d.js']);
  });
  it('sums gzipped bytes of each page’s scripts and their imports, counting shared chunks once', async () => {
    const files = { '/b/_astro/a.js': 'import"./c.js";' + 'a'.repeat(500), '/b/_astro/c.js': 'c'.repeat(500) };
    const pages = [{ file: 'a.html', html: '<script type="module" src="/b/_astro/a.js"></script>' }];
    const [w] = await jsWeights(pages, async (p) => files[p] ?? null);
    expect(w.bytes).toBe(gzipSync(files['/b/_astro/a.js']).length + gzipSync(files['/b/_astro/c.js']).length);
    expect(JS_BUDGET).toBe(81920);
  });
});
```
Run: `npx vitest run scripts/verify-dist.test.mjs`
Expected: FAIL ("pageChecks is not a function").

- [ ] **Step 2: Implement in `verify-dist.mjs`**

Add `import { gzipSync } from 'node:zlib';` and `import { posix } from 'node:path';` at the top. Then add these exports:
```js
export const JS_BUDGET = 80 * 1024;

/** Structural rules every built page must meet (spec §1 success criteria, plan Review Focus). */
export function pageChecks(pages, { production, base }) {
  const out = [];
  const b = base.replace(/\/$/, '');
  for (const { file, html } of pages) {
    const add = (problem) => out.push({ file, problem });
    const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
    if (h1s !== 1) add(`${h1s} h1 elements (expected exactly 1)`);
    if (!html.includes('class="site-header')) add('missing .site-header');
    if (!html.includes('class="site-footer')) add('missing .site-footer');
    if (!html.includes(`href="${b}/services"`)) add('no link to /services');
    if (html.includes('data-page="project"') && !html.includes('class="next-project"')) add('case study without .next-project band');
    if (production && html.includes('data-placeholder')) add('placeholder copy in a production build');
    if (/data-(split|reveal)/.test(html) && !html.includes('motion-ready')) add('reveal hooks without the 3s motion fallback script');
  }
  return out;
}

/** Module script URLs a page loads. */
export function scriptFiles(html) {
  return [...html.matchAll(/<script\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /\btype="module"/.test(tag))
    .map((tag) => tag.match(/\bsrc="([^"]+)"/)?.[1])
    .filter(Boolean);
}

/** Static imports in a bundled module (dynamic import() is loaded on demand and not counted). */
export function importsOf(js) {
  return [...js.matchAll(/(?:\bfrom\s*|\bimport\s*)["']([^"']+\.js)["']/g)].map((m) => m[1]);
}

/** Gzipped JS bytes per page: inline module scripts + every script file and its static imports. */
export async function jsWeights(pages, readJs) {
  const cache = new Map();
  const size = async (p) => {
    if (!cache.has(p)) {
      const js = await readJs(p);
      cache.set(p, js === null ? { bytes: 0, deps: [] } : { bytes: gzipSync(js).length, deps: importsOf(js).map((d) => posix.join(posix.dirname(p), d)) });
    }
    return cache.get(p);
  };
  const out = [];
  for (const { file, html } of pages) {
    const seen = new Set();
    const queue = scriptFiles(html);
    let bytes = [...html.matchAll(/<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/g)]
      .filter((m) => !/\bsrc=/.test(m[0]) && m[1].trim())
      .reduce((n, m) => n + gzipSync(m[1]).length, 0);
    while (queue.length) {
      const p = queue.shift();
      if (seen.has(p)) continue;
      seen.add(p);
      const s = await size(p);
      bytes += s.bytes;
      queue.push(...s.deps);
    }
    out.push({ file, bytes });
  }
  return out;
}
```
In the CLI block, after the `broken` computation:
```js
  const production = process.env.SITE_ENV === 'production';
  const checks = pageChecks(pages, { production, base });
  const readJs = async (url) => {
    const rel = url.startsWith(base + '/') ? url.slice(base.length + 1) : url.replace(/^\//, '');
    try { return await readFile(join('dist', rel), 'utf8'); } catch { return null; }
  };
  const heavy = (await jsWeights(pages, readJs)).filter((w) => w.bytes > JS_BUDGET);
  checks.forEach((c) => console.error(`PAGE     ${c.file}: ${c.problem}`));
  heavy.forEach((w) => console.error(`JS       ${w.file}: ${(w.bytes / 1024).toFixed(1)} KB gzip > ${JS_BUDGET / 1024} KB`));
```
Add `|| checks.length || heavy.length` to the `process.exit(...)` condition.

- [ ] **Step 3: Run the unit tests, then verify against `dist`**

Run: `npx vitest run scripts/verify-dist.test.mjs`
Expected: PASS.
Run: `npm run build && npm run verify`
Expected: PASS, with no `PAGE` or `JS` lines. If a `PAGE` line appears, the template it names breaks a rule: fix that template, not the check.

- [ ] **Step 4: Write the overflow check (Review Focus 4)**

`scripts/check-overflow.mjs`:
```js
// Every built page at 320 and 375 CSS px wide must not scroll sideways (spec §1, plan Review
// Focus 4). Serves dist/ with `astro preview`, loads each page in Chromium, compares widths.
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.SITE_ENV === 'production' ? '' : '/achates360-website';
const PORT = 4329;
const pages = (await readdir('dist')).filter((f) => f.endsWith('.html') && f !== '404.html');
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res) => server.stdout.on('data', (d) => String(d).includes(String(PORT)) && res()));

const browser = await chromium.launch();
const failures = [];
try {
  for (const width of [320, 375]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    const tab = await ctx.newPage();
    for (const f of pages) {
      const path = f === 'index.html' ? '/' : `/${f.replace(/\.html$/, '')}`;
      await tab.goto(`http://localhost:${PORT}${BASE}${path}`, { waitUntil: 'load' });
      const { scroll, inner } = await tab.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
      if (scroll > inner) failures.push(`${width}px ${path}: page is ${scroll}px wide`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
failures.forEach((f) => console.error(`OVERFLOW ${f}`));
console.log(`overflow: ${pages.length} pages × 2 widths, ${failures.length} problem(s)`);
process.exit(failures.length ? 1 : 0);
```
In `package.json` scripts, add `"check:overflow": "node scripts/check-overflow.mjs"`.

Run: `npm run check:overflow`
Expected: "overflow: 69 pages × 2 widths, 0 problem(s)". If any page overflows, fix its CSS: wrap long words with `overflow-wrap: anywhere` and give grid children `min-width: 0`. Then re-run.

- [ ] **Step 5: Commit**

```bash
git add scripts package.json
git commit -m "verify: page structure, production placeholders, motion fallback, JS budget; overflow check at 320/375

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Motion layer

**Files:**
- Create:
  - `src/scripts/motion/{index,reveal,hero,stack,counters,timeline,tilt,manifest}.ts`
  - `src/scripts/motion/motion.test.ts`
- Modify:
  - `src/styles/base.css` (hidden-until-revealed rule)
  - page scripts in `src/pages/{index,projects,services}.astro`
  - layout scripts in `src/layouts/{Project,Categories,About,JoinUs,Page}.astro`
- Card pages get no motion.

**Interfaces:**
- Consumes: hooks set in Tasks 4–9:
  - `[data-split]`, `[data-reveal]`, `[data-hero]`, `[data-hero-title]`, `[data-hero-sticker]`
  - `[data-stack] > .stack-card`, `[data-count]`, `[data-timeline] .tl-track`, `[data-tilt]`
- Produces:
  - `run(...mods: Array<() => void>): void`
  - `type MotionModule = 'reveal'|'hero'|'stack'|'counters'|'timeline'|'tilt'`
  - `MOTION: Record<PageKind, MotionModule[]>`
  - `SOURCES: Record<PageKind, string>`

- [ ] **Step 1: Write the failing manifest test**

`src/scripts/motion/manifest.ts`:
```ts
import type { PageKind } from '../../lib/page-kind';
export type MotionModule = 'reveal' | 'hero' | 'stack' | 'counters' | 'timeline' | 'tilt';

/** Which motion modules each page kind loads (spec §5: case studies only get the light reveals). */
export const MOTION: Record<PageKind, MotionModule[]> = {
  home: ['reveal', 'hero', 'stack', 'counters', 'tilt'],
  project: ['reveal'],
  projects: ['reveal', 'tilt'],
  categories: ['reveal', 'tilt'],
  services: ['reveal', 'tilt'],
  about: ['reveal', 'timeline', 'counters'],
  joinus: ['reveal'],
  page: ['reveal'],
  card: [],
};

/** The template that builds each page kind (where its motion <script> lives). */
export const SOURCES: Record<PageKind, string> = {
  home: 'src/pages/index.astro',
  project: 'src/layouts/Project.astro',
  projects: 'src/pages/projects.astro',
  categories: 'src/layouts/Categories.astro',
  services: 'src/pages/services.astro',
  about: 'src/layouts/About.astro',
  joinus: 'src/layouts/JoinUs.astro',
  page: 'src/layouts/Page.astro',
  card: 'src/layouts/Card.astro',
};
```
`src/scripts/motion/motion.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MOTION, SOURCES } from './manifest';

const imported = (src: string) =>
  [...src.matchAll(/from ['"](?:\.\.\/)+scripts\/motion\/(\w+)['"]/g)].map((m) => m[1]).filter((m) => m !== 'index').sort();

describe('motion manifest', () => {
  for (const [kind, file] of Object.entries(SOURCES)) {
    it(`${kind} (${file}) imports exactly its manifest modules`, () => {
      const src = readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8');
      expect(imported(src)).toEqual([...MOTION[kind as keyof typeof MOTION]].sort());
    });
  }
  it('case studies never ship the heavy modules', () => {
    expect(MOTION.project).not.toContain('stack');
    expect(MOTION.project).not.toContain('timeline');
  });
});
```
Run: `npx vitest run src/scripts/motion`
Expected: FAIL. Every kind except `card` imports nothing yet.

- [ ] **Step 2: Write the modules**

`src/scripts/motion/index.ts`:
```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
export { gsap, ScrollTrigger, SplitText };

/**
 * Start a page's motion modules (spec §5). Under reduced motion none run and content simply shows.
 * A failing module is logged and skipped so the rest of the page still animates and reveals.
 * motion-ready lifts the CSS that hides [data-split]/[data-reveal] before their from-states apply.
 */
export function run(...mods: Array<() => void>): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    for (const m of mods) {
      try { m(); } catch (e) { console.error('[motion]', e); }
    }
  }
  document.documentElement.classList.add('motion-ready');
}
```

`src/scripts/motion/reveal.ts`:
```ts
import { gsap, SplitText } from './index';

/** Section headings rise letter by letter; blocks fade up, as each enters the screen. */
export function reveal(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-split]')) {
    if (el.closest('[data-hero]')) continue;
    const split = SplitText.create(el, { type: 'words,chars', mask: 'words' });
    gsap.from(split.chars, {
      yPercent: 110, duration: .8, ease: 'expo.out', stagger: .018,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  }
}
```

`src/scripts/motion/hero.ts`:
```ts
import { gsap, SplitText } from './index';

/** Homepage hero on load: the wordmark builds in, the media settles, the sticker drops. */
export function hero(): void {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  if (!root) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const media = root.querySelector('.hero-media');
  if (media) tl.from(media, { opacity: 0, scale: 1.06, duration: 1.4 }, 0);
  const title = root.querySelector<HTMLElement>('[data-hero-title]');
  if (title) {
    const s = SplitText.create(title, { type: 'chars', mask: 'chars' });
    tl.from(s.chars, { yPercent: 100, duration: 1.1, stagger: .035 }, .1);
  }
  const sticker = root.querySelector('[data-hero-sticker]');
  if (sticker) tl.from(sticker, { y: -60, rotate: -25, opacity: 0, duration: .8, ease: 'back.out(2)' }, '-=.6');
}
```

`src/scripts/motion/stack.ts`:
```ts
import { gsap } from './index';

/** Featured cards: each one shrinks back and dims as the next slides over it. */
export function stack(): void {
  const cards = gsap.utils.toArray<HTMLElement>('[data-stack] > .stack-card');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: .92, filter: 'brightness(.55)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top+=120', scrub: true },
    });
  });
}
```

`src/scripts/motion/counters.ts`:
```ts
import { gsap } from './index';

/** Stat numbers count up from 0 when they come into view; the HTML already holds the final value. */
export function counters(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-count]')) {
    const end = Number(el.dataset.count);
    if (!Number.isFinite(end)) continue;
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.6, ease: 'power2.out',
      onStart: () => { el.textContent = '0'; },
      onUpdate: () => { el.textContent = String(Math.round(o.v)); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  }
}
```

`src/scripts/motion/timeline.ts`:
```ts
import { gsap } from './index';

/** About timeline: on desktop the section pins and its years travel sideways (spec §4.5). */
export function timeline(): void {
  const section = document.querySelector<HTMLElement>('[data-timeline]');
  const track = section?.querySelector<HTMLElement>('.tl-track');
  if (!section || !track) return;
  gsap.matchMedia().add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-pinned');
    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
    gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
    });
    return () => section.classList.remove('is-pinned');
  });
}
```

`src/scripts/motion/tilt.ts`:
```ts
import { gsap } from './index';

/** Cards lean toward the pointer (hover-capable pointers only). */
export function tilt(): void {
  if (!window.matchMedia('(hover: hover)').matches) return;
  for (const el of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: .4, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: .4, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 8);
      rx(-((e.clientY - r.top) / r.height - .5) * 8);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
}
```

- [ ] **Step 3: Hide reveal targets until motion is ready**

Append to `src/styles/base.css`:
```css
/* Hidden until motion takes over: only with JS on, motion allowed, and before motion-ready (set by
   run(), or by Base's 3s fallback if the bundle never arrives). */
@media (prefers-reduced-motion: no-preference) {
  .js:not(.motion-ready) :is([data-split], [data-reveal], [data-hero-title], [data-hero-sticker]) { opacity: 0; }
}
```

- [ ] **Step 4: Wire each template**

Add one `<script>` block at the end of each template below, importing exactly its manifest modules.

`src/pages/index.astro`:
```astro
<script>
  import { run } from '../scripts/motion/index';
  import { reveal } from '../scripts/motion/reveal';
  import { hero } from '../scripts/motion/hero';
  import { stack } from '../scripts/motion/stack';
  import { counters } from '../scripts/motion/counters';
  import { tilt } from '../scripts/motion/tilt';
  run(hero, reveal, stack, counters, tilt);
</script>
```

`src/layouts/Project.astro`, `src/layouts/JoinUs.astro` and `src/layouts/Page.astro`:
```astro
<script>
  import { run } from '../scripts/motion/index';
  import { reveal } from '../scripts/motion/reveal';
  run(reveal);
</script>
```

`src/pages/projects.astro`, `src/pages/services.astro` and `src/layouts/Categories.astro`. Add these lines inside the existing `<script>` in `projects.astro`, or as a new block elsewhere:
```astro
<script>
  import { run } from '../scripts/motion/index';
  import { reveal } from '../scripts/motion/reveal';
  import { tilt } from '../scripts/motion/tilt';
  run(reveal, tilt);
</script>
```

`src/layouts/About.astro`:
```astro
<script>
  import { run } from '../scripts/motion/index';
  import { reveal } from '../scripts/motion/reveal';
  import { timeline } from '../scripts/motion/timeline';
  import { counters } from '../scripts/motion/counters';
  run(reveal, timeline, counters);
</script>
```
**Note:** `Card.astro` and `Page.astro`/`JoinUs.astro` aren't under `src/pages`, but the relative paths above (`../scripts/...`) resolve from `src/layouts` too. `Card.astro` gets no script.

- [ ] **Step 5: Run the tests, build, verify and check the budget**

Run: `npm test && npm run build && npm run verify && npm run check:overflow`
Expected: all PASS, including the motion manifest test (9 kinds), with no `JS` budget line. Find the heaviest page:
```bash
node -e "import('./scripts/verify-dist.mjs').then(async m=>{const fs=await import('node:fs/promises');const b='/achates360-website';const f=(await fs.readdir('dist')).filter(x=>x.endsWith('.html'));const pages=await Promise.all(f.map(async x=>({file:x,html:await fs.readFile('dist/'+x,'utf8')})));const w=await m.jsWeights(pages,async u=>{try{return await fs.readFile('dist/'+u.slice(b.length+1),'utf8')}catch{return null}});console.log(w.sort((a,c)=>c.bytes-a.bytes).slice(0,3))})"
```
Expected: the largest is `index.html`, under 81920 bytes.

- [ ] **Step 6: Manual motion QA, including Review Focus 1**

`npm run preview`, then in Chrome at 1440:
- **`/`:** the wordmark builds in, cards stack and dim, numbers count, headings rise, and tiles tilt.
- **`/about`:** the timeline pins and scrolls sideways.
- **`/notter`:** only reveals.
- **Reduced motion:** DevTools → Rendering → "prefers-reduced-motion: reduce", then reload `/` and `/about`. Everything is visible immediately, nothing pins, marquees stand still and videos don't autoplay. The hero pause button shows "Play".
- **JS failure:** DevTools → Network → block request pattern `*/_astro/*.js`, then reload `/`. Within 3s all headings and cards are visible.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "Motion layer: reveals, hero build-in, stacking cards, counters, pinned timeline, tilt

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: QA, content queries, README

**Files:**
- Modify: `CONTENT-QUERIES.md`, `README.md`
- Fix whatever QA finds in the files it names.

- [ ] **Step 1: Run the QA agents**

Dispatch `render-qa` on `npm run preview` (http://localhost:4321/achates360-website):
- pages: `/`, `/notter` (image hero), `/dxv` (video hero), `/projects`, `/copy-of-projects`, `/services`, `/about`, `/joinus`, `/angeline`
- widths: 375, 768, 1024, 1440, 1920
- plus a reduced-motion pass and a JS-disabled pass

Dispatch `perf-auditor` for Lighthouse mobile on `/` and `/notter`. The target is performance ≥ 90.
Fix every Critical and High finding. Re-run only the affected checks.

- [ ] **Step 2: Check contrast for every token pairing in use**

Compute these ratios, for example with `npx wcag-contrast` or by hand using WCAG relative luminance. Each pair must reach at least the minimum listed.

| Text | Background | Minimum |
|---|---|---|
| ink | paper | 4.5 |
| ink | peach | 4.5 |
| ink | accent | 4.5 |
| peach | charcoal | 4.5 |
| `#e9e4e1` | black | 4.5 |
| accent (stat numbers, large) | black | 3 |
| muted (large) | paper | 3 |
| `#5d5654` (subtitles) | paper | 4.5 |
| accent (stat numbers) | paper | 3 |

Record the table in `README.md` under "Design tokens".

- [ ] **Step 3: Inline looping videos longer than 5 seconds**

```bash
grep -l "type: video" src/content/projects/*.md
```
For each `video` block without `controls`, check its duration:
```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 public/media/video/<file>.mp4
```
If it runs longer than 5s, pass `pauseLabel`/`playLabel` in `Block.astro`'s `BgVideo` call for that case. The simplest fix is to always pass them: change the line to
`<BgVideo src={b.src} poster={b.poster} class="block-video" pauseLabel={text('video-pause').text} playLabel={text('video-play').text} />`
and add `const { text } = await loadExtras();` to `Block.astro`'s frontmatter.

- [ ] **Step 4: Add the "Redesign" section to `CONTENT-QUERIES.md`**

Append the following, written for the Art Director and MD:
```markdown
## Redesign (stage 2) — decisions and copy needed before launch

The redesigned site is on staging with every new piece of text marked **DRAFT**. Nothing marked
DRAFT can go live: the production build refuses to run until each item below is approved or
replaced. Existing copy from the Wix site is unchanged.

**Design decisions to approve**
1. Accent colour signal orange-red `#ff4b1f`, with charcoal `#2f2e2e` and peach `#ebd2c5` used as large colour blocks.
2. Fonts: Bebas Neue (headings) and DM Sans (text) replace Helvetica Light and Avenir Light. Both are free for commercial use, which closes the Avenir web-licence question.
3. New page `/services` and a SERVICES item in the menu after PROJECTS.
4. The wordmark "// ACHATES 360" set in type in the header, homepage hero and footer.

**Copy to supply** (file: `src/content/extras/`; each is a one-line change once decided)
5. Services: four titles, descriptions and tag lists (`services.yaml`). Tags currently reuse the site's own category names.
6. Process: four step names and descriptions (`process.yaml`).
7. Timeline on About: one sentence for each of eight milestones (`timeline.yaml`). The years and project names come from the existing case studies.
8. Stats: confirm "Founded 2001" and "Featured projects" (counted from the site), and supply two more figures or remove them (`stats.yaml`).
9. Clients: confirm each of the 12 names may be listed (`clients.yaml`), and supply logo files cleared for web use if logos are wanted.
10. Testimonials: up to three real quotes with the client's written permission, name and role (`testimonials.yaml`). Until then they read "Client name".
11. Interface text (`strings.yaml`): hero line "Design is thinking made visual", sticker "Since 2001", section labels (Selected work, Inside the studio, What we do, Trusted by, Client feedback, In numbers, Our story, How we work), buttons (Learn more, All services, Get in touch), "Let's connect and let's work together", "Next project", meta labels (Client, Year, Services, Recognition), "We're hiring", the Services page title and description, and the screen-reader labels (Menu, Back to site, Site, Sections, Pause video, Play video).
```

- [ ] **Step 5: Update `README.md`**

Replace the sections that describe clone layout and geometry with a "Redesign" section covering:
- the design tokens, plus the contrast table from Step 2
- where new copy lives (`src/content/extras/`) and the placeholder rule
- the production guard (`SITE_ENV=production npm run build` fails while placeholders remain)
- the motion manifest (`src/scripts/motion/manifest.ts`)
- `npm run check:overflow`

Keep the exporter and verify sections.

- [ ] **Step 6: Final verification**

Run:
```bash
npm test && npm run build && npm run verify && npm run check:overflow
SITE_ENV=production npx astro build; echo "exit $?"
```
Expected:
- The first line passes: 69/69 pages, with no PAGE, JS or OVERFLOW lines.
- The production build exits non-zero with "Production build blocked: N placeholder item(s)…", which proves unapproved copy can't ship.

Then restore the staging build: `npm run build`.

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "Redesign QA fixes, content queries for the Art Director/MD, README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin redesign
```
Open a PR `redesign` → `main` titled "Redesign: Ariyana-inspired site (stage 2)". The body should summarise the spec and link `CONTENT-QUERIES.md#redesign`, ending with:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
Don't merge. Merging is the user's "publish".
