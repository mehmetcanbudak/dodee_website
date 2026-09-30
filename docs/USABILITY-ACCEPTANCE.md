# Parent and caregiver usability acceptance

Prepared September 30, 2026. **Protocol ready; no representative participants have been recruited, contacted, or tested. All results and acceptance decisions below are pending.** Automated browser checks and an agent's visual review do not count as real-user sessions.

## Session setup

Run a 20–30 minute moderated session with 5–8 adult parents/caregivers from the intended audience. Include different levels of English confidence and digital familiarity, caregivers of children across the intended 0–4 age range, mobile-first users, and participants who normally use keyboard navigation or assistive technology where feasible. This is a small formative study, not a statistically representative population measurement. The chosen production edition is the root static site at [dodee-website.vercel.app](https://dodee-website.vercel.app). Use the verified release revision recorded in the [completion/release ledger](REMAINING-WORK-2026-09-30.md); do not assume a local change or pull request is already deployed. The React repository is a separate private alternative, not a second production candidate in this study.

Record the exact URL, source revision/build, device, browser, viewport/orientation, and whether external media is enabled. Use participants' normal mobile devices where possible and include at least one desktop keyboard journey. Explain that the website is being tested, not the participant; they can stop or skip any task. Obtain explicit permission before any recording. Use participant IDs; do not collect children's names, photos or contact details. Neither edition has a signup form or collects email addresses. Do not send an email, subscribe to a channel, post or purchase as part of a task.

Introduce the study neutrally: “Imagine you are looking for something to watch or do together with a young child. Please say what you are trying to do and what you expect to happen.” Do not explain the site structure or reveal the channel-update route before testing comprehension.

## Tasks and success criteria

| Task prompt | Observe | Proposed success criterion |
| --- | --- | --- |
| **Understand:** “Take a look at this page. What is this for, who is it for, and what can you do here?” | First impression; intended audience; whether free watching is understood; unsupported expectations. | Participant identifies Dodee as shared children's English content and a route to watch, without prompting, within 60 seconds. |
| **Watch:** “Find something you could watch together now.” | First click, scrolling, menu use, correct video/channel destination, new-tab understanding. | Reaches the intended video or official channel within 60 seconds without moderator direction; understands the move to YouTube. Record actual playback/captions separately from finding the link. |
| **Parent guidance:** “Find an idea you could try together after watching.” | Discovery of For Parents; reading/scanning; relevance and clarity. | Finds parent information and describes one concrete shared activity in their own words within 90 seconds. Ask what was missing; do not suggest an answer. |
| **Updates and privacy:** “Find out how to hear about new Dodee content. Before using any control, tell me what you expect it to do.” | Discovery of the YouTube update route; understanding of the external destination and absence of email collection; expectations after following the link. | Identifies the offered channel route and understands that this website does not collect an email address or create a subscription. Stops before changing a YouTube subscription or account setting. Any false belief that the site created a subscription or will send email is a release-significant finding. |
| **Play together:** “Try the color activity and tell me what happened.” | Labels, feedback, retries, reading order, whether activity invites co-play. | Can choose a color and interpret the result without help. Record confusion about daily answers or streaks without explaining the implementation. |
| **Contact:** “Find how you would ask the team a question. Stop before sending anything.” | Discoverability and confidence; correct contact route; accidental external actions. | Reaches the published contact/inquiry route within 60 seconds and can identify the next step. If contact ownership is unresolved in the tested build, treat this as a product limitation, not participant failure. |
| **Mobile or keyboard recovery:** “Open the navigation, change your mind, and return to what you were viewing. Then find the parent page.” | Opening/dismissal, focus, scrolling, touch target comfort, orientation/keyboard obstruction. | Completes the journey without a focus trap, hidden required action, lost position that prevents recovery, or moderator intervention. Use the participant's normal input method. |

The times are proposed diagnostic targets, not promises or researched benchmarks. Moderator assistance always counts as assisted completion. Let a participant continue beyond the target long enough to identify the obstacle; do not coach them merely to meet a threshold. For screen-reader users, record announcement and reading-order problems and allow realistic interaction time rather than comparing raw speed with pointer users.

## Neutral follow-up questions

- “What did you expect to happen there?”
- “What, if anything, made this difficult or unclear?”
- “Would you use this with your family? What would make it more useful?”
- “What information would you need before trusting this site?”
- “How easy or difficult was that task?” Use a 1–5 scale after each task, with 1 very difficult and 5 very easy.

## Capture and decision rule

For each participant/task, record completion as **unassisted / assisted / unsuccessful / skipped**, elapsed time, first-click destination, observed error or hesitation, ease rating, and a short anonymized quote if permission allows. Separate observed behavior from interpretation. Do not include identifiable family details in the report.

Proposed launch acceptance: at least 80% of attempted watch, parent-information and contact tasks complete unassisted; all participants who attempt the updates task understand the actual outcome; no critical navigation, privacy-comprehension or accessibility blocker remains. With a small sample, report raw counts alongside percentages. One serious barrier remains actionable even if the aggregate target passes. The product owner should agree these targets before recruitment and record any justified changes.

Prioritize recurring obstacles and any critical single incident, implement the agreed fixes, then repeat affected tasks with fresh participants where possible. Keep launch acceptance distinct from full accessibility conformance and physical-device coverage.

| Evidence field | Status |
| --- | --- |
| Chosen edition / URL | Root static site; https://dodee-website.vercel.app |
| Tested release revision | Record the verified deployed revision from the completion/release ledger before sessions |
| Agreed acceptance targets and owner | Pending |
| Participant IDs, number and relevant coverage | Not recruited |
| Session dates and permission records | Not started |
| Task outcomes and anonymized observations | No results |
| Findings, fixes and retest outcomes | Pending sessions |
| Owner decision and accepted limitations | No acceptance given |
