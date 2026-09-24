# Implementation and verification status

Version 1.3.0 uses central storage and explicit shared/private onboarding for new projects. See [central installation](central-installation.md) for context loading, migration, artifact classification and verification limits. Older project paths in examples apply to legacy installations.

Version 1.3.0 release line. Updated 2026-09-24.

Development checkout verification on Windows, 2026-09-23: 133 core/workflow/storage/artifact tests passed; the real baseline/broken/restored browser scenario, central usability pass/fail fixtures with screenshots, and package checks also passed. The upstream hooks suite (eight test files) was last recorded as passing on 2026-09-15.

| Capability | Shipped behavior | Verification |
| --- | --- | --- |
| Central storage | Versioned machine store; explicit shared/private integration; pinned context; legacy migration | Shared storage across projects, independent updates/rollback, offline restore, conflicts, private files, effective ignore checks and post-evaluation leaks |
| CLI and agent commands | 46 framework skills (45 generated plus lifecycle); plain-language picker descriptions and enrolled command catalog; every CLI operation has an ah-prefixed entry point; extended, host-specific and skill-aware help | Shared routing, help, installation, ownership, description and catalog tests |
| Repository survey and change analysis | Git, stack, scripts, agents, pipeline discovery; conservative test-layer evidence/gaps and nominal signals; local aliases; commit/range/merge-base analysis | Empty/multi-layer/nominal/alias fixtures, root commit, deletion and merge-base fixtures; no discovered scripts executed |
| Readiness and completion | Configurable fields, work-kind criteria, build/policy evidence, independent signed decisions; ready-gate `ticketSize` with override | Missing/stale evidence, self-review rejection, invalidated signatures; oversized criteria and sizeOverride tested |
| Specification evidence | Red/green capture with unchanged declared tests, criteria, command and policy | Real failing/passing subprocesses and drift rejection |
| Lifecycle and small changes | Full lifecycle plus configured shorter paths, eligible kinds and rationale; ask-first split work and `work branch` with repo `git.branchNaming` | Protected stages and invalid paths tested; branch naming render and clean-tree branch create tested |
| Backlog and review | Markdown/JSON import, retained external identity, criterion coverage, baseline outcome comparison | Idempotency, conflicts and stale evidence tested |
| Governance | Frozen policy composition, mandatory definitions, signed decisions and direct delegation | Conflict, scope, expiry, omitted-check and delegation tests |
| Control mapping | Rule provenance and explicit executable/guidance distinctions | Unenforced guidance is not reported as automated |
| Local hooks | Content-pinned agenthouse-hooks export; session context, command signals, touched-file checks; owned Claude settings installation/removal | Event fixtures, preserved permissions/settings, duplicate avoidance and conflicts |
| Skills and updates | Pinned frontend-acceptance 0.2.0 and web-usability-conformity 0.1.0 from agenthouse-skills | Commit/file integrity, pins, trusted updates and rollback; hook export pins included |
| Browser usability | Explicit locked runtime setup and upstream audit runner | Real Chromium clean/failing fixtures, failure exit 1 and desktop/narrow screenshots |
| Visual acceptance | Image/story/bug/wireframe contracts, concept review, Playwright capture and regression; housekeeping CLI for inspection captures | Missing/stale concept evidence; real baseline/broken/restored browser scenario; configured output, ignored baseline, indexed-file, explicit cleanup and Git-failure tests |
| Visual plans | Local visual-plan JSON, semantic HTML wireframes, mermaid ERD/UML lint, optional ready-gate check | Pass/fail/incomplete fixtures; shipped example plan |
| npm provenance | Inspect package.json and CI; write a missing GitHub/GitLab publish job for trusted or token provenance | Missing package, private package, overwrite refusal, repository mismatch, trusted vs token templates |
| Stack modules | Node/TypeScript and PHP/Laravel standards and templates; evidence-led preview/apply with diff, target-state handoff, stale-base/conflict safety, adoption profiles and deterministic monorepo IDs | Legacy template output, no-test degradation, preservation, CLI preview/apply and stale snapshot behavior tested |
| Marketplace packages | Claude and Codex manifests/indexes | Claude Code 2.1.270 validators passed; Claude and Codex 0.154.0-alpha.6.2 installed/enabled the packed plugin in isolated Windows profiles |
| Distribution | npm tarball, offline bundles, exact/latest tracking, npm signature/provenance verification, attested GitHub-bundle fallback, release-declared compatibility, recovery and rollback | Real npm 0.1.9 verification; mocked npm/GitHub fallback, exact identity, pins, breaking, managed-file conflicts, interruption and tampering tests; GitHub v0.1.9 correctly ineligible because it has no bundle asset |
| CI | Deterministic evaluator templates, optional artifact-only agent-review recipe, and future-release GitHub update-bundle attestation/upload | CLI exit/report tests; release-workflow contract test; browser/usability jobs included in repository CI |

