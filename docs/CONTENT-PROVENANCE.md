# Content provenance and publication checklist

Reviewed September 30, 2026. This record documents the evidence behind current product choices; it does not certify future external availability or replace the owner's approval of brand material. Current implementation and verification results are in [the audit](AUDIT-2026-09-30.md) and [remaining-work ledger](REMAINING-WORK-2026-09-30.md).

## Current product scope

The root static website is the default production implementation. The React/Vinext implementation in `sites/dodee-next/` is a separate repository and an alternative implementation; keeping it locally verified does not make both editions canonical.

| Public feature | Evidence and current behavior |
| --- | --- |
| Videos and channel | The supplied teaser and channel URLs are the only video release facts used. The [source-check record in the React edition](../sites/dodee-next/docs/CONTENT-PROVENANCE-2026-09-30.md) documents the public YouTube lookup. A channel link is a viewing action, not proof of an inbox, a release schedule, or a sponsorship. |
| Parent guidance | Informational content and channel links. No email address, parent name, or child age is collected; no newsletter delivery or unsubscribe promise appears. There is no hidden signup backend. |
| Daily color game | A local game that chooses one color for each Istanbul calendar date. Optional streak/date storage stays in the visitor's browser. This is separate from the completed clue campaign. |
| Mystery clues | An explicitly archived April 10–22, 2026 campaign. Dates come from the original `js/campaign.js` configuration; the 13 original clue strings remain in `data/clues.json`. The current archive is ordinary HTML, has no guess field or network request, works without JavaScript, and cannot reactivate when the client's clock changes. These source records do not establish public episode availability or a new campaign. |
| Partnerships | General partnership information only. Named partner cards, relationship claims, and logos are not displayed without evidence of the current relationship and permitted artwork usage. Original source assets remain intact. |
| Contact and press | No mailbox is presented as working without verification. Where no direct contact method is published, the page states that limitation and offers the verified video channel as a separate viewing action. No message delivery, press-kit download, response-time, or partnership-deck promise is made. |
| Historical design audits | `FIGMA-HOME-AUDIT.md` and the React edition's older audit preserve historical findings. Their old measurements, scores, and former form behavior must not be described as current verification. |

## Evidence needed before changing public claims

The September 30 public lookup of [YouTube's teaser oEmbed response](https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DtHlpVMTYDhg&format=json) returned the title `Dodee & Onur | Teaser`, author `Dodee`, and the exact linked channel `https://www.youtube.com/@Dodee-Our-Buddy`. That establishes the teaser/channel association at the time of the check, not a permanent availability guarantee.

At the same check, `dodeeourbuddy.com` returned a Squarespace “Coming Soon” page with no published contact information; its DNS lookup returned no MX answer. Neither result proves that any proposed `hello@` or `press@` address is owned or receives mail, so those addresses are omitted from public pages. See the linked source-check record for the verification details and limits.

The current reduced product scope does not require these additions. If the owner elects to introduce one, record the evidence and complete its specific checks before publishing it.

- **A contact address:** obtain the owner's exact approved inbox, verify that it can receive mail through an owner-authorized test, and document which requests it handles. A registered domain or DNS record alone does not establish mailbox ownership or successful delivery.
- **An email subscription:** obtain the provider/account and consent requirements, implement a real server-side flow, and test delivery, failures, abuse controls, duplicate handling, and unsubscribe behavior. Update privacy text to the actual processing. Do not restore a local preview as a production signup.
- **A partner identity or logo:** retain written confirmation of the relationship, approved public wording, applicable dates, exact approved artwork, and publication permission. A brand mention or historical social post does not establish every one of those facts.
- **A new episode or launch date:** retain the authoritative channel/release URL and publication date. A planned date in old source is not proof that a video is live.
- **A new clue campaign:** obtain an approved schedule, timezone, clue content, and owner. Treat it as a new feature with before/during/after tests; do not turn the historical archive into a new campaign by changing dates alone.
- **A press asset or quotation:** retain the original source, author/publication/date where relevant, exact permission scope, and the actual downloadable file before advertising a download.

## Infrastructure intentionally not required

The static product has no account system, protected route, database, subscription transport, or write API. It therefore needs no newly provisioned auth service, D1 database, R2 bucket, or email account.

The alternative React implementation retains an empty database schema, an unmounted D1 example under `examples/d1/`, and an optional auth helper that current routes do not import. Optional bindings and helpers are not product requirements. Activating a future feature would require its own authorization, data model, privacy behavior, and deployment validation; no credentials, memberships, or provider resources should be invented to make an unused example look complete.

## Release review

- Run `npm run check` at the root and the browser checks documented in [STATIC-BROWSER-QA.md](STATIC-BROWSER-QA.md).
- Confirm the selected production origin and deployment target before publishing; keep the alternative edition noncanonical unless deliberately selected.
- Inspect rendered metadata as well as body copy for newly introduced contact, partner, episode, and signup claims.
- Recheck any external destination changed for a release, using a public authoritative source where possible. Record failures as unknown rather than assuming the destination works.
- Keep local test results distinct from deployed verification, actual video playback, physical-device checks, and human assistive-technology acceptance.
