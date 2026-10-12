# Direction B: "Croma" (quiet, editorial)

An alternative visual direction for management to compare with direction A (the current
`feature/hero-film` look). Branch `direction/croma`, built from A so content, pages, motion
and checks are identical; only the presentation differs. Inspired by the Kitpro "Croma" Webflow
template (https://kitpro-croma.webflow.io/): its feel only, no code or images taken.

| | Direction A (bold) | Direction B (quiet) |
|---|---|---|
| Typeface | Bebas Neue (condensed display) + DM Sans | Three voices: Cormorant Garamond for headlines and italic accent phrases (posh), Inter Tight for practical titles (project names, services, card captions: modern, after terrot.webflow.io), Fira Sans for text and small tracked labels. Fira is Erik Spiekermann's free relative of ITC Officina, the corporate typeface |
| Page ground | Pale grey-green | Warm ivory `#f7f4ef` |
| Dark bands | Deep turquoise `#163c41` | Warm near-black `#1c1916` |
| Colour | Orange, turquoise and lime in large fills | Almost none: ink on ivory; buttons are underlined small-caps links; orange survives only in small touches |
| Header | Logo left, dotted menu right | Logo centred, menu centred beneath in small tracked capitals (Hermès-style) |
| Hero | Dark teal "film": giant ACHATES 360, figures gather, 3D ring of work orbits | White stage: a wide-angle "lens" of project images (wide cards on desktop, tall on phones) drifts slowly, the side cards curving toward the viewer and blurring into white; cards carry the project name and client; the figures gather above a letter-spaced serif ACHATES 360 in ink; italic serif tagline and small-caps description in the corners |
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

## Contact form and motion (B)

- Contact (after Aesop): one centred column on blush; boxed fields with small labels above (name and
  company side by side, email full width), the service choices as an even grid of square checkboxes
  on hairline rows, a full-size message box and one solid "Submit →" (full width on phones).
  Wording, validation and posting are unchanged.
- Motion: headings rise line by line out of a mask; project images in Selected work and the
  projects grid are unveiled bottom-to-top while settling from a slight zoom; a soft circle with an
  arrow follows the pointer over linked project images (fine pointers only, never under reduced
  motion).

Applied site-wide through the shared tokens and components: the projects index categories are a quiet
underlined index, business cards are ivory with hairline details and an ink button, Join Us roles
sit on hairlines instead of white panels.

Texture and lens (B): the lens strip has depth of field (each card blurs and desaturates gradually with its distance from the centre, like a wide-open lens) instead of a flat edge blur; a faint still paper fibre sits on every ivory ground, and a light film grain over photographs. Deliberate imperfection, in keeping with a print studio.

## Aesop pass (12 Oct 2026, replaces the serif/sans mix above)

After aesop.com.sg: one quiet grotesk throughout (Hanken Grotesk, a free relative of Aesop's Suisse),
everything in sentence case with no tracked capitals (labels the export supplies in capitals, such as
the menu, "VIEW PROJECT" and "← BACK TO PROJECTS", display in sentence case via the `.sc` utility; the
copy itself is unchanged); small, calm headings (page titles up to 2.75rem, hierarchy by space); warm
cream `#fffef2` with earthy section tints (stone `#f6f3e8`, blush `#f7ecdd`, sage `#dbdecf`), charcoal
`#252525` footer with hairline-ruled column headings; rectangular buttons with an arrow; Selected work
as split image/tinted-panel compositions; the hero settles into a centred stack (full stacked logo,
tagline, description, one button); the testimonial is set alone in an upright serif (Cormorant), as
Aesop sets its quotations. Lens depth of field, paper texture and film grain kept.

Contrast: ink `#333333` on cream 12.46 (sage 9.24); text-2 `#5f5f5a` 6.33 on cream, 4.70 on sage;
accent-deep `#9c4f00` 5.86 on cream, 4.35 on sage (large/links only there); cream on charcoal 15.12;
footer labels `#bdbcb2` on charcoal 8.03. Muted `#8a8a84` only on cream/stone at large sizes.

Projects (B): /projects is an overview of the nine categories as image tiles with counts; each category has its own page at /projects/<slug> (slug from the supplied heading, src/lib/categories.ts). A "Category" dropdown on these pages and a dropdown under Projects in the header move between them; the phone menu lists them under Projects. Old /projects#<section> links forward to the category page.

After nationalgallery.sg (12 Oct 2026): lens cards closer (gap ~0.25vw desktop, ~0.8vw phones); the intro sentence in ink with its key phrase "faithful companion and trusted friend" in brand orange (display only); "Selected work" as heavy cut-out lettering filled with a project photograph, just touching the first picture; Selected work's tinted text cards overlap their picture's edge on desktop; the founding year drawn as a large outlined numeral behind the credentials; footer social links with square outlined network marks (Simple Icons, CC0; LinkedIn drawn by hand).

