# Achates 360 — Astro Clone of the Wix Site (Design Spec)

**Date:** 2026-10-06
**Status:** Draft — awaiting review
**Sub-project:** 1 of the www.achates360.com revamp

---

## 1. Intent

Rebuild the current Wix site at www.achates360.com as a hand-coded **Astro** static site that is a
faithful 1:1 clone — same pages, same URLs, same copy, same media, same look — hosted from a GitHub
repo on GitHub Pages.

The clone is a **baseline, not the redesign.** It gets everything off Wix into a codebase we own,
so the later revamp (design not yet decided) can be built and reviewed as a diff against
"identical to today".

### What the user said
- Hand-coded; the repo *is* the site (same model as `amigos360-website` and `tienyan-website`).
- Astro as the framework.
- Clone the current Wix site first.
- Some "images" are actually video (homepage heroes) — they must stay video.

### Assumptions (correct if wrong)
- Copy is owned by the Art Director / Managing Director. It is reproduced **verbatim**, typos and
  inconsistencies included; anything questionable is logged in `CONTENT-QUERIES.md`, never fixed
  silently.
- The Wix site stays live and unchanged until a later sub-project switches DNS.

### Success criteria
1. Every URL in the live sitemap (69 pages) resolves on the clone at the **same path**.
2. Every page's text matches the live page verbatim.
3. Every image is the original upload; every background video is the best quality available.
4. Side-by-side with the Wix reference screenshots at 1440px and 390px, each page has the same
   layout, ordering, colours and type scale. (Visual parity, not pixel identity — see §6.)
5. Each page carries the same SEO title and meta description as on Wix.
6. Staging is publicly reachable but not indexable.

---

## 2. Scope

### In scope
- New repo `mingkey88/achates360-website` (public — required for GitHub Pages on the free plan,
  and matching the sibling repos).
- Astro 7 project, content collections, layouts and components to reproduce the current site.
- A one-off, re-runnable export script that pulls content and media from the live Wix site.
- `CONTENT-QUERIES.md` seeded with known discrepancies.
- GitHub Actions deploy to GitHub Pages staging, `noindex`.
- Automated URL-parity and build checks.

### Out of scope
- The redesign (separate sub-project, own spec).
- DNS cutover from Wix, Google Search Console changes, retiring Wix.
- Any copy edits, new pages, removed pages, or sitemap restructuring.
- Analytics.

---

## 3. Site inventory (from live sitemap, 2026-10-06)

| Type | Count | Examples | Notes |
|---|---|---|---|
| Core pages | 4 | `/`, `/projects`, `/about`, `/joinus` | |
| Case studies | ~57 | `/dxv`, `/notter`, `/dbs-discretionary-portfolio-management` | Hero (image or video), title, client line, body copy, `© year` |
| Digital business cards | 6 | `/angeline`, `/joseph-chan`, `/donna`, `/belinda`, `/chuan`, `/abby` | QR code, phone, email, photo, role, `.vcf` download |
| Duplicates | 2 | `/copy-of-projects`, `/copy-of-grohe-quarterly-campaigns` | Wix leftovers, publicly indexed — cloned as-is, logged as a query |

The export (§5) is the authority on exact counts; it also follows internal links to catch any
published page missing from the sitemap.

**Business-card URLs are permanent.** Their QR codes are likely printed on physical cards, so these
six slugs must never change in this or any later sub-project.

---

## 4. Architecture

### 4.1 Repository layout

```
achates360-website/
├─ astro.config.mjs
├─ src/
│  ├─ content.config.ts          Zod schemas for every collection
│  ├─ content/
│  │  ├─ projects/<slug>.md      one per case study
│  │  ├─ cards/<slug>.md         one per business card
│  │  └─ pages/<slug>.md         home, about, joinus, projects copy
│  ├─ assets/
│  │  ├─ projects/<slug>/…       original images (optimised by Astro at build)
│  │  ├─ cards/<slug>/…          photos, QR codes
│  │  └─ site/…                  logo, social icons, award badge
│  ├─ layouts/                   Base, Project, Card
│  ├─ components/                Header, Footer, HeroCarousel, ProjectGrid,
│  │                             CategoryFilter, BgVideo, ContactForm, Block renderers
│  ├─ styles/tokens.css          colours, type scale, spacing — single source of truth
│  └─ pages/
│     ├─ index.astro
│     ├─ projects.astro
│     ├─ about.astro
│     ├─ joinus.astro
│     └─ [slug].astro            renders BOTH projects and cards at root level
├─ public/
│  ├─ media/video/<id>.mp4       background videos (see §5.3 for hosting threshold)
│  ├─ cards/<slug>.vcf           migrated off Wix's file CDN
│  └─ robots.txt                 Disallow: / on staging
├─ scripts/
│  ├─ export-wix/                one-off export (§5)
│  └─ verify-urls.mjs            URL-parity check (§7)
├─ docs/
│  ├─ reference/<slug>/{desktop,mobile}.png   Wix screenshots
│  ├─ media-report.md
│  └─ superpowers/specs/…
├─ source-media/                 OPTIONAL: user-supplied original videos (git-ignored)
├─ CONTENT-QUERIES.md
└─ README.md
```

