# Visual and frontend acceptance

> Design specification. A runnable 0.1.0 preview now implements part of this specification. See [implementation status](implementation-status.md) and [operating guide](using.md) for the exact shipped commands, configuration, and remaining work. Earlier proposed-interface examples below are not a compatibility promise.


Status: required product capability, 2026-09-13. The preview implements the Playwright reporter and visual evidence evaluator. The frontend-acceptance skill supplies the agent-facing method; the operating guide explains the executable contract and remaining work.

## Purpose

Verify that the real user interface fulfills its intended concept and behavior. A clean build, passing DOM checks, or an unchanged screenshot cannot by itself demonstrate that the requested outcome was delivered.

UI-affecting changes require applicable visual and behavioral evidence. Work without a UI impact can record a reasoned not-applicable result under project policy. Scope evidence to the affected journeys; do not require every screen to be retested for every small change.

## Three equally valid starting points

| Input | Derive acceptance from | Evidence of success |
| --- | --- | --- |
| Reference image or mockup | Identified reference revision, intended layout and hierarchy, component states, relevant visual constraints | Real screenshots in corresponding states, criterion-level findings, annotated comparison or overlay where meaningful |
| User story | Actor, goal, preconditions, actions, expected states, and observable visual/behavioral criteria | Browser journey plus screenshots proving those criteria; no reference image is necessary |
| Bug report | Reproduction steps, environment, actual versus expected behavior, and affected viewports/states | Reproduction evidence when possible, corrected behavior, before/after evidence, and a durable regression check |

Examples: an image shows a summary beside a form; a story requires the primary action to remain visible at 360px without horizontal scrolling; a bug says the validation message overlaps the submit button when a long address is entered. Each can produce a valid acceptance contract without inventing a mockup.

If inputs conflict, identify the conflicting criteria and follow the project's chosen authority/decision route. Do not silently treat a reference image as more authoritative than explicit accessibility or functional requirements. If a report cannot be reproduced, record that limitation; never fabricate a failing-before run. If wording is vague, propose concrete criteria and record assumptions or seek clarification according to the autonomy policy before claiming conformance.

## Versioned acceptance contract

Before implementation, capture the source work-item/document revision, reference image identifiers and hashes when present, affected journey, page/component, user state, fixture data, viewport, browser/environment, and criterion IDs. Each criterion declares the expected observable result, verification method, required/advisory status, and evidence needed.

Typical criteria cover layout and hierarchy, spacing, typography, content, color and states, clipping/overflow, responsiveness, loading/empty/error states, focus, and interaction outcomes. A written requirement such as "looks modern" is not a pass criterion until made observable.

For an image reference, record whether it is a wireframe, visual concept, or intended exact rendering. State allowed differences, reference crop/scale, and which elements matter. Do not treat a wireframe's placeholder colors as a requirement. Do not stretch or mask images to conceal defects.

## Four complementary checks

| Check | Question | Evaluation |
| --- | --- | --- |
| Concept conformance | Does the actual UI fulfill the approved design or written intent? | Criterion-based human or configured visual-agent assessment; geometric/style assertions where reliable |
| Visual regression | Did rendering change unexpectedly from an approved real-browser baseline? | Deterministic image comparison with declared tolerances and masks |
| Behavioral acceptance | Can the user complete the intended task, including relevant error cases? | Browser interactions and observable assertions |
| Accessibility | Does the changed journey meet its declared accessibility requirements? | Relevant automated checks and manual/agent assessments; specialist skill where applicable |

Playwright is the initial capture and visual-regression implementation target. Its screenshot assertions compare browser output to reference screenshots; they do not determine whether arbitrary prose or a design concept has been satisfied. Use concept conformance for that question. Raw pixel comparison to an exported mockup is optional and only meaningful when dimensions, content, and rendering expectations are aligned.

A regression baseline can accurately preserve a wrong design. Approve it against the acceptance contract before using it as the expected result. Passing regression must never substitute for outstanding concept or behavioral criteria.

## How agentic engineering uses the skill

The workflow and skill are both named **frontend acceptance**, using the identifier `frontend-acceptance` in agenthouse-skills. The source was renamed to remove an ambiguous acronym. Version 0.2.0 is published in agenthouse-skills release-2026-09-13; existing installations require migration to the renamed skill.

