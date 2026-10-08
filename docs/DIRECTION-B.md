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
| Hero | Dark teal "film": giant ACHATES 360, figures gather, 3D ring of work orbits | White stage: a wide-angle "lens" of project images (wide cards on desktop, tall on phones) drifts slowly, the side cards curving toward the viewer and blurring into white; figures gather above a letter-spaced ACHATES 360, tagline and description in small caps in the corners |
| Type scale | Very large (titles up to 15rem) | Restrained (page titles up to 8rem, section headings up to 3.25rem) |

Contrast (WCAG 2.x) for B's pairings: ink on white 18.39, text-2 `#5a6563` on white 6.04,
muted `#7b8785` on white 3.72 (large only), accent-deep `#b85c00` on white 4.60, on-dark
`#e6eeec` on `#1b1d1d` 14.36, orange on `#1b1d1d` 7.46, ink on panel `#f4f5f4` 16.82, ink on
orange 8.10. All pass for their sizes.

To view locally: `git checkout direction/croma && npx astro dev`, then
http://localhost:4321/achates360-website. Switch back with `git checkout feature/hero-film`.

## Homepage structure (B only)

The clone's homepage carried about 79 portfolio items (15 in the hero, a 6-card deck, the full
58-item grid). B's homepage is a short editorial sequence; the full list stays on /projects.

1. Hero: the lens strip (10 projects).
2. Point of view: the About sentence "The name Achates 360 reflects…", link to About.
3. Selected work: 4 projects in an asymmetric two-column grid, client · discipline · year under
   each, video on hover, "View all projects (49)".
4. What we do: the four service groups as a numbered index, image on hover, link to Services.
5. Credentials: stats, client names as one line of text, an awards line from the March 2026 deck.
6. One testimonial, set large.
7. Contact form.

Removed from the homepage: the stacked card deck, the 58-project grid, the dark stats band and
logo marquee, three testimonial cards and the "Let's connect" banner. Case-study "Back to
projects" links now go to /projects (the homepage no longer has the grid they scrolled to).

