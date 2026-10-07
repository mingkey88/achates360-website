# Achates 360 — Website Redesign (Design Spec)

Stage 2 of the Achates 360 site project. Stage 1 (the 1:1 Astro clone of the Wix site,
`2026-10-06-achates360-astro-clone-design.md`) is merged and live on staging. Stage 3 (moving
www.achates360.com off Wix) is not part of this spec.

Reference for the look and feel: https://ariyana-studio.webflow.io/ (a Webflow template).

## 1. Intent

### What the user said

- "now that u have roughly the clone do a modern redesign to something like this" with the Ariyana link.
- Content: **re-skin plus new Ariyana-style sections, with clearly marked placeholder copy** that the
  Art Director and MD replace before launch.
- Palette: **Achates' own palette, pushed bold.** Charcoal and peach become big flat blocks, with one
  hot accent.
- Accent: **signal orange-red `#ff4b1f`** (chosen from three options shown side by side).
- Motion: **full Ariyana treatment** (GSAP + ScrollTrigger), with a still version for reduced-motion.
- Type: **Bebas Neue (display) + DM Sans (text).**
- Structure: **homepage plus new pages.** That means a new `/services` page and an expanded `/about`.
- Homepage order: **work first** (option B, shown as a wireframe).
- Case studies: **immersive** layout (option A, shown with the real Notter page).
- Build approach: **restyle in place on a `redesign` branch.**
- Approved in chat: the page templates, the motion system, the content model and the build/test/publish
  plan.

### Assumptions (correct if wrong)

- "Something like this" means Ariyana's *feel* (type, colour blocking, motion, stickers, pills). It does
  not mean copying its layout pixel for pixel or using its brand.
- Achates 360's copy is owned by the Art Director and MD, and discrepancies are logged in
  `CONTENT-QUERIES.md`. Existing copy is reproduced verbatim, and all
  new copy is placeholder until they approve it.