The reusable skill guides the agent to derive criteria, plan browser checks, implement, inspect screenshots, explain findings, and improve regression coverage. Framework code owns execution contracts, pipeline aggregation, policy resolution, and artifact provenance. Skill prose is not an executable CI evaluator. Reusable method changes belong upstream in agenthouse-skills. The rename changes naming and package identity, not the acceptance method.

1. Define: extract criteria from the image, story, or bug report and resolve material ambiguity.
2. Plan: select relevant states/viewports and evidence methods before changing the UI.
3. Implement: make the scoped change and exercise the real application.
4. Verify: run behavioral/accessibility checks, capture screenshots, compare applicable baselines, and inspect concept conformance criterion by criterion.
5. Accept: aggregate evidence through the common evaluation contract, obtaining any required governance decision separately.
6. Learn: preserve useful regression coverage; propose baseline/contract changes through the configured review route.

Use the same contract locally and in CI. When CI has already produced evidence for the identical artifact, environment, and contract revision, an agent can assess that evidence instead of redundantly recapturing it. Stale or mismatched evidence cannot satisfy the current gate.

## Capture and comparison controls

Fix browser/OS or runner image, fonts, viewport, device scale, locale, timezone, and test data as relevant. Record app build identity and readiness conditions. Control animation and volatile content. Declare masks and tolerances in reviewed configuration; they must not hide the behavior under test.

Store separate baselines where rendering environments differ. Full-page screenshots are appropriate when the whole page matters; component crops are preferable for localized checks. Responsive testing exercises meaningful breakpoint transitions and the specified extremes, not only one desktop screenshot.

Capture real UI states. A screenshot file's existence does not prove image inspection occurred. Reviewer records name the screenshots examined and the criteria assessed. AI assessment records evaluator/model configuration, method version, findings, and evidence references; a numeric similarity/confidence score alone is not a verdict.

## Results and approval

Return each criterion as passed, failed, not-assessed, or not-applicable, with evidence and a reason. The pipeline contract maps not-assessed required criteria to an incomplete result and permits not-applicable only with a valid policy-backed reason. Missing references, unavailable browsers, malformed images, or unavailable required assessment must never become success.

Deterministic checks can gate automatically. Semantic assessments may also satisfy a criterion where policy allows the configured evaluator; otherwise they remain assessments pending the authorized reviewer. No hosted AI service is mandatory. Offline teams can use available local evaluators or record authorized human assessment against the evidence. Absence of a permitted evaluator leaves the required criterion incomplete.

Baseline updates are separate from ordinary evaluation. Do not run automatic baseline acceptance in a validation job. New or materially changed baselines, masks, thresholds, and contracts follow the configured change/approval process. Revised criteria, reference images, app build, or affected baseline invalidate relevant prior acceptance.

## Evidence bundle

Include the contract and source revisions; commit/build ID; capture environment; original reference when applicable and permitted; actual screenshots; expected browser baseline and difference image where applicable; criterion results; browser assertions; assessment provenance; unresolved gaps; and the separate approval reference where required.

Provide an HTML report with reference/actual/difference views and criterion findings, plus machine-readable output via the CLI. When no image reference exists, show the story/bug criterion beside its screenshot evidence. Reference and actual evidence must remain inspectable rather than reduced to a single score.

Use synthetic or approved test data. Screenshot retention, access, and any external visual-provider transmission follow project policy. A CI integration must not upload images to a service merely because a visual check was enabled.

## Verification scenarios required for release

- A layout matching a reference passes its stated criteria; moving the primary action to the wrong region yields a specific finding.
- A story-only task proves its small-screen visibility criterion without a mockup; an overflow variant fails.
- A reproducible overlap bug produces real failing-before and passing-after evidence; an unreproducible case reports the limitation.
- An unchanged but conceptually wrong baseline passes regression and still fails concept conformance.
- A missing semantic assessment, browser failure, stale screenshot, and missing baseline cannot produce a passed required gate.
- Dynamic content is controlled without masking the affected UI; an unauthorized baseline/threshold update does not erase a failure.
- Equivalent local and pipeline runs preserve the same criterion IDs and evaluation semantics.

## Implementation reference

Playwright documents screenshot comparison, tolerances, and the need for consistent rendering environments in its [visual comparison documentation](https://playwright.dev/docs/test-snapshots). This supports the proposed adapter choice; it is not evidence that this framework already implements it.
