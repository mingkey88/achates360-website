# Achates 360 — design direction

The design of www.achates360.com as it stands: the idea, the rules and the parts, so anyone changing the
site keeps it one coherent thing. Present tense: this is how the site **is** designed.
The dated record of every decision and why it was made is [docs/DIRECTION-B.md](docs/DIRECTION-B.md).
How the site is organised: [docs/INFORMATION-ARCHITECTURE.md](docs/INFORMATION-ARCHITECTURE.md).
How it is built: [docs/BLUEPRINT.md](docs/BLUEPRINT.md).
Last updated 10 Nov 2026 (brought in line with the scrollytelling homepage of 2 Nov 2026: the curtain,
the stacked work cards, the sliding services; and with the joining figures and the Next project curtain
of 10 Nov 2026). Print devices were removed on 21 Oct 2026; the version before is git tag `print-v1`.

---

## 1. The idea: a calm, crafted studio across every medium

Achates 360 is an integrated creative studio: branding, campaigns, digital and social, film and
content, events, packaging and publications. The site presents that range with the quiet confidence of
a well-made thing, without leaning on any one medium. (Until 21 Oct 2026 the site was set as a printed
publication, with crop marks, folios, catalogue numbers and a colour bar; the studio moved away from a
print-led image, so those devices were removed and the elegance kept.)

- **Calm ground, one ink, one accent.** A plain warm off-white, dark grey ink, and the brand's orange
  (Pantone 1495 U) used sparingly and on purpose.
- **Words lead, the work proves.** Calm type, generous space, pictures and films shown whole and
  captioned beneath, never covered with text.
- **Accents with intent.** Orange marker bars, one orange phrase in a heading, selected tabs, a leader
  line into the close (after National Gallery Singapore).
- **Movement that serves the story.** Scrubbed by scrolling, eased, never decoration for its own sake.
- **One story on the homepage.** The homepage is told by scrolling: the film, the studio's sentence rising
  over it, the work as cards that stack, the services sliding past, the invitation to write.