- Staging keeps showing the clone until the user says "publish". Then Claude merges `redesign` into
  `main` (the user's standing preference).

### Success criteria

1. Every page type is rebuilt in the new design system:
   - home
   - case study (57 pages)
   - `/projects`
   - `/copy-of-projects`
   - `/about`
   - `/joinus`
   - business cards (6)
   - the new `/services`
2. All 68 permanent URLs still resolve. `/services` is added, for 69 in total.
3. No existing copy is altered. Every new piece of copy is flagged `placeholder: true` and listed in
   `CONTENT-QUERIES.md`.
4. A production build refuses to complete while any placeholder remains.
5. Hero videos stay video.
6. All content is readable and clickable with JavaScript off and with reduce-motion switched on.
7. No horizontal page scroll from 320 to 2560px.
8. No more than 80 KB of JavaScript (gzipped) on any page.
9. Lighthouse mobile performance of 90 or more on the homepage.
10. WCAG 2.2 AA colour contrast.
11. All existing tests pass, new tests cover the new logic, and `npm run verify` passes.

## 2. Scope

### In scope

- A new design system covering:
  - tokens
  - type scale
  - components
  - header, menu and footer
- New templates for every page type listed above.
- New `/services` page; `/about` expanded with new sections.
- New content files for the Ariyana-style sections, with placeholder flags.
- The GSAP motion layer with reduced-motion and no-JS fallbacks.
- Verification extensions, QA passes and the `CONTENT-QUERIES.md` "Redesign" section.

### Out of scope

- Writing final marketing copy. That belongs to the Art Director and MD.
- Client logo artwork (names only until logos are supplied and cleared).
- A dedicated `/contact` or `/team` page (offered, not chosen).
- Page-to-page transitions (Astro view transitions).
- Smooth-scroll libraries (Lenis etc.).
- DNS cutover and production hosting (stage 3).
- Re-running the Wix export. The clone stays a snapshot of 6 Oct 2026.

## 3. Design system

### 3.1 Colour

| Token | Value | Role |
|---|---|---|
| `--ink` | `#151414` | Primary text on light grounds; text on the accent |
| `--charcoal` | `#2f2e2e` | Dark blocks (stats band, About intro, Next-project band); existing brand colour |
| `--peach` | `#ebd2c5` | Warm blocks (services strip, business cards); text on charcoal; existing brand colour |
| `--paper` | `#f6f1ee` | Default page ground |
| `--white` | `#ffffff` | Cards and chips on paper or peach |
| `--black` | `#0d0d0d` | Footer and logo-wall grid section |
| `--accent` | `#ff4b1f` | Stickers, filled CTAs, stat numbers, marquee highlight |
| `--muted` | `#8f8888` | Secondary text and the second line of two-tone headings |

Contrast rules:

- Text on `--accent` is always `--ink` (#151414 on #ff4b1f is about 5.4:1).
- `--accent` is never used for body text on paper.
- `--muted` is only used at display sizes of 24px or more (about 3.1:1 on paper, which passes for large text).
- The focus ring is a 2px `--ink` outline on light grounds and `--peach` on dark ones. The accent is only about
  3:1 against paper, too close to the minimum for a focus indicator.

### 3.2 Type

- **Display:** Bebas Neue 400, from `@fontsource/bebas-neue`. Used for headings, stickers, pills, stat
  numbers and wordmarks. Bebas is caps-only by design: headings render in capitals through the font, and
  the copy in the content files is not changed.
- **Text:** DM Sans 300/400/500 (+ 400 italic), from `@fontsource/dm-sans`. Used for body text, the meta
  strip, chips, nav and form fields.
- Both fonts are SIL OFL and self-hosted.
- `@fontsource/nunito-sans` and the Helvetica stand-in are removed. This also closes the open Avenir
  licence question.
- Fluid scale with `clamp()`:

  | Step | Range | Use |
  |---|---|---|
  | `--fs-mega` | 18vw → 22vw | hero / footer wordmark |
  | `--fs-h1` | 64 → 160px | |
  | `--fs-h2` | 44 → 96px | |
  | `--fs-h3` | 28 → 48px | |
  | `--fs-lead` | 18 → 26px | |
  | `--fs-body` | 16 → 18px | |
  | `--fs-small` | 12 → 14px | |
  | `--fs-label` | 11px | uppercase, +0.1em tracking |

- Display line-height is 0.88; body line-height is 1.55.

### 3.3 Space, radius, layout

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192.
- Section padding: `clamp(64px, 10vw, 160px)` vertical.
- Page gutter: `clamp(16px, 4vw, 60px)`.
- Max content width: 1440px. Full-bleed sections escape it.
- Radii:
  - `--r-card: 16px` (cards, media)
  - `--r-block: 32px` (large rounded sections, e.g. process)
  - `--r-pill: 999px`
- Breakpoints: 480 / 768 / 1024 / 1440 (mobile-first).

### 3.4 Components (`src/components/ui/`)

| Component | What it is |
|---|---|
| `Pill` | Outline or filled rounded button with a leading dash. The dash stretches on hover. Renders as an `<a>` or `<button>`. |
| `Sticker` | Small Bebas label on `--accent`, rotated -5° (or +4° alternating). |
| `Chip` | Uppercase DM Sans tag on white, rounded. |
| `Eyebrow` | Dot plus small label ("Inside *(the)* studio"). |
| `SplitHeading` | `h1`–`h3` whose letters are split for reveal. The plain text stays in the DOM for screen readers and no-JS. |
| `TwoToneHeading` | A heading whose second part renders in `--muted` (Ariyana's grey continuation). Which words are muted is set in the template, not by editing copy. |
| `MediaCard` | Rounded image or video card. Video tiles play a muted preview on hover (desktop) and show a play/pause button. |
| `Marquee` | CSS-only infinite loop of children. Pauses on hover and stops under reduced-motion. |
| `StatCounter` | A number that counts up on entering the screen. It renders the final value in the HTML. |
| `MetaStrip` | Label/value columns (Client, Year, Services, Recognition). |
| `DraftTag` | Dashed "DRAFT" corner tag. Rendered on staging for any `placeholder: true` item; never rendered in production. |

### 3.5 Header, menu, footer

- **Header:** slim bar.
  - Left: the "// ACHATES 360" wordmark. It is set in Bebas as text and links to `/`. The existing logo
    image stays available for `og`/favicon use.
  - Right: the top-level menu from `site.md`.
  - Behaviour: transparent over a hero, solid `--paper` after scrolling 80px, hides as you scroll down
    and reappears as you scroll up.
- **Menu labels and order** come from `site.md`, verbatim: HOME, PROJECTS, CONTACT, ABOUT, JOIN US.
  **SERVICES** is inserted after PROJECTS at render time (`site.md` is not edited) and logged as a query.
- **Full-screen menu** (the menu icon on mobile, and the "all projects" path on desktop):
  - A charcoal overlay with menu items in giant Bebas.
  - The PROJECTS sub-list (the existing `items`) appears in two columns.
  - Social links sit at the bottom.
  - It keeps the clone's `<dialog>` keyboard and focus behaviour.
- **Footer** (`--black`):
  - The existing footer copy from `site.md`, verbatim: the "Get in touch…" line, the contact block and
    the copyright lines.
  - The social icons, restyled as text links.
  - Then the giant "ACHATES 360" wordmark with a white-to-transparent gradient.

## 4. Page templates

### 4.1 Homepage (`src/pages/index.astro`) — work first

1. **Hero**
   - Full-bleed slide-1 video (DXV). As in the clone, the video loads at 768px and wider; phones show its
     poster still (saves mobile data). Looping videos get a pause button (WCAG 2.2.2).
   - A dark gradient sits over it so the text reads.
   - `--fs-mega` "ACHATES 360".
   - A "SINCE 2001" sticker (placeholder: its wording needs approval).
   - A placeholder tagline line.
2. **Featured work**
   - The six existing `slides`, in order, as pinned stacking cards.
   - Each card shows: media (video or image), the project title (from the linked project's `title`), the
     client, a sticker for the first category, the badges, and the existing "VIEW PROJECT" pill.
3. **Intro**
   - Eyebrow, plus a two-tone heading set from the About sentence "The name Achates 360 reflects our
     company philosophy of being a faithful companion and trusted friend to our clients." (verbatim).
   - A pill to `/about` (label placeholder: "Learn more").
   - A decorative "360" mark.
4. **Services preview**
   - A peach block with the four `services` entries as rows (title and chips).
   - A pill to `/services`.
5. **Stats + clients**
   - A black grid section: `stats` counters, a `clients` name wall as a marquee, and one `testimonials`
     pull-quote.
6. **All projects**
   - The existing `allProjects` grid (about 50 tiles) as `MediaCard`s.
   - Hover video preview where a tile has `video`.
7. **Testimonials**
   - Tilted cards from `testimonials`.
8. **Let's connect**
   - Two counter-scrolling marquee lines: solid and outlined, with the line text a placeholder.
   - Followed by the existing enquiry form ("Sales Lead", with its fields and labels verbatim) restyled on
     an `--accent` block.
   - The form keeps `id="contact"` so `/#contact` still works.
   - The form still posts to `PUBLIC_FORM_ENDPOINT` (unset on staging, as now).
9. **Footer.**

### 4.2 Case study (`src/layouts/Project.astro`, 57 pages) — immersive

1. **Hero**
   - The project `hero` (video or image), full-bleed, 85vh (60vh on phones).
   - The title is set in `--fs-h1` over the bottom of the hero.
   - A sticker shows the first category.
   - If there is no hero, the title block sits on `--charcoal`.
2. **Meta strip:** Client (`client`), Year (`copyright` verbatim), Services (`categories` as chips),
   Recognition (`badges`, with their links). Empty columns are omitted.
3. **Body:** the `blocks` in their existing order.
   - The first text block renders as `--fs-lead`; later ones as body text.
   - Images are grouped into rows using the existing `rows.ts` side-by-side grouping. Each row renders as
     a 1-, 2- or 3-up grid; rows wider than 3 wrap.
   - `gallery` becomes a grid of `MediaCard`s (the clone has no lightbox, and none is added).
   - `video` → `MediaCard` with controls.
   - `embed` → a 16:9 rounded frame (Vimeo/YouTube, lazy-loaded iframe as now).
   - `link` → `Pill`.
4. **Back link:** the existing `backLink` label (verbatim), as a `Pill` above the next band.
5. **Next project band:**
   - `--charcoal`, with "NEXT PROJECT" (placeholder label) plus the next project's title, linking to it.
   - "Next" follows the homepage `allProjects` order. The last project wraps to the first.
   - Unlisted projects use the same order. If a project isn't in `allProjects`, the band links to
     `/projects`.

`heroCaption` (the screen-reader-only copyright) and `pageBackground` are kept as data. `pageBackground` is
ignored by the new design.

### 4.3 `/projects` and `/copy-of-projects`

- The existing category sections and anchors are kept.
- The anchor `menu` becomes a sticky row of chips, which scroll to their section. The active chip
  follows the scroll position.
- Each section has a Bebas section title (the existing heading text) and a `MediaCard` grid.
- Titles and descriptions are shown verbatim, including the 🏆 markers.

### 4.4 `/services` (new)

All copy is placeholder. Media is reused from real projects.

1. Giant "SERVICES" heading with a sticker.
2. Four service rows: Bebas title with letter reveal, chips, and a `MediaCard` (looping video or image)
   with a pause button.
3. Process: a `--r-block` grey rounded section with 4 step cards on a dotted connector line. Each card
   expands its description.
4. Reel: "PLAY" and "REEL" flank a centred video card. The video is the existing hero reel.
5. Let's connect band (as on the homepage, without the form), with a pill to `/#contact`.

### 4.5 `/about` (expanded)

1. **Intro** (existing content, verbatim): the About text blocks and images on `--charcoal` with
   `--peach` text, as today, in the new type.
2. **Stats strip** from `stats`.
3. **Timeline** from `timeline`:
   - Desktop: pinned, scrolling sideways.
   - Phones and reduced-motion: a native snap scroller.
   - Each item has a giant year, a sticker label, text and an image.
4. **Clients** wall from `clients`.
5. **Testimonials** from `testimonials`.
6. Let's connect band.

### 4.6 `/joinus`

- The existing content, verbatim.
- Each role (an image plus a text block on Wix) becomes an accordion card: a Bebas role title (from the
  first heading in its text) and a sticker, which expands to the full text.
- Uses native `<details>`, so it works without JS.

### 4.7 Business cards (6 permanent URLs)

- Same data and links as now, restyled as one phone-first `--peach` card:
  - photo
  - name in `--fs-h2`
  - role and blurb
  - phone, email and vCard as `Pill`s
  - the other `links`
  - the QR code
- On desktop, the card centres on `--charcoal`.

## 5. Motion

- **Engine:** `gsap` (with ScrollTrigger and SplitText) from npm, bundled by Astro. Scrolling stays
  native; there is no scroll hijacking.
- **Code layout:** `src/scripts/motion/`, one module per effect:
  - `reveal.ts` (split-letter headings and fade-up blocks)
  - `hero.ts`
  - `stack.ts` (featured-work stacking)
  - `timeline.ts` (sideways pinned timeline)
  - `counters.ts`
  - `header.ts` (hide/show and solid state)
  - `hover.ts` (card tilt, video preview)
- **Loading:** each page imports only the modules it uses. A small `motion/index.ts` registers plugins
  once.
- **Marquees** are CSS keyframes (no JS).
- **Reduced motion:** a `prefers-reduced-motion: reduce` check runs before any module starts.
  - When it is on: reveals are skipped and content shows immediately; pinned sections render as normal
    stacked or snap-scroll layouts; counters show final values; marquees stop.
  - Hero video autoplay is off; the poster shows with a play button.
- **No JS:** the HTML is fully composed. Hidden-until-revealed styles are applied only when a `js` class
  is set on `<html>`, so nothing stays invisible if scripts fail.
- **Touch:** hover-only effects are disabled under `(hover: none)`. The sideways timeline becomes a snap
  scroller below 1024px. Stacking cards stay.

## 6. Content model

### 6.1 Existing collections — unchanged

`projects`, `cards`, `basic`, `home`, `projectsIndex` and `site` keep their schemas and files. The
`box`/`mbox` fields stay. Layout code reads them only through `rows.ts`, for side-by-side grouping.
Nothing in `src/content/` that came from the export is edited.

### 6.2 New collections (`src/content/extras/*.yaml`, one `file()`-loader collection per file, strict schemas)

New sections reference real media by **project slug**: they use that project's hero, rather than copying
image paths. A timeline entry also takes its year (the first year in the project's `copyright`) and its
label (the project's `title`) from that project. As a result, no year or milestone is invented.

| File | Entry fields |
|---|---|
| `services.yaml` | `id`, `order`, `title`, `body`, `tags: string[]` (existing project category names, verbatim), `project` (slug whose hero is the media), `placeholder` |
| `process.yaml` | `id`, `step`, `title`, `body`, `placeholder` |
| `timeline.yaml` | `id`, `order`, `project` (slug: gives year, label and image), `body`, `placeholder` |
| `stats.yaml` | `id`, `order`, `value` (a number, or `listed-projects` = count of listed projects at build), `suffix?`, `label`, `placeholder` |
| `clients.yaml` | `id`, `name` (verbatim from a project's `client` field), `placeholder` |
| `testimonials.yaml` | `id`, `quote`, `name`, `role`, `placeholder` |
| `strings.yaml` | `id`, `text`, `placeholder` — every new UI string (hero tagline, sticker labels, "Learn more", "NEXT PROJECT", marquee line, section eyebrows) |

`placeholder` is required. It is not defaulted, so every entry states its status explicitly.

### 6.3 Placeholder rules

- **Testimonials:** never a real person's name or a real client's name attached to an invented quote.
  Placeholders read "Client name" / "Role, Company" with generic text.
- **Clients:** names come only from client names already published on the site's project pages
  (`client` fields). `logo` stays empty until real files are supplied and cleared.
- **Service tags:** seeded from the existing project category names. Service titles and descriptions are
  placeholder.
- **Stats:** only facts the site already states (founded 2001 per About; the number of listed projects,
  computed at build time) may be `placeholder: false` — and even these are listed as queries. Everything
  else is placeholder.
- **Staging:** `DraftTag` marks every placeholder item.
- **Production:** `astro build` with `SITE_ENV=production` fails, listing every remaining placeholder,
  via a check in `src/lib/placeholders.ts` called from the pages that use `extras`. `npm run verify`
  repeats the check.

## 7. Code changes

- **Removed** (presentation layer from the clone):
  - `tokens.css`, `base.css`
  - `Blocks`, `Gallery`, `AnchorMenu`, `SiteMenu`, `MobileMenu`, `BackToTop`, `Logo`, the old `Footer`
    (`Block.astro` is rewritten in place for the new design)
  - the clone versions of `Base`/`Project`/`Basic`/`Card`
  - the `--m` mobile scaling

  Git history keeps them.
- **Kept:**
  - `src/lib/{paths,markdown,routes,seo,rows}.ts` and their tests
  - `BgVideo`, `Embed`, `Player` and `ContactForm` logic (restyled; markup adapted)
  - `content.config.ts` (extended with `extras`)
  - the exporter and all its tests
  - `verify-dist.mjs` (extended)
  - the CI workflow
- **New:**
  - `src/styles/{tokens,base,type}.css`
  - `src/components/ui/*` (§3.4)
  - `src/components/{Header,Menu,Footer,NextProject,MediaRows,LetsConnect,…}.astro`
  - `src/layouts/{Base,Project,About,JoinUs,Categories,Page,Card}.astro`
  - `src/pages/services.astro`; `[slug].astro` sends `about`, `joinus` and `copy-of-projects` to their own
    layouts, and any other basic page to `Page.astro`
  - `src/scripts/motion/*`
  - `src/lib/{placeholders,next-project}.ts`
- `README.md` is updated for the new structure. `CONTENT-QUERIES.md` gets the "Redesign" section.
- **Dependencies:**
  - add `gsap`, `@fontsource/bebas-neue`, `@fontsource/dm-sans`
  - remove `@fontsource/nunito-sans`

## 8. Verification

- **Unit tests (vitest):**
  - `extras` schemas reject missing `placeholder`
  - the placeholder guard lists items and throws in production mode
  - next-project order (wrap-around, unlisted fallback)
  - row-to-grid mapping (1/2/3-up, wrap)
  - each page's motion-module manifest
  - menu composition (SERVICES inserted after PROJECTS)
- **`verify-dist`:**
  - 69 URLs: the 68 permanent paths plus `/services`
  - no broken links (including `srcset`)
  - no placeholders in a production build
  - per-page JS of 80 KB gzip or less
  - the existing `dist` size limits
- **QA agents:**
  - `render-qa` on home, a video case study, an image case study, `/projects`, `/services`, `/about`,
    `/joinus` and one business card — at 375 / 768 / 1024 / 1440 / 1920, plus a reduced-motion pass and
    a no-JS pass
  - `perf-auditor`: Lighthouse mobile on home and one case study
  - a contrast check of every token pairing in use
- **Phase review:** each build phase gets a spec-compliance review and a code-quality review before the
  next phase starts (subagent-driven).

## 9. Build order

1. Design system + header/menu/footer + base layout (site still builds; old templates removed as they
   are replaced).
2. Case-study template (57 pages).
3. Homepage.
4. `/projects`, `/copy-of-projects`, `/joinus`, business cards.
5. `extras` collection + placeholder guard, `/services`, expanded `/about`; wire the extras into the
   homepage.
6. Motion pass, QA, `CONTENT-QUERIES.md` "Redesign" section, README.

Every phase ends with `npm test`, `npm run build` and `npm run verify` green.

## 10. Publishing

- Work happens on `redesign`. Staging (GitHub Pages, deployed from `main`) keeps serving the clone.
- During the build, Claude shares screenshots, and a local `npm run preview` link on request.
- When the user says "publish": Claude merges `redesign` into `main` itself (`gh pr merge`, per the
  user's standing preference) and checks the staging URL afterwards.
- Placeholders are allowed on staging (shown with `DraftTag`). Production stays blocked until the Art
  Director and MD have replaced them.

## 11. Queries for the Art Director / MD (seed of the "Redesign" section)

1. Approve the accent colour `#ff4b1f` and the bolder use of charcoal and peach.
2. Approve the move from Helvetica/Avenir to Bebas Neue + DM Sans. This also removes the Avenir licence
   question.
3. Approve the new `/services` URL and a SERVICES menu item after PROJECTS.
4. Supply copy for every `extras` entry marked placeholder:
   - services
   - process
   - timeline
   - stats
   - testimonials (with permission from the quoted person)
   - client list confirmation, plus logo files cleared for use
   - UI strings
5. Confirm "Since 2001" and the project count as public stats.
6. Confirm the wordmark treatment "// ACHATES 360" as text in the header and footer.

## 12. Decisions during the build (2026-10-07)

The redesign was built task by task. Each task was independently reviewed, and so was the whole branch at the end. Where the plan and the reviews disagreed, or the plan was silent, the decision is recorded here with what it costs if it turns out wrong.

QA results:
- Lighthouse mobile: 96 on `/` and 100 on `/notter`.
- CLS 0, and no dropped frames while scrolling.
- Heaviest page: 48.4 KB of gzipped JS.
- No horizontal overflow on any of the 69 pages at 320 or 375px.
- A production build is blocked by the placeholder guard (69 items) until the Art Director and MD approve the copy.

- Ruling R1: if Astro's file() loader does not keep `id` in entry data, drop `id` from the seven extras schemas and read ids from entry.id in loadExtras (map e => ({ id: e.id, ...e.data })) — keeps every id explicit in YAML either way — cost if wrong: one schema tweak.
- Ruling R2: in Task 4, new Block.astro Props keep two transitional optional props `gallery?: 'stack' | 'grid'` and `width?: number` (ignored) so old Blocks.astro still type-checks until Task 7 deletes it; Task 7 removes them — cost if wrong: two dead props for three tasks.
- Ruling R3: subagent commits carry their own model's Co-Authored-By trailer (e.g. Sonnet) instead of the plan's Opus line — the trailer should name the model that wrote the commit — cost if wrong: cosmetic trailer text.
- Ruling R4 (T2 finding 1, plan-mandated): spec §3.1 binds — --muted only ≥24px. Footer small text (h6 labels, .legal) use rgb(233 228 225 / .7) on --black (≈7:1) instead of --muted — cost if wrong: one colour value.
- Ruling R5 (T2 finding 2, plan-mandated): the menu <dialog> gets aria-label from the existing `menu-open` string ("Menu"); the two navs may share "Site" because the open modal makes the page inert, so only one nav landmark is ever reachable — cost if wrong: one more strings.yaml id later.
- Ruling R6 (T3 Important, plan-mandated): spec §4.2 keeps Wix compositions' content; konicaminolta-style overlays (blocks inside an image box) must stay overlaid, not become grid cells. toSegments gains `{ kind: 'stage'; items: { block: T; overlays: Overlay<T>[] }[] }` (from rows.ts nestOverlays) whenever a row has any overlay; Task 4's MediaRows renders 'stage' as tops side by side, each a relative box with overlays absolutely placed at left/top/width % — cost if wrong: one segment kind + ~15 lines CSS.
- Ruling R7 (T4 Imp 1, plan-mandated): .p-back uses margin-block:0 so .wrap keeps its centring — cost if wrong: none.
- Ruling R8 (T4 Imp 2, plan-mandated): spec says existing content is reproduced, so media grids never crop: drop forced height/object-fit:cover in .seg-grid, align-items:start, natural aspect — cost if wrong: ragged grid bottoms instead of even rows.
- Ruling R9 (T4 Imp 3, plan-mandated): NextProject title accepts UiString (rendered via T) for the fallback; BgVideo gets a `draft` prop that puts data-placeholder on the toggle when its labels are placeholders — cost if wrong: small prop surface.
- Ruling R10 (T4 Imp 4, plan-mandated): gallery MediaCards in Block show the item title only when the item links somewhere (linked items carry real project titles; unlinked ones carry file names like "Notter_Nuts_packaging5.jpg") — cost if wrong: filename-titled linked items would show filenames.
- Ruling R11 (T4 Minor 1+2 folded in): pause toggle drops aria-pressed and keeps the changing Play/Pause label; an explicit Play under reduced motion is remembered (data-user-played) so update() does not re-pause it — cost if wrong: none.
- Ruling R12 (T5 concern, plan order defect): the homepage ServicesPreview links /services before Task 8 builds it; tasks 5–7 accept exactly one verify failure, 'BROKEN … -> /services', and Task 8 must clear it — cost if wrong: verify red on the unpublished branch for three tasks.
- Ruling R13 (T5 Imp 1–4, three plan-mandated): fix all four — outline marquee aria-hidden; persistent non-colour invalid marking on text fields after a tried submit; placeholder colour ≥4.5:1; .stack-card:focus-within lifts z-index. Folded minors: one DraftTag on "Trusted by" (keep wall data-placeholder), pointer-events:none on connect marquees only under prefers-reduced-motion: no-preference, DraftTag in LetsConnect inside the gutter — cost if wrong: none.
- Ruling R14 (T7 deviation accepted): /joinus has a trailing link block ('Apply Now', mailto); a link block directly after a role is attached to that role as a fill Pill (label/href verbatim); the unplaced-block guard still throws for anything else — cost if wrong: an Apply link shown inside the role card rather than below the list.
- Ruling R15 (T9 Imp, plan-mandated): keep the <ol class="tl-track"> as the scrolling element (Task 11's timeline.ts targets it) and make it keyboard-reachable with tabindex="0" + aria-labelledby="tl-title" (no role override, list semantics kept); fold in an explicit unknown-project build error — cost if wrong: one extra tab stop.
- Ruling R16 (T10 deviation accepted): check-overflow spawns astro preview with --ignore-lock and polls the URL (Astro 7 preview is a lock-guarded daemon) — cost if wrong: none.
- Ruling R17 (T10 Imp 1–3, #1 plan-mandated): fix all three — unresolved script paths surface as JS failures (exit 1) with a test; overflow check fails non-OK responses; overflow script refuses a busy port (or picks a free one), launches the browser inside try, and kills the server process group — cost if wrong: none.
- Ruling R18 (T11 deviation accepted): run() adds motion-ready before running modules — gsap.from() otherwise reads the CSS-hidden opacity 0 as its end value and leaves content invisible; both happen in the same task so no paint flashes in between; plus ScrollTrigger.refresh() on load/fonts — cost if wrong: a one-frame flash on very slow devices.
- Ruling R19 (T11 Imp 1–2): splitting only happens on h1–h6 (non-heading [data-split] elements such as .np-title get the fade reveal instead, so link names stay intact); counters only animate whole numbers (StatCounter emits data-count only for integers < 1000, counters.ts also guards Number.isInteger). Folded minors: ScrollTrigger.sort() before refresh; reveal starts use clamp(); run() skips modules if motion-ready was already set by the 3s fallback (late bundle); timeline removes tabindex while pinned and restores it on revert; tilt reacts to mouse pointers only — cost if wrong: next-project title no longer letter-animates.
- Ruling R20 (QA High 1): the three 404 menu links are password-protected Wix pages already in known-missing.json and CONTENT-QUERIES — clone parity, no change — cost if wrong: visitors keep hitting 404s from the menu until the studio decides.
- Ruling R21 (QA High 2–3, Medium 4–7, Low 8, perf Medium 1–3): fix per qa/qa-fixes.md — no-JS nav and poster stills; no content-cutting crops (timeline natural aspect, grid tiles 16/9, shorter phone stack cards); --accent-deep #e03c10 for large numerals on light grounds; footer h5/h6 rendered as styled <p> (words unchanged); footer tap targets; card mobile padding; inlineStylesheets always; preload the two above-the-fold woff2 files — cost if wrong: one new colour token and a footer semantic change.
- Ruling R22 (T12 Imp 2): fix the class of bug, not the instance — type.css `.display { margin: 0 }` becomes `margin-block: 0` so .display never cancels .wrap's centring anywhere — cost if wrong: none (headings have no default inline margin).
- Ruling R23: one final fix wave covers the 3 Important plus the cheap pre-production items: skip link; case-study heading levels normalised so the shallowest content heading is h2 (tags only); chip-row focus-ring clipping; JoinUs throws on lead-in text before a role heading; JoinUs +/– glyph excluded from the accessible name; stale ContactForm header comment; CONTENT-QUERIES item 4 wording; README checks/contrast gaps — cost if wrong: two new placeholder strings (marquee pause/play).
- Ruling R24: left deferred — verify re-checking YAML placeholders (build guard is global), dead phAttr / rows.ts helpers (spec §7 kept rows.ts), hard-coded colours, unmarked aria-label/nav placeholders (guard covers production) — cost if wrong: polish debt listed for stage 3.
- Ruling R25 (final residual, parked): /samsung-the-freestyle still jumps h1→h5 because its own copy mixes ## and ##### headings; a uniform shift can't fix mixed-depth content and there is no second fix wave — stage-3 follow-up: per-sequence clamping (each heading ≤ previous+1) — cost if wrong: one page keeps a Lighthouse heading-order warning.
- Ruling R26 (post-merge, staging bug report): R19's `clamp()` on the reveal starts is reverted. clamp() moves the start of anything already on screen at load to scroll 0, where progress is 0 and ScrollTrigger never counts it as entered, so first-screen headings and cards stayed hidden until the visitor scrolled (62 of 69 pages). QA missed it because the browser check ran with reduced motion; check:overflow now also loads every page at 1440×900 with motion on and fails any first-screen reveal that never started — cost if wrong: none (the unclamped start is GSAP's default behaviour).