### 4.2 URLs

- Wix URLs have no trailing slash (`/dxv`). Astro is configured with `build.format: 'file'` and
  `trailingSlash: 'never'`, emitting `dxv.html`. GitHub Pages serves `/dxv` → `dxv.html` directly,
  so **existing URLs resolve with no redirect**.
- Projects and cards share the root namespace. `[slug].astro` builds from both collections; the
  build fails if a slug appears in both, or collides with a core page.
- Staging runs under the project-site prefix `/achates360-website/`. All internal links go through
  Astro's `base`, so moving to the real domain later is a one-line config change (`base: '/'`).

### 4.3 Content model

**`projects`** (frontmatter)

| Field | Type | Notes |
|---|---|---|
| `title` | string | as shown on page |
| `client` | string? | the line under the title, e.g. "DBS Treasures Private Client" |
| `year` | string? | from the `© 2018` footer line, verbatim |
| `categories` | string[] | from `/projects` groupings; many-to-many |
| `listed` | boolean | appears on `/projects` today? Unlisted pages are still built |
| `hero` | `{ type: 'image'|'video', src, poster? }` | |
| `thumb` | image? | the grid thumbnail, if different from hero |
| `seo` | `{ title, description, ogImage? }` | verbatim from Wix `<head>` |
| `order` | number? | position on `/projects` / homepage carousel |
| `blocks` | Block[] | the page body, in on-page order (below) |

**Body as ordered blocks.** Case-study bodies interleave text with media, so the body is a
`blocks` array in frontmatter rather than free Markdown or MDX (MDX would choke on stray `{` / `<`
in verbatim copy). Each block is one of:

- `{ type: 'text', md }` — verbatim copy as a Markdown string (headings, paragraphs, links)
- `{ type: 'image', src, alt }`
- `{ type: 'gallery', items: [{ src, alt }] }`
- `{ type: 'video', src, poster }` — background-style looping video
- `{ type: 'embed', provider: 'vimeo'|'youtube', id }`

A `<Blocks>` component renders the array in order. The Markdown body below the frontmatter is
unused for projects.

**`cards`**: `name`, `role`, `blurb`, `phoneDisplay`, `phoneHref`, `emailDisplay`, `emailHref`,
`photo`, `qr`, `vcf`, `seo`. Display text and link targets are stored **separately** because they
differ on the live site (see §8) and the clone must reproduce exactly what Wix does.

**`pages`**: copy for home, about, joinus, projects (category headings, form labels, footer).

Unknown fields or missing required fields fail `astro check`.

### 4.4 Interactive pieces (vanilla JS islands, no framework)

| Piece | Behaviour to reproduce |
|---|---|
| Header / nav | As on Wix, including mobile menu |
| Homepage hero carousel | Numbered slides 1–6, background videos/images, "VIEW PROJECT" links. Exact interaction (scroll vs click, timing) is recorded from the live site during build and documented in the component |
| Projects category filter | The category tab row on `/projects` |
| Background video | `autoplay muted loop playsinline`, poster frame first; poster only under `prefers-reduced-motion` |
| Contact form | Same fields, required rules and two service-checkbox groups as Wix (§4.5) |

### 4.5 Contact form

Fields and labels reproduced verbatim (Name, Company, Email, the two required service groups with
14 options, message, "Thanks for submitting!"). Submissions post to `PUBLIC_FORM_ENDPOINT`
(e.g. Formspree). Until the destination is decided, the variable is unset and the submit button
shows a visible "Form not connected on staging" notice instead of silently dropping enquiries.

### 4.6 Typography

Wix serves **Avenir** under Wix's licence, which does not carry over. Until the agency confirms
its own web licence, the clone uses a self-hosted free stand-in (**Nunito Sans**) defined once in
`tokens.css`. Swapping in licensed Avenir is a one-token change. Body text stays Arial/Helvetica as
on Wix.

---

## 5. Export pipeline (`scripts/export-wix/`)

Run once with `npm run export`; re-runnable if Wix changes before cutover. Idempotent: re-running
overwrites generated content and skips media already downloaded with a matching size.

### 5.1 Steps per page
1. Read `pages-sitemap.xml`; add any internal links found on crawled pages that are not in it.
2. Fetch rendered HTML.
3. Extract text **verbatim** (no whitespace "fixing" beyond collapsing Wix's empty spacer
   paragraphs and dropping Wix chrome such as "top of page" / "bottom of page" anchors).
4. Extract SEO `<title>`, meta description, OG image.
5. Collect media (§5.2, §5.3) and rewrite references to local paths.
6. Write `src/content/<collection>/<slug>.md`.
7. Screenshot the live page at 1440px and 390px into `docs/reference/<slug>/`.
8. Append anything anomalous to an export log for `CONTENT-QUERIES.md` triage.