**Personality:** quiet, assured, crafted, warm. A faithful friend and a thoughtful designer
(the studio's own line: *faithful friend • thoughtful design*).

**References** (their feel, not their code or images): Aesop (one quiet grotesk, cream and earthy
tints, sentence case, calm) · National Gallery Singapore (orange marker bars, two-tone headings, selected
tabs, leader lines) · Kitpro "Croma" (the closing scatter) · Aesop (the homepage hero: a film full-screen,
the words in a slim band at its foot) · yaas-energy.com (the homepage's scrolling story: the curtain, the
stacking cards, the sideways slide; its mechanics only, in this site's colours and pace).

---

## 2. Principles

1. **One studio.** Every page uses the same few devices (the orange bars, hairlines, captions); a
   visitor should feel one hand behind every page.
2. **The client's words, unchanged.** Copy is used verbatim. Design may choose which words are orange,
   how a sentence is set and where it sits; it never rewrites them. New wording is marked Draft until
   approved.
3. **Restraint makes the accent work.** Orange is meaningful because it is rare. If everything is
   orange, nothing is.
4. **Legible first.** Anything a visitor must read is ink on paper at a comfortable size. Colour and
   texture never cost legibility.
5. **Nothing in the way.** Index and navigation pages open straight on their content. Held, animated
   moments are for storytelling pages only (the homepage, About, How we work), never for pages people
   use to find things. The homepage holds three times (the hero, the work, the services) and no more.
6. **Equal treatment.** Client logos share one colour and one visual weight; awards are shown at one
   size; a project keeps one name, one number and one card wherever it appears.
7. **Calm for everyone.** Reduced-motion visitors get every section finished and still; nothing plays
   sound on its own; everything works by keyboard.

---

## 3. Colour

Defined in `src/styles/tokens.css`. Light theme only.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#fffef2` | the page: a plain warm off-white |
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
| **`--accent-text`** | **`#d66700`** | **text orange:** orange words on light grounds, large type only (3:1 or more on paper, blush and stone; was #e06c00, 24 Oct 2026) |
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
- **Figures:** lining figures in headings; tabular figures for counts and numbers.
- **Measure:** text up to about 68 characters (`.prose`); statements up to 24–30 characters per line,
  `text-wrap: balance` for headings.

---

## 5. Layout and space

- **Grid:** 12 columns on wide screens; content width up to 1440px (`--max`), side gutter 16 → 60px
  (`--gutter`).
- **Rhythm:** sections breathe at 64 → 160px (`--section-y`); spacing steps 4, 8, 12, 16, 24, 32, 48,
  64, 96, 128, 192px (`--s-1` … `--s-11`).
- **The ground:** plain `--paper`, no texture or grid (the paper fibre and draughtsman's grid were
  removed on 21 Oct 2026). Bands and panels sit on it in the section tints.
- **Corners are square** (cards, buttons, panels, fields). Round only: the award seals, the pointer disc,
  and the **curtain edges** of the scrolling story (§6): the top of the homepage panel that rises over the
  hero, the film's frame as it draws in, a work card as it recedes behind the next, and the foot of a
  case study as it lifts off the next project (28 to 32px). Nothing at rest is rounded on index pages.
- **Breakpoints in use:** 360 · 640 · 768 · 900 · 1024 · 1200 · 1280px. Phones are designed, not
  shrunk: one column, captions centred, larger cut lettering, scrolling tab rows.

---

## 6. Signature details

| Detail | What it is | Where |
|---|---|---|
| **Section heads** (`RunningHead`) | the section's name on an ink hairline with a 4px orange bar under it; an optional fact at the right (the studio's address, the years a story spans) | Home sections, About chapters, Credentials, case notes |
| **Captions beneath** | picture whole, caption under it (title in ink, client in grey) | everywhere work is shown |
| **Ruled lists** | rows on hairlines with a count at the right | Services list, categories |
| **Showreel** | the studio's reel looping silently, Play with sound opens the full film | Home (full-width, with View all projects beneath), Services (within the margins) |
| **Colour field** | large soft washes of brand orange and turquoise on stone, under a fine grain; decorative, pure CSS (`ui/ColourField.astro`) | Home: the studio's sentence, Write to us |
| **Curtain** | one sheet sliding over another, its leading edge rounded (32px) with one soft shadow under it: the only rounded edge and the only shadow at rest on the site | Home (the studio's sentence rises over the hero); case studies (the page lifts at its end to uncover the next project, which waits one screen high behind it) |
| **Stacked work cards** | four projects as full-screen cards that stack as you scroll; the card behind recedes (smaller, rounded, dimmed), only the front card plays its film | Home |
| **Joining figures** | the logo's five figures, in outline and apart, each stepping into the circle in a brand colour (orange, turquoise, lime) as one required part of the enquiry is filled in; all five joined when it is ready to send | Contact (above the invitation; beside the submit button on narrower screens) |
| **Leader line** | a line from the page's edge into "Write to us.", ending in an orange bar | the close of inner pages |
| **Paper cut** | words cut through a sheet with a picture showing through: kept as a single small signature | the 404 page only |

**Removed 21 Oct 2026 (do not reintroduce):** crop marks, catalogue numbers (№ 001 – 053), the
printer's colour bar and press marks, page-number folios, book spreads with a fold, contents-page dot
leaders, the colophon, the paper fibre and draughtsman's grid, the die-cut sheet over the homepage film
and the "NEXT PROJECT" paper cut. The site's code still orders projects by the homepage gallery
(`lib/catalogue.ts`); the numbers are simply not shown.

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
  shape); cards crop to 4:3; captions sit beneath. **Words go over a picture in two places only**, both
  full-screen and both on a shade at the picture's foot that keeps white text at 4.5:1 or more: a case
  study's hero (its category and title) and, on wide screens, the homepage work cards (number, name,
  client). On phones held upright the work cards follow the rule again: the picture at 4:3, its name
  beneath on the card's dark ground (a landscape picture stretched over a tall screen shows only its
  middle third).
