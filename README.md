# Achates 360 — website

Astro rebuild of www.achates360.com. This branch is a faithful clone of the Wix site; the redesign
builds on it.

> **Staging.** Every page is `noindex, nofollow` and `robots.txt` disallows everything.
> **Every push to `main` publishes** to https://mingkey88.github.io/achates360-website/.

## Run

    nvm use && npm ci
    npm run dev        # http://localhost:4321/achates360-website
    npm test           # unit tests (export + site helpers)
    npm run build      # astro check + build
    npm run verify     # every Wix URL built, no broken internal links, size limits

`npm run verify` checks the built `dist/`: every sitemap URL has a page, no internal link is broken
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
    npm run export -- --only=notter   # re-render and re-export named pages from the live site
    npm run export                    # live: every page (uses cached renders in .cache/rendered)
    npm run export -- --fresh         # live: re-render every page
    node scripts/export-wix/chrome.mjs  # re-capture the site menus and mobile-only homepage text

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

## Open inputs

- Avenir web licence (Nunito Sans is standing in — `--font-ui` in `src/styles/tokens.css`)
- Enquiry form destination (`PUBLIC_FORM_ENDPOINT`; until set, staging shows "Form not connected")
- Vector logo
- The decisions listed in `CONTENT-QUERIES.md`
