# Direction B: "Croma" (quiet, editorial)

An alternative visual direction for management to compare with direction A (the current
`feature/hero-film` look). Branch `direction/croma`, built from A so content, pages, motion
and checks are identical; only the presentation differs. Inspired by the Kitpro "Croma" Webflow
template (https://kitpro-croma.webflow.io/): its feel only, no code or images taken.

| | Direction A (bold) | Direction B (quiet) |
|---|---|---|
| Typeface | Bebas Neue (condensed display) + DM Sans | Modern + luxe mix: Inter Tight (tight grotesk) for headings, Cormorant Garamond italic for accent phrases, Fira Sans for text and small tracked labels. Fira is Erik Spiekermann's free relative of ITC Officina, the corporate typeface. Modern cues after terrot.webflow.io |
| Page ground | Pale grey-green | Warm ivory `#f7f4ef` |
| Dark bands | Deep turquoise `#163c41` | Warm near-black `#1c1916` |
| Colour | Orange, turquoise and lime in large fills | Almost none: ink on ivory; buttons are underlined small-caps links; orange survives only in small touches |
| Header | Logo left, dotted menu right | Logo centred, menu centred beneath in small tracked capitals (Hermès-style) |
| Hero | Dark teal "film": giant ACHATES 360, figures gather, 3D ring of work orbits | White stage: a wide-angle "lens" of project images (wide cards on desktop, tall on phones) drifts slowly, the side cards curving toward the viewer and blurring into white; cards carry the project name and client; the figures gather above a large lowercase "achates 360" in a brand-orange gradient; italic serif tagline and small-caps description in the corners |
| Type scale | Very large (titles up to 15rem) | Restrained (page titles up to 8rem, section headings up to 3.25rem) |

Contrast (WCAG 2.x) for B's pairings: ink `#1a1714` on ivory 16.27, text-2 `#6a6259` on ivory
5.46 and on panel `#eee8df` 4.92, muted `#8c8379` on ivory 3.40 (large only), accent-deep
`#a85400` on ivory 4.87, on-dark `#eee8df` on `#1c1916` 14.37 (70%: 7.76), orange on `#1c1916`
7.71. All pass for their sizes.

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

The hero title gradient runs #d56f0a to #a85400: 3.13 to 4.87 on ivory, above the 3:1 large-text minimum.

## Contact form and motion (B)

- Contact: an editorial form. Large single-line fields with floating labels and an underline that
  draws across on focus; the service choices as text tags (checked = ink); steps numbered 01-03;
  the intro statement stays in view on desktop; a large "Submit" with a circled arrow. Wording,
  validation and posting are unchanged.
- Motion: headings rise line by line out of a mask; project images in Selected work and the
  projects grid are unveiled bottom-to-top while settling from a slight zoom; a soft circle with an
  arrow follows the pointer over linked project images (fine pointers only, never under reduced
  motion).

