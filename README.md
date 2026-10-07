# Achates 360 — website

Astro rebuild of www.achates360.com. The content is the Wix site's, verbatim; the design is the
stage 2 redesign (see "Redesign" below).

> **Staging.** Every page is `noindex, nofollow` and `robots.txt` disallows everything.
> **Every push to `main` publishes** to https://mingkey88.github.io/achates360-website/.

## Run

    nvm use && npm ci
    npm run dev        # http://localhost:4321/achates360-website
    npm test           # unit tests (export + site helpers)
    npm run build      # astro check + build
    npm run verify     # every Wix URL built, no broken internal links, size limits

`npm run verify` checks the built `dist/`: every sitemap URL and every permanent URL
(`scripts/export-wix/permanent-urls.json`: the 68 snapshot pages, including the six business
cards on printed QR codes) has a page, no internal link is broken
(links to the known-missing pages below are reported, not failed), no file is over **95 MB** and
the whole site is under **800 MB** (GitHub Pages limits). CI runs it on every pull request and every push to `main`.

## Content

Content lives in `src/content/` and was generated from the live Wix site by `npm run export`.
**Do not reword copy** — it is verbatim from the client; raise changes in `CONTENT-QUERIES.md`.
**Do not hand-edit `src/content/`** to fix how the site was exported — change the exporter and
re-run it (offline, see below).
**Approved copy changes** (the one-line fixes in `CONTENT-QUERIES.md`, once signed off) are made
by editing the content file directly. Any later export, even `--offline`, rewrites the files it
exports and would undo them: after an export, check `git diff src/content` and keep the approved
edits (from then on an offline export is no longer an exact no-op on those files).

| Collection | Path | URL |
|---|---|---|
| projects | `src/content/projects/<slug>.md` | `/<slug>` |
| cards | `src/content/cards/<slug>.md` | `/<slug>` (printed QR codes — never rename) |
| basic | `src/content/basic/<slug>.md` | `/<slug>` |
| home / projectsIndex / site | single files | `/`, `/projects`, logo, footer and site menus |

Media: images in `src/assets/wix/`, video in `public/media/video/`, vCards in `public/cards/`.
Images are capped at 2560 px wide; the untouched originals are kept in `.cache/originals/`
(local only, not committed).
To use original video files instead of Wix's transcodes, put them in `source-media/` with the Wix
video id in the filename (or map them in `source-media/map.json`) and re-run `npm run export`.

Known-missing pages: Wix links to a few pages it serves behind a password or as a 404, so there
is nothing to clone. They are listed in `scripts/export-wix/known-missing.json` (written by the
export) and in `CONTENT-QUERIES.md` item 3.

## Re-export from Wix

The committed content is a **snapshot** of the live site taken on 2026-10-06. The live site has
changed since (see "Changed on the live site during the build" in `CONTENT-QUERIES.md`), so a live
export would pull those changes in — and, for example, lose `/joseph-chan`, which now redirects
on Wix but must stay for printed QR codes. **Never run a full live export without first reviewing
the live-site drift** and deciding what to take.

    npm run export -- --offline       # rebuild src/content from the cached renders (no network)
    npm run export -- --only=notter   # re-export named pages (from the cache; add --fresh to re-render live)
    npm run export                    # live: every page (uses cached renders in .cache/rendered)
    npm run export -- --fresh         # live: re-render every page
    node scripts/export-wix/chrome.mjs  # re-capture the site menus and mobile-only homepage text

A full export never deletes a content file whose page it did not export (for example a page that
has left the live sitemap): it keeps the file, prints `KEPT …` and logs it in `docs/export-log.md`.
Pass `--allow-removals` to delete such files — and only after deciding that the URL may go; verify
still requires every path in `permanent-urls.json`. A `--only` run leaves `sitemap-urls.json` as
it is and keeps each project's listing fields (`categories`, `listed`, `order`) from its existing
file, since it does not export `/projects`.

`--offline` reads the page list from `scripts/export-wix/sitemap-urls.json`, renders nothing and
downloads no media: it re-runs extraction, mapping and writing over `.cache/rendered/`. With an
unchanged exporter, `git status src/content` stays clean afterwards — use it to check exporter
changes. The cache lives in `.cache/` and is local only.

