# Implementation and verification status

Version 0.1.4 developer preview. Updated 2026-09-14.

Local release checks: 64 core/workflow tests passed; real visual regression and usability pass/fail browser scenarios passed. The upstream hooks suite passed all eight test files.

| Capability | Shipped behavior | Verification |
| --- | --- | --- |
| CLI and agent commands | 38 framework skills; every CLI operation has an ah-prefixed entry point | Shared routing, help, installation, ownership and removal tests |
| Repository survey and change analysis | Git, stack, scripts, agents, pipeline discovery; commit/range/merge-base analysis; candidate tests and review signals | Root commit, deletion and merge-base fixtures; no discovered scripts executed |
| Readiness and completion | Configurable fields, work-kind criteria, build/policy evidence, independent signed decisions | Missing/stale evidence, self-review rejection and invalidated signatures |
| Specification evidence | Red/green capture with unchanged declared tests, criteria, command and policy | Real failing/passing subprocesses and drift rejection |
| Lifecycle and small changes | Full lifecycle plus configured shorter paths, eligible kinds and rationale | Protected stages and invalid paths tested |
| Backlog and review | Markdown/JSON import, retained external identity, criterion coverage, baseline outcome comparison | Idempotency, conflicts and stale evidence tested |
| Governance | Frozen policy composition, mandatory definitions, signed decisions and direct delegation | Conflict, scope, expiry, omitted-check and delegation tests |
| Control mapping | Rule provenance and explicit executable/guidance distinctions | Unenforced guidance is not reported as automated |
| Local hooks | Content-pinned agenthouse-hooks export; session context, command signals, touched-file checks; owned Claude settings installation/removal | Event fixtures, preserved permissions/settings, duplicate avoidance and conflicts |
| Skills and updates | Pinned frontend-acceptance 0.2.0 and web-usability-conformity 0.1.0 from agenthouse-skills | Commit/file integrity, pins, trusted updates and rollback; hook export pins included |
| Browser usability | Explicit locked runtime setup and upstream audit runner | Real Chromium clean/failing fixtures, failure exit 1 and desktop/narrow screenshots |
| Visual acceptance | Image/story/bug contracts, concept review, Playwright capture and regression | Missing/stale concept evidence; real baseline/broken/restored browser scenario |
| Stack modules | Node/TypeScript and PHP/Laravel standards, evaluator and touched-file templates | Module delivery tested; consuming projects select actual tools |
| Marketplace packages | Claude and Codex manifests/indexes | Claude Code 2.1.270 validators passed; Claude and Codex 0.154.0-alpha.6.2 installed/enabled the packed plugin in isolated Windows profiles |
| Distribution | npm tarball, offline framework bundles, signed/checksummed updates, recovery and rollback | Managed-file conflicts, interrupted transactions and tampering tests |
| CI | Deterministic evaluator templates and optional artifact-only agent-review recipe | CLI exit/report tests; browser/usability jobs included in repository CI |

Native live-session hook delivery and command discovery are not certified across all six hosts. Other agents can use the tested shared CLI and generated instruction projections. Local checks supplement server-side branch controls; the command matcher is not a shell sandbox.

Dedicated two-way service connectors, a hosted REST/MCP service and live enterprise rollout are not bundled. Existing organization processes can use command/JSON evaluators, local exports and signed decisions. No paid service is required.

The hooks export is a versioned, content-pinned contribution from agenthouse-hooks; no registry publication or Git commit is claimed for that export. Usability setup has a transitive npm lockfile. Fully disconnected setup also needs cached packages, a matching browser and its operating-system dependencies.

Cross-platform CI previously passed on Windows, Linux and macOS with the Linux browser job at 75d55bb. Each new release must pass its own workflow before receiving the same verification claim. Consumer-specific policies, integrations and host behavior require an isolated pilot before cutover.