- **Texture:** a light film grain on photographs; clean edges, no shadows or frames.
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
| **Footer** | charcoal; intro line (orange phrase), page links, contact, social marks (square, outlined), closing line with the legal lines and Back to top |
| **Buttons** | rectangular with square corners, hairline-framed or filled ink, with an arrow |
| **Cards** | 4:3 picture, title, client; award tag as ink text in an orange frame; a round ink "View" label follows the pointer over linked work |
| **Work cards (home)** | four full-screen cards, one per discipline, stacking; the name at the foot on a shade (wide screens) or beneath a 4:3 picture (upright phones), with the button to all projects held under them |
| **Service cards (home)** | number, name (orange ampersand), one 4:3 picture with its project's name beneath; up to three of the service's projects, shown one at a time as the visitor scrolls, none that the work cards already show |
| **Category tabs** | All + 9 categories with counts; selected tab: orange bar on top, name heavier in ink; two rows of five on wide screens, one scrolling row on phones |
| **Case study** | hero, details (client · year · categories), the story arranged by picture shape (or a hand layout), case notes, then the page lifts like a sheet to uncover Next project (one screen high: its picture, the name beneath, Discuss a similar project); the picture grows into the next case study's hero |
| **Contact** | the invitation and the direct lines beside the form on wide screens; boxed fields, square checkboxes, one solid button; the joining figures (§6) answer each part as it is filled in |
| **Close** | "Write to us." with its orange leader line and one button, at the end of inner pages |
| **Logo wall, awards list, figures** | the "imprint" (Credentials) on sage |

---

## 10. Motion

Motion is scrubbed by scrolling, eased (`--ease-out`), and never required to read the page.

| Moment | What moves |
|---|---|
| Home hero | the studio's hero loop plays silently under the solid header, filling the first screen above a slim band with the tagline and Discuss your project; Play with sound sits on the film and opens the full reel (pause control; holds on its poster under reduced motion). The page holds it while the studio's sentence rises over it like a curtain, the film drawing in to a rounded frame; the masthead logo's figures fly in and join as the page opens |
| Home work | the page holds while four full-screen cards stack, each sliding up over the last, which recedes |
| Home services | the page holds while the service cards slide sideways (wide screens); each card's picture steps on to the next of its projects with the scroll, never on a timer |
| Home close | printed pieces spread from a pile; they can be picked up, dragged and reset; the footer logo's figures join hands as it comes up |
| Case study end | the page lifts away to uncover the next project, held at the foot of the window |
| Contact | the logo's figures join hands, one for each part of the form filled in |
| Services, How we work | one artboard goes through the four steps: brief, concept, the logo's layers sliding into place, the finished lockup |
| About | the chronology held as one stage while milestones turn; the logo's figures join hands; a sentence inks in |
| Everywhere | headings rise into place; pictures are unveiled; section-head bars draw in |

**Rules:** holds (pinned sections) only for storytelling, never on index pages; nothing moves on a timer
except a film the visitor can pause (pictures that change, change with the scroll); the background never
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
| Use the signature details consistently | Add drop shadows, rounded cards or gradients beyond the ones named here (the curtain's edge and shadow, the receding work card, the colour field) |
| Keep the site medium-neutral | Bring back print devices (crop marks, folios, catalogue numbers, colour bars) |
| Keep one orange phrase per heading | Set body text or small labels in orange |
| Show work whole, captioned beneath | Write over pictures, except at the foot of the two full-screen moments (§8) |
| Let space and hairlines make hierarchy | Make headings huge to make them important |
| Give every logo and award equal weight | Let one brand or badge dominate |
| Hold the page only to tell a story | Put covers or holds on pages people use to navigate |
| Keep the client's words exactly | Rewrite copy to fit a layout |

---

## 14. Tried and set aside

Worth knowing so they are not retried by accident: the whole print/publication system (removed
21 Oct 2026, see §6; tag `print-v1`); a torn paper edge; a book-cover swing for the
projects cover; an orange projects cover (too bright); paper-cut covers holding /projects and the
category pages (in the way: replaced by the Next project and 404 paper cuts); the logo's figures as a
faint outline behind the contact form (replaced by the joining figures, 10 Nov 2026); work-card pictures
stretched over an upright phone's whole screen; one picture per service card (the same project showed
twice on the homepage); National Gallery's heavy
black headline face; a deeper "brown" orange and an off-register shadow behind orange words; overlapping,
tilted award medallions; visible DRAFT tags; a hover-stop on the hero lens, then the lens itself (replaced by the background film); category filter chips and a
catalogue view on /projects (replaced by the tabs).
