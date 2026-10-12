# Copy audit — Achates 360 staging (12 Oct 2026) — saved from copy-editor hand-back
(Full text was delivered in-session; key items preserved here.)

## Summary
1. Founding year conflict: /joinus "Founded in 2006" vs 2001 elsewhere/deck; /journal-of-aviation-management "since its launch in 2000".
2. "Tan Ping Chang" misspelling in title/client/2 /projects cards/home card; body says "Tan Ping Chiang".
3. Hidden white-text Nötter awards block duplicated on /singaporeroadsafetycampaign (item 7 only covers /notter).
4. Third phone "Tel: 6292 0492" on /building-memories-artbook & /the-brooks-clown (also wrongly for Farm Store, Huggs-Epigram); Abby "+65 8909 606" missing digit.
5. Stale copy: Ambrosia "till 15 February 2022"; Brook's Clown "will be launched", "until 30 Nov '19", S$44.90 incl GST; redpacket "$2.88", "this coming CNY"; home slide 6 "for 2025".
6. /redpacket client field = "keep your budget in the Green!"; ambrosia client "Publisher Achates 360".
7. Client/title variants across views (Ritz-Carlton, VP Bank, Samsung, Nokia, MANN+HUMMEL); Julius Baer and Charles Monat CNY share identical title.
8. ~45 typos ("an bespoke", "Donates would help", "Singapore Chinese Orchestral", "more edgier", "helped solved") + US spellings (changi, ritz superbrunch, ambrosia, redpacket).
9. Compliance: DBS "keep your investments safe", "without sacrificing returns", client results; "Singapore's leading creative agency" SEO; Grab "reaching millions", "fastest"; redpacket price/guarantee; Samsung sapphire claim.
10. Our drafts: "Get in touch" button duplicates footer line → "Make an enquiry"; unify "View all projects"/"All projects"/"All Projects" → "All projects"; "Let's connect and let's work together" → "Have a project in mind? Write to us."; stats 10+ awards (deck says 12) and 100+ clients unsourced; services.yaml titles should be deck's five headings (Strategic Branding · Advertising & Marketing · Publications · Digital Communications · Graphic Design).

## (A) Our draft strings — recommendations
connect-cta: Get in touch → Make an enquiry | contact-heading: keep "Write to us." | connect-line → "Have a project in mind? Write to us." | selected-cta → "All projects" (drop duplicated (49) count vs stat) | intro-cta "Learn more" → "About the studio" | featured-eyebrow shown twice on staging (eyebrow + heading) | services-cta → "Our services" | clients-eyebrow "Trusted by" → "Selected clients" | testimonials-eyebrow → "In their words" | role-sticker → "Open position" | meta-services "Services" → "Discipline" | nav-label "Site" → "Main" | menu-close "Back to site" → "Close menu" | awards-line normalised: "GDUSA American Graphic Design Award, 2016 · A' Design Award, Bronze, 2017 · Singapore Book Awards, Book of the Year, 2017 · HOW International Design Awards · The Paperweight Awards, Best of Show in Print, 2014" | stats: awards 12 (deck), clients 100+ remove or MD supplies, founded hold for item 26 | clients.yaml: brand names (Singapore Chinese Orchestra, VP Bank, Parkway Pantai, Konica Minolta, DBS, Kaplan, Samsung).
Builder fix: src/pages/services.astro and src/layouts/About.astro link href="/#contact" → "/contact".

## (B) New CONTENT-QUERIES items (numbering: Redesign section ends at 25; older clone section also has 26/27 → consider renumbering from 28)
26 Founding year 2001/2006/2000 · 27 Tan Ping Chiang spelling ("The Art of Tan Ping Chiang") · 28 Nötter awards hidden block on Road Safety page · 29 phone numbers/address in body copy (6292 0492; stockist numbers; Abby; "The Commerze@Irving" vs "The Commerze @ Irving") · 30 expired/time-bound copy (ambrosia, brooks-clown, building-memories stockists, redpacket, home slide 6) · 31 typos table (konicaminolta, samsung-connected-home, samsung-micro-led, samsung-the-freestyle, tan-ping-chiang, charles-monat-cny/christmas, sg5050 "Orchestral"/"National Trades Union Congress", idm-venture-capital, purple-sage, grab, the-v-edit, wedding, ritz superbrunch, road safety, changi, moving-memories, brooks-clown, ambrosia, kaplan, socialspace, bumitama, ritz kids guide, dbs-wealth-feed, notter title, about.md) · 32 client/brand name variants (Ritz-Carlton, St. Regis/Tea Room, MANN+HUMMEL, Nötter, Star Wars × Luzerne, WhatsApp, Little Thoughts Group, Lien Centre, Bumitama, Charles Monat Associates, AAS, Samsung entity, Konica Minolta entity, SG5050 client, Infographics, Achates 360 spacing) · 33 one project several titles (samsung-micro-led, nokia, samsung-tablets, ritz festive, charles-monat-cny == julius baer title, charles-monat-christmas, vpbank, dbs-cio-podcasts, dbs-sustainable, star performing arts, idm, ambrosia, building memories Art Book/Artbook, v-edit e-zine, jinho, bumitama 2021/2022, redpacket menu label, wedding "&", home "[Award Winning]" suffixes) · 34 dates (dash styles; no year on kaplan/the-skyline/idm; ritz kids © 2001 doubtful) · 35 US spellings · 36 award names conflicting (Building Memories Singapore Book Awards vs Singapore Art Book Awards; National Theatre HK Design Awards 2018 vs deck 2016; Nötter SPSA 2021) · 37 contact form labels ("Services you are looking at?", "Type Your Message here...", "Others ( Pls specify in message)", "Thanks for submitting!", Publication/Digital Marketing names) · 38 fields reading wrongly (redpacket client tagline, ambrosia client, "VIEW PROJECT" caps, "Apply Now", tonal one-offs) · 39 case-study SEO description errors (little-thoughts "cafe", national-theatre, tan-ping-chiang, uel "academic", the-skyline "in Singapore" (Phnom Penh), konicaminolta, samsung-micro-led, samsung-tablets, dbs-wealth-feed, dbs-cio-podcasts, grohe-quarterly title; typos "Achates360,Singapore's", "MosaicMagazine", "Heart felt", double spaces, "Green!Swift") · 40 duplicated paragraphs (Charles Monat intro, VP Bank/BoS greeting, card blurbs, high-net-worth hyphenation) · 41 claims needing substantiation (see 9) · 42 /joinus posting muddled (two levels, self-reference, experience range, undated, 2006).

