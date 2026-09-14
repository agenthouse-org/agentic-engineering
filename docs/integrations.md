# Integration contracts and coverage

> Design specification. A runnable 0.1.0 preview now implements part of this specification. See [implementation status](implementation-status.md) and [operating guide](using.md) for the exact shipped commands, configuration, and remaining work. Earlier proposed-interface examples below are not a compatibility promise.


Status: integration target. Instruction projections, executable evaluator integration, and the Playwright reporter are implemented. Native host certification and dedicated service connectors remain open.

## Coding agents

Targets are Claude Code, Codex, OpenCode, Cursor, Windsurf, and OpenClaw. Agenthouse is an execution layer, not an additional coding-agent installer target.

Track each adapter by agent version, operating system, installation scope, instructions, skill discovery, hook events, permission behavior, update/reload behavior, removal, and verification evidence. States are planned, implemented, fixture-tested, and verified in the actual host. Fixture-tested behavior alone must not be described as host-verified.

Agent features differ. A capability declaration identifies supported events and unavailable enforcement. Where hooks are unavailable, expose appropriate instructions and CLI/CI checks, and disclose the difference. Never represent advisory instructions as equivalent to a blocking control.


## Hook-runtime integration

Use agenthouse-hooks for normalized local events and handler execution. Keep policy meaning in generic rule/evaluation contracts; keep vendor JSON translation in the hook-runtime adapter layer. Avoid installing duplicate handlers when consumers already use agenthouse-hooks.

Its documented editor crash behavior allows continuation. Required technical gates therefore need a defined trusted boundary check and explicit failure semantics. Do not change the sibling runtime's behavior implicitly from this repository.

## Evaluation CLI and browser integration

Use the [CLI evaluation contract](cli-evaluation.md) for developer-triggered, agent-triggered, and pipeline evaluation. Support existing organization processes through registered executables with explicit arguments, input/output contracts, working directories, timeout limits, and exit-code mappings. Skills guide the agent; executable evaluators supply pipeline results. CI does not need to launch a coding agent to run deterministic checks.

Playwright is the initial optional adapter for real-browser journeys, capture, and visual regression. The [frontend acceptance method](visual-acceptance.md) also evaluates concept conformance against images or written requirements. Browser evidence, image comparison, semantic assessment, and governance decisions remain separate capabilities. A missing visual judge does not invalidate available browser evidence, but cannot silently satisfy a required semantic criterion.

## Work tracking

Local markdown and JSON exports are imported through `backlog`, preserving external IDs. Planned platform adapters are GitHub, GitLab, Jira, and Wrike. Code-hosting and work-tracking roles are separate even where a platform performs both.

Proposed contract operations include read item, map lifecycle state, create/update item, link evidence, request decision, and observe authorized decisions. Each adapter declares its supported subset, identity model, revision model, and write permissions. Workflows are discovered or configured per group rather than hardcoded as universal state names.

Do not enable automatic state transitions or external writes just by connecting a provider. These actions follow the group's policy and granted credentials. Writes need concurrency protection, idempotency, stable external IDs, and an explicit handling path for retries and partial failures.

## Documentation

Each group chooses its authoritative source. If it makes no choice, Git is authoritative and Confluence is an enhanced consumer layer. Other planned consumers/providers include GitBook, LaRecipe for Laravel, and repository-native documentation.

Confluence may enrich authoritative content with navigation, visual presentation, discussion, and clearly separated annotations. Record the source revision and publishing state. Proposed edits to authoritative content follow the selected change process; they do not silently become a second authoritative copy.

If an external documentation platform is selected as authority, preserve its stable document identity and revision in local snapshots used by agents and CI. Define what happens when that source changes, is unavailable, or removes a record. Groups can select authority by artifact class, provided each artifact has one declared authority.

Initial publishing should favor explicit one-way synchronization. Bidirectional synchronization requires a separate design for field ownership, conflicts, deletions, and review. An adapter that can publish pages is not automatically an adapter capable of hosting governance authority.

## Decision providers and optional services

A common decision request identifies the requested action, scope, policy revision, artifact revision, evidence, requester identity, required authority, and expiry. A response distinguishes allowed, denied, pending, and unavailable; it includes decision provenance and authority references.

Provider choices may include local policy evaluation, records in existing enterprise tools, a central repository workflow, a self-hosted service, or optional paid agenthouse REST/MCP services. The transport does not establish authority; providers must satisfy the same authorization and evidence requirements.

Potential paid services include centralized delegation/exception workflows, organization-wide policy rollout visibility, and cross-project decision audit. These are extension opportunities, not implemented features or mandatory dependencies. Core formats and local workflows remain open and exportable.

## Skills and stacks


Use frontend-acceptance as the agent-facing frontend acceptance method when work affects a UI; its display name in the framework is frontend acceptance. Extend reusable acceptance guidance upstream in agenthouse-skills rather than maintaining a fork here. Version 0.2.0 is published in the skills release-2026-09-13; existing installations can migrate now.

Other candidate optional skills are web-usability-conformity, skill-antivirus, and AI content disclosure where a consuming project's obligations call for them. Select skills by work and policy applicability; do not make every skill mandatory for every repository. Visual inspection alone does not establish accessibility conformity.

Initial stack modules are PHP/Laravel and Node.js/TypeScript. Modules declare applicable tooling, verification commands, examples, and compatibility. Framework adapters must inspect a consuming project's actual commands and configuration instead of assuming that every project in a language uses the same tools.
