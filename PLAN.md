# Public website plan

A public site with one entrance and two subpages.

| Place | Page | Address |
| --- | --- | --- |
| Entrance | Who Jarvis Chan is, and the two doors | `/` |
| Background | Education, credentials, and the path so far | `/background` |
| Current learning | What he is studying now | `/learning` |

This revision replaces the earlier services-and-notes split. The site introduces Jarvis. It does not sell packages.

## Recommendation

Two real pages, linked from the entrance. Background is the record of what is already done. Current learning is only what is in progress.

The entrance is short. It gives the name, one sentence, and the two doors. A visitor who wants history opens Background. A visitor who wants the present opens Current learning.

## What the first version contains

### Entrance

- Name: Jarvis Chan.
- One sentence that points at both pages: the completed degree, and the study underway now.
- Two doors. Each door is a title, one sentence, and a link to that page.
- A way to reach him, once he chooses a public email or a public profile link.

Working sentence, to be confirmed before publish:

> Information engineering graduate, now studying financial technology and data analytics, with a focus on cybersecurity.

### Background

A short page, read from top to bottom. Dates are years, not a full CV.

**Education**

- Bachelor of Engineering in Information Engineering, City University of Hong Kong.

**Credential already recorded as obtained**

- ISC2 Certified in Cybersecurity (CC).

**Direction**

A few lines in his own words, once confirmed: cybersecurity, networking, fintech, data analysis, and machine learning. The old public-profile drafts say this. The live sentence should be the one he wants read now.

**Slots he fills before publish**

- Roles and organisations he is willing to name in public.
- Any other credential he wants listed as earned. Study that is still in progress stays on the learning page.

### Current learning

The top of the page is what is active. Older courses in the same degree sit underneath, in a shorter list, so the page still reads as “now.”

**Now**

| Item | What it is | Status on the page |
| --- | --- | --- |
| MSc in Financial Technology and Data Analytics, The University of Hong Kong | The degree in progress (FTDA) | Year 2 |
| FITE7407 Securities transaction banking | This term’s course: transaction banking, securities, custody, and regulatory reporting | In term |
| CISM (ISACA) | Certified Information Security Manager, exam study | Studying |
| Final-year project | 2026 project | Title still open |

**Also in 2026, confirm whether it is still active**

- Microsoft AZ-500. Listed among 2026 courses. The page names it only after the status is clear: studying, scheduled, or finished.

**Earlier in this degree**

Shown as completed coursework, under the current block, with the public course title:

- COMP7103 Data mining
- COMP7409 Machine learning in trading and finance
- FITE7409 Blockchain and cryptocurrency

These three titles are the public catalogue titles for those codes. The page also has room for the remaining first-year courses once their public titles are confirmed: the finance course filed as MFIN, the law course filed as LLAW, COMP7802, ECOM6016, and FITE7410C.

Each current item is a name, one sentence on why it is on the desk, and a status word. The page does not host lecture notes, past papers, or exam answers.

### Reach me

One line on the entrance: a public email, a public profile, or both. Messages are not stored in this repository. A form can be added later if the line is not enough. It is not a third page.

## What stays off the site

- Service packages, prices, and a consulting pitch.
- Placeholder jobs or projects written as if they were finished.
- Employer material, client names, logs, or screenshots.
- Lecture notes, past papers, and exam-prep writeups.
- A credential listed as passed when the record only shows that the course was studied.

## How it will be built

Static files in this repository. No framework and no build step.

```
index.html        entrance
background.html   background
learning.html     current learning
styles.css        shared layout
script.js         navigation state
```

The same header sits on every page: the name, and links to Entrance, Background, and Current learning. The current page is marked in the nav.

GitHub Pages serves the repository root. The first public URL is the `github.io` address. A custom domain can wait until the pages are up.

Visual direction: paper and ink. Off-white background, near-black text, one accent color. The entrance sentence is the largest type on the site. Background reads as a short biography. Current learning reads as a list with the active items first. Both pages work at a narrow phone width and at a desktop width. Navigation links are real controls with a visible focus state.

## Build order

1. Confirm the entrance sentence, the public contact line, which roles may be named, and the status of AZ-500 and the final-year project.
2. Write the three HTML pages from the sections above.
3. Write `styles.css` for the desktop layout and a width around 375px.
4. Write `script.js` so the nav shows which page is open.
5. Turn on GitHub Pages from the repository root.
6. Read the live site on a phone-sized window and a desktop window. Open both subpages from the entrance and return from each.

## Done when

- The first screen is the entrance, and both subpages are linked from it.
- Background contains the CityU degree, the CC credential, and only the work history he has approved.
- Current learning leads with the HKU MSc, FITE7407, and CISM, and labels the final-year project honestly.
- Earlier courses appear under the current block.
- Both pages are readable at a narrow width and on a wide screen.
- The repository contains no notes, past papers, client data, or employer material.

## Open choices

- The entrance sentence.
- Which roles and organisations appear on Background.
- Whether any studied-but-not-yet-certified item (PCNSA, CISSP coursework, AZ-500) appears, and on which page.
- The public title and status of the 2026 final-year project.
- Public titles for MFIN, LLAW, COMP7802, ECOM6016, and FITE7410C.
- The public email or profile link.
- A custom domain, after the `github.io` site is up.

## Where the enterprise exercise lives

The public pages stay the static files described above. The Cloudflare service exercise is in `platform/`, and the review that keeps it separate from these pages is in [docs/architecture.md](docs/architecture.md). The pages do not call that API.
