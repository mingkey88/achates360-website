# Achates 360 — design direction

The design of www.achates360.com as it stands: the idea, the rules and the parts, so anyone changing the
site keeps it one coherent thing. Present tense: this is how the site **is** designed.
The dated record of every decision and why it was made is [docs/DIRECTION-B.md](docs/DIRECTION-B.md).
How the site is organised: [docs/INFORMATION-ARCHITECTURE.md](docs/INFORMATION-ARCHITECTURE.md).
How it is built: [docs/BLUEPRINT.md](docs/BLUEPRINT.md).
Last updated 20 Oct 2026.

---

## 1. The idea: the website is a publication

Achates 360 is a print-literate design studio: books, annual reports, packaging, campaigns. Its own
art book, *Building Memories*, is the source of the direction. The site is set like a well-made
publication (a catalogue, a monograph) rather than like a website template:

- **Quiet paper, one ink, one accent.** Warm cream stock with a faint fibre and a draughtsman's grid,
  dark grey ink, and the brand's orange (Pantone 1495 U) used sparingly and on purpose.
- **The devices of print, used honestly.** Crop marks round plates, folios and catalogue numbers,
  running heads, a printer's colour bar, spreads, a colophon, paper cut through like a die-cut cover.
- **Words lead, the work proves.** Calm type, generous space, pictures shown whole and captioned like
  plates, never covered with text.
- **Movement is a print process.** Sheets slide, plates come into register, ink fills in. Never
  decoration for its own sake.