## Typos and grammar, page by page (CONTENT-QUERIES 33)

All of these are in `src/content/projects/` unless another file is named.

| Page | Current | Suggested |
|---|---|---|
| konicaminolta | "create a pack WhatsApp stickers" / "big head大头" | "a pack of WhatsApp stickers" / "big head (大头)" |
| samsung-connected-home | "retails stores" | "retail stores" |
| samsung-micro-led | "an bespoke" / "As the MICRO LED TV as access to" / "Each kit was highly personalised to the recipient also had laser etching… for uniquely named set." | "a bespoke" / "has access to" / "Each kit was personalised, with the recipient's name laser-etched on the easel." |
| samsung-the-freestyle | "latest portable 180 degree portable SMART projector, The Freestyle will…" | "latest portable 180-degree smart projector. It will…" |
| the-art-of-tan-ping-chiang | "for this 80th birthday" / "initiated to support this publication's making" / "comprising of" / "favourite sculpture" / "37 original proses" / "by Achates360" | "his 80th birthday" / "initiated the publication" / "comprising" / "sculptures" / "37 original prose pieces" / "Achates 360" |
| charles-monat-cny | "for their clients' to have" / "the finesse of the Crane" | "for their clients to have" / "the crane" |
| charles-monat-christmas | "Donates would help build" | "Donations would help build" |
| singapore-conference-hall-sg5050 | "Singapore Chinese Orchestral (SCO)" / "National Trade Union Congress" | "Singapore Chinese Orchestra (SCO)" / "National Trades Union Congress" |
| idm-venture-capital | "aspired entrepreneurs" / "Interesting Illustrations" / "compliment slip" | "aspiring entrepreneurs" / "illustrations" / "compliments slip" |
| purple-sage | "began since their inception" / "the primarily logo" | "began at their inception" / "the primary logo" |
| grab-brand-app-campaign | "has helped solved" | "has helped solve" |
| the-v-edit-e-zine | "making it more edgier" / "at all season" / "products/ contents" | "edgier" / "in every season" / "products and content" |
| wedding-invitation-wedding-favours | "red packets also comes" / "initial of V&J" (the client is "Jowyne & Vernon") / "Birthdays" | "come" / confirm the initials' order / "birthdays" |
| the-ritz-carlton-superbrunch | title "‘SuperBrunch'" (mixed quote marks) / "was  set" (double space) / "a under construction sign" / "scarfs" / "Ritz-Carlton Singapore signature" | "‘SuperBrunch’" / "was set" / "an ‘under construction’ sign" / "scarves" / "Ritz-Carlton’s signature" |
| singaporeroadsafetycampaign | "culminated half a million pledges" / "island wide" | "gathered half a million pledges" / "islandwide" |
| changi-airport-group | "cumulate" / "Movie star portfolio… Movie posters" / "ticket stubs stickers for each event participated" | "accumulate" / lower case / "ticket-stub stickers for each event attended" |
| moving-memories | "#Moving Memories\_SG" (shows with a space) / "80 years history" | the real hashtag (probably "#MovingMemories_SG") / "80-year history" |
| the-brooks-clown | "a one of-its-kind" | "a one-of-a-kind" |
| ambrosiaforthepeople-hawkercentrefood | "a helpful guide of hawker you can visit" / "Held in conjunction by Venice Biennale and Achates 360" | "a guide to hawkers you can visit" / rewrite (the talk was organised by the Singapore Pavilion) |
| kaplan | "greeted at almost every direction" / "Post Graduate" / "a campaign we collaborated with Kaplan" | "in almost every direction" / "Postgraduate" / "a campaign we created with Kaplan" |
| socialspace | "Guests of Honours" / "half yearly" / "client requested" | "Guests of Honour" / "half-yearly" / "the client requested" |
| bumitama-annual-report | "an agricultural look for a fresh look" | "a fresh, agricultural look" |
| the-ritz-kids-programme-guide | "aged between 4-12" / "all imageries" | "aged 4 to 12" / "all imagery" |
| dbs-wealth-feed | "explained concepts in a layman way… explain complicated financial topics into short bite-sized reads" | "explained concepts in plain language… turned complex topics into short reads" |
| notter (title) | "Notter Nuts packaging" | "Nötter Nuts Packaging" (see item 34) |
| basic/about.md | "Since starting in 2001, we were privileged to have collaborated" / "the customers’ needs" | "Since 2001, we have been privileged to collaborate" / "our clients’ needs" |