### 5.2 Images
Wix image URLs carry a transform segment (`/v1/fill/w_…`). Stripping it returns the **original
upload** (verified: DBS hero returns 2010×900 against a 1727px display). Saved under
`src/assets/…`; Astro generates AVIF/WebP at build. GIFs are kept as GIFs.

### 5.3 Video
- Detected from each element's `data-video-info` JSON (`videoId`, dimensions, `qualities[]`).
- Downloaded at the **highest listed quality** from `video.wixstatic.com/video/<id>/<q>/mp4/file.mp4`
  (verified: 720p ≈ 5.5 MB, 1080p ≈ 7.7 MB). Wix never exposes the original upload — e.g. a
  1440×1024 source is capped at 720p.
- The Wix poster frame (`<id>f000.jpg`) is kept as the `poster`.
- **Override:** if `source-media/` contains a file whose name contains the `videoId`, or is mapped
  in `source-media/map.json`, that original is transcoded (H.264 MP4, ≤1080p) and used instead.
- Vimeo/YouTube players stay as embeds pointing at the same video.

### 5.4 Business cards
`.vcf` files downloaded (Wix `_files/ugd/…` redirects to `filesusr.com`; verified) into
`public/cards/`. QR code images kept unchanged — they encode the live URL, which does not change.

### 5.5 Media report and hosting threshold
`docs/media-report.md` lists total size by type and the 20 largest files. GitHub Pages limits are
100 MB per file and 1 GB per site, and Pages cannot serve Git LFS files. **If built output exceeds
800 MB or any file exceeds 95 MB, stop and bring the user a hosting decision** (e.g. video on
Cloudflare R2 or Vimeo). Video paths go through one `mediaUrl()` helper so that move is a config
change.

---

## 6. Visual fidelity

Wix renders absolutely positioned elements through a large JS runtime; its DOM is not copied.
Each layout is rebuilt in semantic HTML and CSS to match the reference screenshots:

- **Matches:** layout and section order, content, colours, type scale and weights, spacing rhythm,
  image crops, hover states, mobile layout.
- **Allowed differences:** sub-pixel positioning, font rendering from the Avenir stand-in, Wix
  loading placeholders, Wix-only chrome.
- **Not inherited:** Wix's accessibility and performance problems are not deliberately recreated
  (alt text from Wix is kept as-is; missing alt text is logged as a query, not invented).

---

## 7. Verification

| Check | How | Gate |
|---|---|---|
| Schema | `astro check` | build fails |
| URL parity | `scripts/verify-urls.mjs` — every sitemap URL has a built page | build fails |
| Slug collisions | in `[slug].astro` | build fails |
| Internal links | link check over `dist/` | build fails |
| Copy verbatim | export re-run diff against content files is empty | manual, before sign-off |
| Visual parity | `render-qa` agent compares each page to `docs/reference/` at 1440 / 390 | defect list, fixed before sign-off |
| Performance | `perf-auditor` on home, `/projects`, one video case study | report only |

CI runs the first four on every push.

---

## 8. CONTENT-QUERIES.md — initial entries

Reproduced as-is in the clone; each awaits a ruling from the Art Director / MD.

1. **`/angeline` card:** shows `+65 9846 2443` but dials `+65 9685 3533`; shows
   `angeline@achates360.com` but emails `jamillie@achates360.com`. (Highest visitor impact.)
2. **Card SEO descriptions** read as client projects ("Creative branding and visual identity for
   Angeline…").
3. **`/copy-of-projects` and `/copy-of-grohe-quarterly-campaigns`** are live and indexed duplicates.
4. **"← BACK TO PROJECTS"** on case studies links to `/`, not `/projects`.
5. **~37 case studies are not linked from `/projects`** — intentional archive or omission?
6. `/projects` meta description is wrapped in literal quote marks.

The export adds to this list.

---

## 9. Deployment

- GitHub Actions on push to `main`: install → `astro check` → build → verify → deploy to Pages.
- Staging URL: `https://mingkey88.github.io/achates360-website/`.
- `<meta name="robots" content="noindex, nofollow">` site-wide and `robots.txt` `Disallow: /`,
  controlled by one `SITE_ENV` flag so production flips both together.
- **Every push to `main` publishes immediately and publicly.** Work happens on branches; merging to
  `main` is treated as a publish and confirmed first.
- Repo is public: content is already public on Wix, but `CONTENT-QUERIES.md` is visible too and is
  written factually with that in mind.

---

## 10. Inputs from the user (none block the clone)

| Input | Default until provided |
|---|---|
| Original video files | Wix's best transcode |
| Vector logo (SVG/AI) | Wix PNG at highest available resolution |
| Avenir web licence? | Nunito Sans stand-in |
| Form submission destination | Visible "not connected" notice on staging |

---

## 11. Follow-on sub-projects (not specified here)

2. Redesign — direction, design system, page designs, built on this codebase.
3. Cutover — DNS from Wix, production `SITE_ENV`, Search Console, form live, Wix retirement.