**Personality:** quiet, assured, crafted, warm. A faithful friend and a thoughtful designer
(the studio's own line: *faithful friend • thoughtful design*).

**References** (their feel, not their code or images): *Building Memories* (die-cut paper, stepped
edges) · Aesop (one quiet grotesk, cream and earthy tints, sentence case, calm) · National Gallery
Singapore (orange marker bars, two-tone headings, selected tabs, leader lines) · Kitpro "Croma"
(the curved lens of projects, the closing scatter).

---

## 2. Principles

1. **One publication.** Every page uses the same devices; a visitor should feel they are turning pages
   of one book, not visiting different sites.
2. **The client's words, unchanged.** Copy is used verbatim. Design may choose which words are orange,
   how a sentence is set and where it sits; it never rewrites them. New wording is marked Draft until
   approved.
3. **Restraint makes the accent work.** Orange is meaningful because it is rare. If everything is
   orange, nothing is.
4. **Legible first.** Anything a visitor must read is ink on paper at a comfortable size. Colour and
   texture never cost legibility.
5. **Nothing in the way.** Index and navigation pages open straight on their content. Held, animated
   moments are for storytelling pages only (About, How we work, the homepage cover), never for pages
   people use to find things.
6. **Equal treatment.** Client logos share one colour and one visual weight; awards are shown at one
   size; a project keeps one name, one number and one card wherever it appears.
7. **Calm for everyone.** Reduced-motion visitors get every section finished and still; nothing plays
   sound on its own; everything works by keyboard.

---

## 3. Colour

Defined in `src/styles/tokens.css`. Light theme only.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#fffef2` | the page: warm cream stock |
| `--ink` | `#333333` | all text and line work |
| `--text-2` | `#5f5f5a` | secondary text, captions, labels |
| `--muted` | `#8a8a84` | large text only, on paper or stone |
| `--stone` | `#f6f3e8` | section tint (bands, Next project) |
| `--blush` | `#f7ecdd` | section tint (contact) |
| `--sage` | `#dbdecf` | section tint (credentials) |
| `--teal-ink` | `#252525` | the footer and dark bands (charcoal) |
| `--on-dark` / `--on-dark-2` | `#fffef2` / `#bdbcb2` | text on charcoal |
| `--line` | ink at 16% | hairlines |
| **`--accent`** | **`#ff9015`** | **brand orange 1495 U:** bars, marks, fills, the colour bar; orange words on dark grounds |
| **`--accent-text`** | **`#e06c00`** | **text orange:** orange words on light grounds |
| `--turquoise`, `--lime` | `#99d9d9`, `#cbe880` | corporate colours, used rarely (the figures of the logo in motion) |

### Orange rules
- **Marks** (bars, rules, the colour bar's spot, outlines, frames) use the brand orange `--accent`.
- **Words** in orange use `--accent-text`, set a weight heavier (500), and only at **display sizes
  (24px and up)**: it is 3:1 on the paper, enough for large text only.
- **Small text is never orange.** A small label that needs the accent stays ink and gets an orange
  mark beside or under it (the selected tab, a running head, the award tag's frame).
- **On the charcoal footer** orange words use the brand orange itself (it reads well on dark).
- **Never brown.** A deeper, duller orange (`#9c4f00`) was tried and rejected as reading brown.

### Contrast (on paper)
Ink 12.5:1 · text-2 6.3:1 · muted 3.4:1 (large only) · text orange 3.0:1 (large only) · brand orange
2.1:1 (marks only) · cream on charcoal 15:1.

---

## 4. Typography

**One family: Hanken Grotesk** (a free relative of Aesop's Suisse), for everything. Cormorant Garamond
appears in one place only: a quotation set alone.

| Style | Size | Use |
|---|---|---|
| `--fs-mega` | 36 → 60px | rare statements |
| `--fs-h1` | 30 → 44px | page and section headings |
| `--fs-h2` | 24 → 34px | sub-sections, case-study titles |
| `--fs-h3` | 19 → 23px | card titles, step titles |
| `--fs-lead` | 17 → 20px | standfirsts, lead text |
| `--fs-body` | 16px | text |
| `--fs-small` / label | 14px | captions, labels, running heads, meta |
| statements | up to 72px | About statement and chapters, set in display type |

- **Weights:** 400 for almost everything; 500 for emphasis, orange words and the selected state;
  **800 heavy capitals only for paper cuts** (letters cut through paper).
- **Sentence case.** Labels the Wix content supplies in capitals (menu, "VIEW PROJECT") display in
  sentence case (`.sc`); the stored copy is unchanged. No tracked capitals.
- **Hierarchy by space, not size.** Headings stay moderate; white space and hairlines do the work.
- **Figures:** lining figures in headings; tabular figures for counts, numbers and catalogue №.
- **Measure:** text up to about 68 characters (`.prose`); statements up to 24–30 characters per line,
  `text-wrap: balance` for headings.

---

## 5. Layout and space

- **Grid:** 12 columns on wide screens; content width up to 1440px (`--max`), side gutter 16 → 60px
  (`--gutter`).
- **Rhythm:** sections breathe at 64 → 160px (`--section-y`); spacing steps 4, 8, 12, 16, 24, 32, 48,
  64, 96, 128, 192px (`--s-1` … `--s-11`).
- **The paper:** every page ground carries the fibre (`--paper-tex`) and a faint blueprint grid
  (`--grid`: fine lines every 24px, stronger every 120px, centred). Bands, panels and pictures sit on
  it like sheets laid on graph paper. A held (pinned) section carries its own copy of the grid so the
  background never slides.
- **Corners are square** (cards, buttons, panels); only the award seals and the pointer disc are round.
- **Breakpoints in use:** 360 · 640 · 768 · 900 · 1024 · 1200 · 1280px. Phones are designed, not
  shrunk: one column, captions centred, larger cut lettering, scrolling tab rows.

---

## 6. The print devices (the signature system)

| Device | What it is | Where |
|---|---|---|
| **Crop marks** (`.crop`) | eight hairline ticks outside a plate's corners, instead of drop shadows | plates on Home, About, Services, paper cuts |
| **Catalogue numbers** | № 001 – 053, in the homepage gallery's order; a project keeps its number everywhere | cards, plates, "More in this service" |
| **Press marks** | "№ 001 – 053" and a printer's colour bar (CMYK + 1495 U) | homepage cover, About head, footer imprint |
| **Running heads** | section name left, folio right, on an ink hairline, a 4px orange bar under the name | Home sections, About chapters, Credentials |
| **Folios** | small page numbers (02, 03 …, 01 / 04) | running heads, service spreads |
| **Spreads** | two pages with a fold; every second one mirrored (verso) | Services |
| **Plates with captions** | picture whole, caption beneath (title in ink, client in grey) | everywhere work is shown |
| **Dot leaders** | contents-page dots to a count | Services contents, homepage services |
| **Paper cut** | words in heavy capitals cut through a sheet, a picture showing through, the cut casting a shadow | homepage Selected work cover; "NEXT PROJECT" at the end of each case study; 404 |
| **Colophon and imprint** | how the site is "printed"; legal lines with the colour bar | About; footer |

---

## 7. The orange accent system

- **Two-tone headings:** one phrase of a heading in the text orange, the rest in ink ("Write to
  **us**.", "How we **work**", "Our **story**", "Leaving a mark, **hand in hand**"; About's
  "**creative, thoughtful and impactful solutions**", "**faithful companion and trusted friend**",
  "**thinking made visual**"; the footer's "**intelligent creative solutions**"). One phrase per
  heading. The phrases live in `src/lib/accents.ts`; a test fails if one stops matching its copy.
- **Orange ampersands** in the service names (Branding **&** Identity).
- **Marker bars:** the selected category tab (4px bar on its top edge), the current page in the header
  (3px) and phone menu (thick underline), running heads (4px under the name), the leader line into
  "Write to us." ending in a short thick bar.
- **Figures and outlines** on About: the founding year outlined in orange, the chronology's ruler,
  the figures in orange.
- **Never:** orange body text, orange small labels, orange backgrounds behind text, more than one
  orange phrase per heading.

---

## 8. Imagery

- **The work is the imagery.** Project photography and films only; no stock, no illustration added.
- **Shown whole.** Pictures keep their shape where it matters (case studies are arranged by picture
  shape); cards crop to 4:3; nothing is written over a picture.
- **Texture:** a light film grain on photographs; crop marks instead of shadows.
- **Films** play muted and looping when on screen, stop when a visitor pauses them, never play under
  reduced motion; sound only when the visitor asks.
- **Client logos:** one ink colour (82%), each trimmed to its artwork and sized for equal visual weight,
  in an even grid; screen readers hear each brand's name.
- **Awards:** shown at one size, never overlapping or tilted; badges too small to read are named in
  text instead.

---

## 9. Components

| Part | Design |
|---|---|
| **Header (masthead)** | one row: sections left, logo centred, Contact right as the one framed action; condenses on scroll; current section marked orange |
| **Menu (phones)** | main pages first, categories folded under Projects; current page with a thick orange underline |
| **Footer** | charcoal; intro line (orange phrase), page links, contact, social marks (square, outlined), imprint line with the colour bar and Back to top |
| **Buttons** | rectangular with square corners, hairline-framed or filled ink, with an arrow |
| **Cards** | 4:3 picture, title, client, catalogue № at the right; award tag as ink text in an orange frame; a small paper disc follows the pointer over linked cards |
| **Category tabs** | All + 9 categories with counts; selected tab: orange bar on top, name heavier in ink; two rows of five on wide screens, one scrolling row on phones |
| **Case study** | hero, details (client · year · categories), the story arranged by picture shape (or a hand layout), case notes, the paper-cut Next project, Discuss a similar project |
| **Close** | "Write to us." with its orange leader line and one button, at the end of inner pages |
| **Logo wall, awards list, figures** | the "imprint" (Credentials) on sage |

---

## 10. Motion

Motion imitates what happens to paper and ink. It is scrubbed by scrolling, eased (`--ease-out`), and
never required to read the page.

| Moment | What moves |
|---|---|
| Home hero | the curved lens of ten projects drifts; cards can be dragged and clicked |
| Home Selected work | a paper sheet with "SELECTED WORK" cut through it slides away from the film |
| Home close | printed pieces spread from a pile; they can be picked up, dragged and reset |
| Services, How we work | one sheet goes through the press: brief, concept, plates coming into register, the finished, trimmed sheet |
| About | the chronology held as one stage while milestones turn; the logo's figures join hands; a sentence inks in |
| Everywhere | headings rise into place; plates are unveiled; running-head bars draw in |

**Rules:** holds (pinned sections) only for storytelling, never on index pages; the background never
slides during a hold; a press becomes a drag only after 6px so clicks still work; reduced motion and
no JavaScript show every section in its finished state.

---

## 11. Copy and labels

- Client copy verbatim; new wording marked Draft (`placeholder: true`) until approved, listed in
  CONTENT-QUERIES; the site itself shows no "Draft" marks.
- A placeholder that is an instruction ("[Draft] Two lines on…") is hidden until real words arrive.
- Sentence case for display; the stored copy keeps its own capitals.
- Short, plain labels: "Write to us.", "Next project", "Discuss a similar project", "Back to top".

---

## 12. Accessibility

Contrast as in §3 (orange words large only); visible focus outlines; every interaction reachable by
keyboard; decorative pictures and paper cuts hidden from screen readers while their words are said in
text; logos and seals named; reduced motion respected everywhere; no sideways scrolling at any width
(checked on every build).

---

## 13. Do and don't

| Do | Don't |
|---|---|
| Use the print devices consistently | Add drop shadows, rounded cards or gradients |
| Keep one orange phrase per heading | Set body text or small labels in orange |
| Show work whole, captioned beneath | Write over pictures |
| Let space and hairlines make hierarchy | Make headings huge to make them important |
| Give every logo and award equal weight | Let one brand or badge dominate |
| Hold the page only to tell a story | Put covers or holds on pages people use to navigate |
| Keep the client's words exactly | Rewrite copy to fit a layout |

---

## 14. Tried and set aside

Worth knowing so they are not retried by accident: a torn paper edge; a book-cover swing for the
projects cover; an orange projects cover (too bright); paper-cut covers holding /projects and the
category pages (in the way: replaced by the Next project and 404 paper cuts); National Gallery's heavy
black headline face; a deeper "brown" orange and an off-register shadow behind orange words; overlapping,
tilted award medallions; visible DRAFT tags; a hover-stop on the hero lens; category filter chips and a
catalogue view on /projects (replaced by the tabs).