Native live-session hook delivery and command discovery are not certified across all six hosts. Other agents can use the tested shared CLI and generated instruction projections. Local checks supplement server-side branch controls; the command matcher is not a shell sandbox.

Dedicated two-way service connectors, a hosted REST/MCP service and live enterprise rollout are not bundled. Existing organization processes can use command/JSON evaluators, local exports and signed decisions. No paid service is required.

The hooks export is a versioned, content-pinned contribution from agenthouse-hooks; no registry publication or Git commit is claimed for that export. Usability setup has a transitive npm lockfile. Fully disconnected setup also needs cached packages, a matching browser and its operating-system dependencies.

Cross-platform CI passed on Windows, Linux and macOS with both browser scenarios at a221109 ([run](https://github.com/agenthouse-org/agentic-engineering/actions/runs/34836151481)). Each new release must pass its own workflow before receiving the same verification claim. Consumer-specific policies, integrations and host behavior require an isolated pilot before cutover.

Exact-pin restore and owned generated-file ignore rules are implemented locally, with missing/edited/linked projection diagnostics. Tests cover recorded agents, cached and bundle sources, conflicts, preserved consumer state and interrupted transactions. Historical projection formats and Linux/macOS restoration require separate verification before claiming compatibility.

## Version 1.3.0 consumer-feedback changes (2026-09-24)

This version provides 45 generated commands plus the lifecycle skill. Published
availability is established separately by the GitHub release and npm workflow.

| Request | Implemented here | Remaining environment validation |
| --- | --- | --- |
| Feasibility | New skill, deterministic Git-blob occurrence inventory, classified counts, common scenario scale, hashed document/diagram summary and ready-gate linkage | Semantic completeness and real assessment-ticket pilots; literal search is not whole-program analysis |
| Plugin discovery | Existing packaged manifests retained; generated version markers, enrollment/pin routing instructions, explicit doctor plugin comparison, pinned local overlay documentation | Current-host global listing/search; doctor needs the invoking plugin version supplied explicitly |
| Evaluation clarity | Read-only --list/--plan, profile/build identity, evaluator module/file/rule origins in JSON/HTML | Existing consumer checks without origin metadata report project configuration rather than invented module provenance |
| Discovery | Compact lifecycle map, natural-language goal routing, administration in extended help, story-type follow-ups | Agent interpretation of unrecognized goals remains conversational |
| Incoming review | URL review orchestration skill, inspected disposable recipe contract, prose criterion proposals/confirmation, per-criterion outcomes, inherited-failure annotation, opt-in verify specification gate | Live providers, container provisioning/cleanup and tracker transition mapping are project/host responsibilities; no built-in service connector or automatic recipe runner is claimed |

Verification: all 139 Node tests passed on Windows; generated skill and release
allowlist checks passed. The report acceptance browser check passed at 390px and
1280px and the 390px capture was visually inspected: profile, module, source file
and rule are readable for both stack examples. Run
`node tests/browser/report-acceptance.mjs` to reproduce those captures.
