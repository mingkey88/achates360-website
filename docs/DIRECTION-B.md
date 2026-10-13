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

After nationalgallery.sg (12 Oct 2026): lens cards closer (gap ~0.25vw desktop, ~0.8vw phones); the intro sentence in ink with its key phrase "faithful companion and trusted friend" in brand orange (display only); Selected work opens with a cover (SelectedCover.astro): the Star Wars × Luzerne film fills the screen and stays put while a sheet of the page's own paper, with "Selected work" cut out of it, scrolls up and away, uncovering it; the project's card overlaps the film's lower corner (pure CSS sticky, no script). Selected work is now five projects, Star Wars first; Selected work's tinted text cards overlap their picture's edge on desktop; the founding year drawn as a large outlined numeral behind the credentials; footer social links with square outlined network marks (Simple Icons, CC0; LinkedIn drawn by hand).

Logo motif: LogoSketch.astro draws the logo's five figures as one thin, clean inked outline (no wobble); it sits on the cover's paper and faintly behind the contact form.

Closing section (after kitpro-croma): the contact form moves to its own page, /contact (the menu's CONTACT item and old /#contact links now go there). The homepage ends with ScatterCTA: nine project pictures start as a pile in the middle of a sticky stage and spread to the edges as you scroll (scripts/motion/scatter.ts, scrubbed), revealing "Write to us.", the footer's own intro sentence and a "Get in touch" button to /contact. Without motion the pictures sit spread out with the message visible.


## 12 Oct 2026 — cover and lens, after the audit
- **Selected work cover, after nationalgallery.sg's "EXPERIENCE ART YOUR WAY":** the sheet of paper now covers only the top of the screen (64svh desktop, 38svh phones) with a stepped lower edge (the left 40% stops 7svh higher), so the film runs plain below it. The heading is cut out in heavy capitals (display only; the h2 keeps "Selected work"), both lines right-aligned on one edge, and the logo's five figures are cut out beside the second line like an alpha mask, so the film shows through them too. The paper still scrolls up and away to uncover the whole film.
- **Hero lens, Croma's curve (replaces the 0.68 radius tried first, which made whole cards taller):** the cards no longer sit on a circle. They stand edge to edge along a curve that is almost flat in the middle and swings toward the viewer at the edges, levelling off below 68° so the outer cards slide off the screen instead of curling back (src/lib/lens.ts, shared by the server render and hero.ts). Desktop cards 16vw (Croma's proportion) under a 48vw perspective, so five cards span the full width with the outer pair turned about 58°; lighter edge fade and depth of field so the turned cards stay visible.
- **About and Services in direction B (Batch 2, step 1):** About drops the charcoal intro band, orange stats, client marquee, tilted testimonial cards and the "Let's connect" marquee. It now has the studio's own text in an editorial reading column beside a sticky page title, then the homepage's Credentials band, the story timeline, one set-alone quotation (QuoteBand, shared with the homepage) and a quiet close (CloseCTA: "Write to us." and the contact button under a hairline). The Wix "Back to projects" link is not shown on About. Services drops the tilted sticker; "How we work" becomes four hairline columns with every step's text visible (no boxes, pentagons or dotted line); the reel runs full width without the "Play / Reel" words; it closes with CloseCTA.
- **Project pages (Batch 2, step 2):** a darker shade at the top of the hero keeps the white header legible over light photographs; on wide screens the facts (client, year, discipline, recognition) sit in a narrow sticky column (3 of 12) and the story and pictures fill the other 9, instead of a narrow text column with most of the screen empty; every exported heading in the story is one regular style (bold wrappers no longer change the weight); "Next project" is a stone band ending on a hairline, so it no longer merges into the charcoal footer.
- **Print touches (Batch 2, step 3; the torn cover edge was considered and declined):** the soft drop shadows give way to printer's crop marks, eight hairline ticks just outside each corner (`.crop` in base.css), round the Selected work pictures and the closing section's scattered pictures; each Selected work picture has a folio (02, 03…) beside its inner top mark. Full-width phone pictures have no corners, so no marks. The hero cards stand edge to edge, so they lose the shadow without marks. The paper fibre is stronger (alpha .07 → .16) so it reads as uncoated stock. The orange key phrase in the intro sits a hair off register over a lighter orange plate.
- **Closing section pictures are interactive:** each scattered picture links to its project (its name appears under it on hover or keyboard focus). With a mouse or pen it can also be picked up and dragged around the stage; a press only becomes a drag after 6px, so a click still opens the project (src/scripts/pile.ts). Touch is left to scrolling and tapping. The message stays above the pictures so its button is always reachable.
- **Selected work rows (Batch 2, step 4):** four layouts were tried (lead, spread, type, quiet); the client kept *spread* for the second row only (a 16:7 picture across the page with client · discipline · year, title and link on one caption line under a hairline). The other rows keep the original *lead* layout: a large picture with a tinted panel overlapping its corner (DXV and Notter pictures on the left, DBS on the right, at the client's request). With the drop shadows gone (step 3) the stone panels vanished into the paper, so the lead panels are blush and sage.
- **Blueprint grid (13 Oct 2026, client request):** the page's paper now carries a faint draughtsman's grid under the fibre, in a blueprint blue: minor lines every 24px, a stronger line every 120px, centred on the page (`--grid` in tokens.css, on body). Bands, panels, pictures and the Selected work cover sheet sit on top of it plain, like sheets laid on graph paper. The hero stays plain paper (client, 13 Oct: the grid showed through the faded edge cards); the grid fades in over its last 140px. The hero's edge fade is now a mask on the card strip instead of paper-coloured overlays, so it leaves no lighter strips at the sides.
- **Hero copy split (13 Oct 2026, client: the centred stack felt crammed):** on wide screens the copy under the strip runs along a hairline like a drawing's title block: the stacked logo at the left, the tagline beside it, the site description and the button at the right. Phones and narrow tablets keep the centred stack.
- **Header as a masthead (13 Oct 2026, client: "more elegant, premium"):** wide screens now have one 88px row instead of the two-row Hermès stack (112px): the site's sections at the left in menu order, the logo centred, Contact at the right as the one framed action (hairline box, filled on hover), then the menu button (two hairlines of unequal length). Home leaves the bar (the logo goes home) but stays in the full menu. Links are small with slight tracking; a hairline draws in from the left on hover and stays under the current section. Once scrolled, the bar condenses to 64px with the logo at 48px (no smaller, or the wordmark softens). The Projects dropdown is a paper sheet framed by a hairline, without the soft shadow. Phones and tablets keep logo + menu button.
- **AEO/GEO (13 Oct 2026):** /llms.txt is generated at build from the site's content (About copy, project categories, every listed case study with client, year, categories and the opening of its write-up; no client wall until approved). Structured data now gives the studio one entity id that every page refers to: Organization (About's first sentence, categories as knowsAbout, Singapore; no phone, postcode or founding year until confirmed), WebSite, AboutPage, ContactPage, an ItemList of projects, a Service per service, and CreativeWork with categories. Production robots.txt names the AI search crawlers (allowed) and the training crawlers (allowed for now; one setting, CONTENT-QUERIES 48). A draft FAQ awaits the client (item 49).
- **Desktop menu button removed (13 Oct 2026):** at 1024px and wider the masthead already holds every page (logo = Home, footer = social links), so the full menu is for narrower screens only. Contact is the one action at the right.
- **Homepage first impression (13 Oct 2026, client: "does it look impressive enough?"):** the tagline under the hero strip is now set as display type (up to 5rem, two lines), locked up with the stacked logo along the title-block hairline; it is the page's statement. The project captions left the pictures: each card has a small plate caption beneath it (project in ink, client in grey), as in a printed catalogue, so nothing is written over the work (Micro LED and MH Innovates carry their own type, which the old captions collided with). The "Inside the studio" paragraph moved after Selected work, so the second screen is work, not words (text unchanged).
- **All-projects index (13 Oct 2026, client: "should we have an all projects page?"):** /projects no longer shows nine category tiles (the homepage's "View all projects (52)" led to a menu). It is one grid of the 52 listed case studies in the homepage gallery's order (src/lib/project-index.ts). A catalogue view and category filter chips were tried and dropped (client: "just the grid will do"); the category pages stay, reached from the header's Projects menu. Unlisted (password-protected) pages stay out.
- **Projects cover (13 Oct 2026), after the die-cut dove in 'Building Memories':** the index opens with a sheet of the page's own paper (as the homepage's Selected work cover; the brand orange was tried and found too bright, and National Gallery Singapore, the reference, keeps its red to small accents) laid over the top of the page, with the logo's five figures and the word PROJECTS cut clean through it: true holes, so the page underneath (the heading and the first pictures) shows in the cut. The sheet casts a slight shadow into the cut, and its outline is cut in square steps (client: an irregular shape; stepped chosen over curved, angled or folded), after the buildings on the book's cover and the homepage cover's stepped edge, kept clear of the small print, the figures and the word. "№ 001 – 052", crop marks and a printer's colour bar (CMYK + the brand's 1495 U, the cover's one touch of orange) mark it as a press sheet. With motion (motion/cover.ts) the page is pinned for 70% of a screen while the sheet slides away to the left; during that hold the page carries its own paper and grid (offset to continue the body's without a seam) and the header ignores the held scroll (html[data-scroll-hold]), so nothing but the sheet moves. Reveals inside the pinned page allow for the pin ([data-pin-container]). A book-cover swing was tried first and dropped. Without motion or JS it is a still sheet at the top and the list follows.
- **Card pointer (13 Oct 2026, client: the circle felt intrusive):** the circle that follows the pointer over linked cards is now 34px (was 84px), a paper disc with a hairline and a small arrow, set off to the lower right of the pointer instead of over it, with no drop shadow.
- **Category covers and fainter grid (13 Oct 2026, client):** each category page now opens like /projects: the same paper cover with the logo's figures and the category's name cut through it (src/lib/cut-lines.ts breaks long names onto two lines and sizes the cut to fit; "&" stays with the line before it), and a shorter hold (half a screen), since visitors hop between categories. Category grids now match the /projects grid (ProjectCards: 4:3, three across). The cover's right-edge notch moved up beside the figures so two-line names clear it. The page grid is about a third fainter (minor lines .06 → .04, major .11 → .075), so it recedes behind dense pages.

