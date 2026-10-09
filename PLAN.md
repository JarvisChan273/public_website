# Public website plan

A public site with one entrance and two subsections. The entrance is the decision point. The subsections are the only two places a visitor can go.

## Recommendation

Ship one page first. The entrance states who the site is for and offers two doors. Each door is a subsection on the same page, with a stable address reserved for later:

| Place | Address now | Address later, if it grows |
| --- | --- | --- |
| Entrance | `/` | `/` |
| Services | `/#services` | `/services` |
| Notes | `/#notes` | `/notes` |

Contact sits on the entrance and is repeated at the end of each subsection. It is not a third destination.

This matches a short public site: a visitor understands the offer, picks work or reading, and can write in. Separate pages are a later cut, not a different product.

## Ideas

### 1. The lobby (recommended)

The entrance is a short statement and two doors.

- **Services** is fixed-scope advisory: SIEM cost, detection, and audit evidence, delivered remotely.
- **Notes** is public writing and small labs. It is the proof that the services page can point at. It never uses client or employer material.

Why this one: the site has to do two jobs, sell a defined service and show the work in public. Two subsections keep those jobs apart. A portfolio grid, an about page, and a blog would ask for content that does not exist yet.

### 2. The bare choice

The entrance is only the two doors, with almost no other copy. Services carries the offer. Notes carries the writing.

Use this if the entrance statement starts to repeat the services page. Do not start here. An empty notes page would make the whole site look unfinished.

### 3. Two languages as the two subsections

One door in English, one in Traditional Chinese.

Reject this for the first version. Language is a layer on both subsections, not a section of its own. English is the default because that is the language of the offer. A short Chinese line can sit under the entrance statement later, after the English page is live.

## What the first version contains

### Entrance

- Name: Jarvis Chan.
- One sentence: who it helps, what changes, and that the work is remote from Hong Kong.
- Two doors. Each door is a title, one sentence, and a link into that subsection.
- A short “how an engagement works” line: remote, fixed scope, usually two to four weeks.
- A contact form.

Working sentence, to be confirmed before publish:

> I help mid-size financial and regulated firms cut Splunk and SIEM cost and pass security audits. Remote, from Hong Kong.

### Services

A list, not a grid of icons. Each row has the package name, the outcome, and what the client leaves with. No hour counts on the page. Prices are either omitted or shown as “fixed price, scoped on a short call” until real numbers are chosen.

| Package | Outcome | What they leave with |
| --- | --- | --- |
| Splunk Health Check | A clear view of architecture and index cost | A written report and a prioritized fix list |
| Licence Cost Audit | Less wasted licence and less noisy data | A usage readout and a reduction plan |
| Detection Pack | Coverage mapped to real attacker behavior | A set of alerts plus the notes to run them |
| Migration Runbook | An upgrade or move with a way back | A plan, a rollback, and a rehearsal list |
| Firewall and DLP Review | A smaller, ordered rule set | A risk ranking and a cleanup route |
| Audit Readiness | Evidence a reviewer can follow | An access review, an evidence pack, and SOP templates |
| Advisory retainer | A named person for policy, risk, and an annual review | A monthly cadence and a written record |

Out of scope, said in one line: on-site work, and any promise that an audit will pass.

### Notes

Public writing and labs only. The first version may list topics that are not written yet, and it must label them as upcoming. It must not invent finished projects.

First topics, in the order they support the services page:

1. Where Splunk licence cost actually comes from.
2. A small detection lab with no production data.
3. What an audit evidence pack contains.

Each published note is a title, a date, a few paragraphs, and a link. A lab links to its own public repository.

### Contact

Fields: name, email, organization, which package (or “not sure”), and a message.

After a successful send, the form is replaced by “Sent.” and a control that returns to the entrance. The message goes to an inbox Jarvis reads. It is not stored in a spreadsheet in this repository.

## What this version leaves out

- A separate About, Portfolio, Blog, or Contact page.
- Placeholder projects presented as finished work.
- Client names, screenshots, logs, or anything from an employer.
- A biography, photo, or certification list until those facts are supplied.
- A second language, a newsletter, and a payment flow.

## How it will be built

Static files in this repository. No framework and no build step.

```
index.html     entrance and both subsections
styles.css     shared layout
script.js      menu, in-page links, form success state
```

GitHub Pages serves the repository root. The first public URL is the `github.io` address. A custom domain is a DNS change after the page is up, not a blocker.

The form posts to a hosted form endpoint (Formspree or an equivalent) configured with the public inbox. The endpoint key is a publishable form id, not a secret. There is no PHP or Node server and no Excel file.

Visual direction: paper and ink. Off-white background, near-black text, one accent color. The entrance sentence is the largest type on the page. Packages are rows. Notes are a short reading list. The layout works at a narrow phone width and at a desktop width. Navigation links are real buttons with a visible focus state.

## Build order

1. Confirm the entrance sentence, the public inbox, and whether any package shows a price.
2. Write `index.html` with the entrance, `#services`, `#notes`, and the form.
3. Write `styles.css` for the desktop layout and a width around 375px.
4. Write `script.js` for in-page links and the sent state.
5. Point the form at the inbox and send one real test message.
6. Turn on GitHub Pages from the repository root.
7. Read the live page on a phone-sized window and a desktop window. Check both doors, the form, and the return to the entrance.

## Done when

- The first screen is the entrance, and both subsections are reachable from it.
- Services lists only the packages above, with outcomes rather than hours.
- Notes labels anything unfinished as upcoming.
- A test message arrives in the inbox, and the page shows “Sent.”
- The page is readable at a narrow width and on a wide screen.
- The repository contains no client data, employer material, or inbox secrets.

## Open choices

- Public email address for the form.
- Show starting prices, or keep every price off the page.
- LinkedIn or other public profiles to link.
- Custom domain, after the `github.io` site is up.
- The entrance sentence, if the working sentence above should change.
