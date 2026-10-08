# Direction B: "Croma" (quiet, editorial)

An alternative visual direction for management to compare with direction A (the current
`feature/hero-film` look). Branch `direction/croma`, built from A so content, pages, motion
and checks are identical; only the presentation differs. Inspired by the Kitpro "Croma" Webflow
template (https://kitpro-croma.webflow.io/): its feel only, no code or images taken.

| | Direction A (bold) | Direction B (quiet) |
|---|---|---|
| Typeface | Bebas Neue (condensed display) + DM Sans | Fira Sans throughout, headings in modest caps. Fira is Erik Spiekermann's free relative of ITC Officina, the corporate typeface |
| Page ground | Pale grey-green | White |
| Dark bands | Deep turquoise `#163c41` | Near-black `#1b1d1d` |
| Colour | Orange, turquoise and lime in large fills | Orange as the one accent (buttons, labels, numbers); turquoise and lime only in small touches |
| Hero | Dark teal "film": giant ACHATES 360, figures gather, 3D ring of work orbits | White stage: a curved arc of 12 project images drifts slowly, figures gather above a letter-spaced ACHATES 360, tagline and description in small caps in the corners |
| Type scale | Very large (titles up to 15rem) | Restrained (page titles up to 8rem, section headings up to 3.25rem) |

Contrast (WCAG 2.x) for B's pairings: ink on white 18.39, text-2 `#5a6563` on white 6.04,
muted `#7b8785` on white 3.72 (large only), accent-deep `#b85c00` on white 4.60, on-dark
`#e6eeec` on `#1b1d1d` 14.36, orange on `#1b1d1d` 7.46, ink on panel `#f4f5f4` 16.82, ink on
orange 8.10. All pass for their sizes.

To view locally: `git checkout direction/croma && npx astro dev`, then
http://localhost:4321/achates360-website. Switch back with `git checkout feature/hero-film`.
