# Text hidden on the Wix site (13 Oct 2026)

Achates built several Wix case studies by duplicating an existing page. On some, text they no longer
wanted was not deleted but coloured like the page (white on white, light grey on light grey), and
in one case also covered by a picture. Wix visitors never see it, but an import reads it like any
other text, so the new site showed it, most visibly Nötter's award list on the Singapore Road Safety
Campaign page.

**How we checked.** Every text block and picture on all 60 case studies was located on the live
Wix page in a browser (the three password-protected pages unlocked) and tested for being hidden,
off the page, covered by another element, or blank in a screenshot. Each flag was then checked by
eye. Seven text blocks are invisible on Wix; the other flags were false alarms (slideshow slides
waiting their turn, text under Wix's floating logo).

**What the site does.** `src/lib/visibility.ts` leaves out any text block whose colour is under
1.3:1 contrast with its page's background. It removes exactly these seven and nothing else; real
text on these pages is 2:1 or more. The imported content files are unchanged, so a block can be
shown again by giving it a visible colour.

| Page | Hidden text | Colour on page | Note |
|---|---|---|---|
| /singaporeroadsafetycampaign | "Nötter Nuts has won the following awards: Singapore Packaging Awards, NY DRIVENxDESIGN" | white on white, under a picture | Leftover from the Nötter page |
| /notter | The same award list | white on white | Nötter's own awards, hidden by Achates |
| /bank-julius-baer | "Chinese New Year Collaterals for Bank Julius Baer has won the HKG DRIVENxDESIGN Gold Winner 2021" | white on white | Award also shown as a badge image |
| /the-brooks-clown | "The Brooks Clown has won the HKG: DRIVENxDESIGN Gold Winner 2020" | white on white | |
| /building-memories-artbook | "Building Memories has won the A'Design Award 2017 Bronze Winner, …" | #f2f2f2 on #f2f2f2 | |
| /moving-memories | "Moving Memories has won the HKG: DRIVENxDESIGN Gold Winner 2018" | #f2f2f2 on #f2f2f2 | |
| /national-theatre-pop-up-kit | "Building Memories National Theatre pop-up kit Hong Kong Design Awards GOLD 2018" | #f2f2f2 on #f2f2f2 | The award is also stated in the visible text |

The six award lines are true and on the right pages; Achates may want some of them shown. See
CONTENT-QUERIES.md item 45.