The site menus (Wix's desktop lightbox menu and its phone menu) and the "Projects" heading Wix adds
to the phone homepage exist only once a visitor opens them, so `chrome.mjs` captures them from a
live render of the homepage into `.cache/rendered/home.chrome.json` and writes only the `menu`,
`mobileMenu`, `menuSocial`, `favicon` (site; the icon comes from the cached homepage render) and `mobileHeading` (home) keys. A live export that re-renders the homepage
captures them too; menu links to pages missing from the snapshot are left out and logged.

The export writes `docs/export-log.md` (anomalies) and `docs/media-report.md` (sizes); a `--only`
run writes its reports to `.cache/` instead.

Reference screenshots of the live site (`docs/reference/<slug>/{desktop,mobile}.png`) are local
only (git-ignored). Re-capture them with `npm run render -- --out .cache/render-html <slug> …`
(the `--out` keeps the fresh HTML away from the export cache, so offline exports stay on the
snapshot).

## Redesign

Stage 2 keeps the exported copy and URLs and replaces the look. New copy is marked **DRAFT** until the
Art Director / MD approve it (`CONTENT-QUERIES.md#redesign-stage-2--decisions-and-copy-needed-before-launch`).

### Design tokens

Defined in `src/styles/tokens.css`. Light only. Brand colours come from the corporate sheet
(`brand/BRAND-NOTES.md`); all three are light, so they are grounds for `--ink` text, never text on light.

| Token | Value | Use |
|---|---|---|
| `--accent` | `#ff9015` | brand orange (Pantone 1495 U): pills, stickers, contact band, accents on dark grounds |
| `--accent-deep` | `#b85c00` | orange for text and marks on light grounds (About stats, list markers) |
| `--turquoise` | `#99d9d9` | brand turquoise (324 U): colour bands, cards, text on teal-ink |
| `--lime` | `#cbe880` | brand lime green (373 U), sparingly: About clients band, text selection |
| `--teal-ink` | `#163c41` | dark bands (stats, next project, menu, About intro) |
| `--ink` | `#151414` | text |
| `--paper` | `#f3f5f4` | page background |
| `--panel` | `#e1eeec` | turquoise-tinted light panel (process steps) |
| `--white` / `--black` | `#ffffff` / `#0d0d0d` | form fields / footer |
| `--text-2` | `#5a6563` | secondary text on light grounds |
| `--muted` | `#7b8785` | only at 24px or larger |
| `--on-dark` / `--on-dark-2` | `#e6eeec` / 70% | footer text / labels |

Fonts: Bebas Neue 400 (display) and DM Sans 300/400/500 + 400 italic (text), self-hosted via
`@fontsource`; the two latin 400 files are preloaded in `Base.astro`. Radii 16 / 32 / 999 px.
Breakpoints (mobile-first): 480 / 768 / 1024 / 1440.

**Contrast** (WCAG 2.x relative luminance; computed 7 Oct 2026 for the corporate palette, see `brand/BRAND-NOTES.md`)

| Text | Background | Ratio | Minimum |
|---|---|---|---|
| ink `#151414` | paper `#f3f5f4` | 16.79 | 4.5 |
| ink | turquoise `#99d9d9` | 11.63 | 4.5 |
| ink | lime `#cbe880` | 13.48 | 4.5 |
| ink | accent `#ff9015` | 8.10 | 4.5 |
| turquoise | teal-ink `#163c41` | 7.56 | 4.5 |
| white (headings) | teal-ink | 11.95 | 4.5 |
| accent (stat numbers, arrows, menu hover; large) | teal-ink | 5.27 | 3 |
| on-dark `#e6eeec` (footer text) | black `#0d0d0d` | 16.48 | 4.5 |
| on-dark-2 (footer labels, 70%) | black | 8.26 | 4.5 |
| text-2 `#5a6563` (subtitles, placeholders) | paper | 5.52 | 4.5 |
| muted `#7b8785` (large only) | paper | 3.40 | 3 |
| accent (any text) | paper | **2.07** (fails: never text on light) | 3 |
| accent-deep `#b85c00` (stat numbers, list markers) | paper | 4.20 | 3 |

Accent on paper misses 3:1, so large numerals on light grounds use `--accent-deep`. Accent on
black (homepage stats band) is fine.

### Where new copy lives

All new copy is in `src/content/extras/*.yaml` (`services`, `process`, `timeline`, `stats`,
`clients`, `testimonials`, `strings`). Every entry has an explicit `placeholder: true|false`. UI
text lives in `strings.yaml` and is read with `text(id)` (`loadExtras()`); templates never hard-code
new visible copy. On staging a placeholder renders `data-placeholder` and a DRAFT tag. Never edit the exported collections
(`projects`, `cards`, `basic`, `home`, `projectsIndex`, `site`) by hand for redesign work.

### Production guard

`SITE_ENV=production npm run build` fails with "Production build blocked: N placeholder item(s)
still need approved copy" while any placeholder remains (`assertPublishable`, `src/lib/placeholders.ts`).
Production also sets the site to `https://www.achates360.com` at base `/` and drops `noindex`.

### Motion

`src/scripts/motion/manifest.ts` maps each page kind to the motion modules it loads (reveal, hero,
stack, counters, timeline, tilt); case studies get only the light reveals. `prefers-reduced-motion`
turns everything off; with JS off or a failed bundle, content shows (3 s fallback in `Base.astro`),
the full navigation is shown, and videos fall back to their poster stills.

### Checks

    npm test                 # unit tests
    npm run build            # astro check + build (staging)
    npm run verify           # URLs, links, size limits, JS budget (80 KB gzip per page)
    npm run check:overflow   # Playwright: no sideways scroll on every page at 320 and 375 px

`npm run verify` also checks every built page for: exactly one `<h1>`; the site header and
footer; a link to `/services`; the "next project" band on case studies; the 3 s motion fallback
script wherever `data-split` / `data-reveal` hooks appear; a JS budget of 80 KB gzip, with any
script it cannot resolve failing the check; and placeholder markup (`data-placeholder`, Draft
tags), which is rejected only when `SITE_ENV=production`.

`npm run check:overflow` starts its own preview and loads every page at 320 and 375 px,
failing on any horizontal scroll.

## Open inputs

- Enquiry form destination (`PUBLIC_FORM_ENDPOINT`; until set, staging shows "Form not connected")
- Vector logo
- The decisions listed in `CONTENT-QUERIES.md`, including the Redesign section
