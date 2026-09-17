# Framework blueprint

> Design specification. A runnable 0.1.0 preview now implements part of this specification. See [implementation status](implementation-status.md) and [operating guide](using.md) for the exact shipped commands, configuration, and remaining work. Earlier proposed-interface examples below are not a compatibility promise.


Date: 2026-09-13. Product direction is confirmed through the decision records. This is the target architecture; the operating guide and implementation-status matrix identify the working 0.1.0 subset.

## Outcome

An enterprise development team or individual can enroll a repository once, use their chosen coding agents, understand the decisions governing their work, and carry a change from an intended outcome through operation and learning with evidence appropriate to its risk.

Organizations can distribute foundational architecture decisions, govern exceptions, and delegate approvals without creating a fork of the framework. Changing a coding agent or work tracker does not require rewriting the engineering process.

## Product boundaries

This is a complete agentic engineering framework, not an agent execution engine. It defines practices, records, policy composition, onboarding, verification interfaces, and integration contracts. Existing tools and optional services execute or coordinate work through those contracts.

The open-source core has no mandatory account, hosted decision service, telemetry endpoint, or proprietary backend. MIT is the framework license. Stack and platform specifics belong in optional modules.

## Component ownership

| Component | Owns | Relationship |
| --- | --- | --- |
| agenthouse-agentic-engineering | Lifecycle, policy composition, onboarding, evidence, distribution orchestration, integration contracts | This repository |
| agenthouse-skills | Reusable specialist methods, skill instructions, references, examples, and their versions | Consume identified releases; propose generic improvements upstream |
| agenthouse-hooks | Normalized local events, handler execution, and hook-specific vendor translation | Integrate through an explicit versioned contract |
| Organization policy repository | Foundational ADRs, mandatory policies, defaults, delegations, approved module selections | Private or public consumer-owned package |
| Team/project configuration | Workflow mappings, scoped decisions, evidence locations, stack choices | Consumer-owned data, preserved across upgrades |
| Optional decision provider | Resolving decisions under delegated authority, approvals, audit and coordination | Existing tools, self-hosted implementations, or optional paid REST/MCP services |

Framework-specific enrollment or lifecycle workflows may live here. General specialist skills belong upstream in agenthouse-skills. A copied skill is not a second editable source: a distribution may bundle a verified version for offline use, recording its source, version, digest, and license.

## Policy composition

The proposed resolution order is framework defaults, organization policy, delegated team policy, and project configuration. This is authority-aware composition, not unrestricted last-write-wins configuration. A project may specialize a default; it cannot silently weaken a mandatory inherited rule.

Generate a compact agent entry point from the resolved policy and link detailed decisions. Generated context is a projection, not the source of governance authority. A diagnostic view explains which source and decision established every effective setting. Personal preferences apply only where they do not conflict with project or organization policy.

Individual developers use framework defaults and project decisions without an organization layer. Enterprise consumers select an organization policy source and receive its defaults with minimal additional setup.

## Lifecycle and evidence

| Stage | Question | Typical evidence |
| --- | --- | --- |
| Discover | Whose situation should change, and why? | Outcome statement, baseline, constraints, success measure |
| Define | Does the proposed scope achieve the outcome? | Requirements, acceptance examples, exclusions, dependency and assumption register |
| Design | What choices and risks shape delivery? | Architecture decisions, interface contracts, threat analysis where applicable |
| Plan | Is the work ready and ordered sensibly? | Work items, dependencies, readiness assessment, verification strategy |
| Implement | Does the change fulfill the agreed scope? | Change set, test evidence, implementation decisions and provenance |
| Verify and review | Is the behavior correct and the evidence sufficient? | Automated results, independent assessment where required, resolved findings |
| Accept and release | Is the intended outcome accepted and delivery authorized? | Acceptance evidence, authorized decision, release record, rollback plan |
| Operate and respond | Does the result continue to work in use? | Service objectives, monitoring, incident records, recovery evidence |
| Learn and retire | What should change, and what should end? | Outcome evaluation, improvement proposals, superseded decisions, retirement record |

Stages are not a mandatory meeting sequence. A small reversible change may combine stages and use a short evidence record. High-impact changes can require separate reviewers and stronger gates. Scrum, kanban, and phase-based delivery map to the same lifecycle semantics.

Testing methods must fit the work. Behavioral changes should have explicit acceptance and regression evidence. Documentation, investigations, infrastructure, and operational work need suitable verification rather than an invented requirement for a failing unit test in every case.

## Frontend acceptance and pipeline evaluation

Visual acceptance is a first-class part of Define, Plan, Verify, and Accept for work affecting a user interface. Derive a versioned acceptance contract from reference images, well-written user stories, bug reports, or a combination. Capture the real application in the relevant states and viewports, assess each criterion, and retain linked evidence. An image is optional; observable criteria are required. Design conformance, visual regression, behavioral verification, and accessibility checks answer different questions and must remain distinguishable.

Optional Design-stage visual plans are Git-native: semantic HTML wireframes and mermaid ERD/UML. They are not a hosted review service. Ready gates check a linked plan only when `fields.visualPlan` is set. See [ADR-0008](adr/0008-visual-plans-and-mermaid.md).

Use the existing agenthouse-skills `frontend-acceptance` skill as the agent-facing frontend acceptance method. The skill identifier and display name now both use frontend acceptance. The renamed skill is published in agenthouse-skills release-2026-09-13; existing installations still require migration. Playwright is the initial browser capture/regression adapter, with an open contract for alternatives. See [visual acceptance](visual-acceptance.md).

The framework's CLI is a primary interface for DevOps integration, not a wrapper that requires an interactive coding-agent session. The same evaluation contract accepts built-in and organization-owned checks, executes or imports evidence, and produces structured results, human-readable reports, and reliable exit statuses. Existing CLI scripts can participate without being rewritten as skills. See [CLI evaluation](cli-evaluation.md).

## Common records

Proposed record types: outcome, requirement, acceptance contract and criterion, work item, decision, policy rule, exception, delegation, evidence, evaluation run and check result, assessment, approval, release, incident, and improvement.

Each record has a stable identifier, schema version, scope, authoritative source, and revision. References connect an outcome to its requirements, change set, evidence, approval, release, and observed result. Missing evidence is represented as missing or not measured; an agent must not infer success from a completed tool call.

An approval is bound to the specific action or artifact revision and applicable policy snapshot. Material changes invalidate or trigger re-evaluation of the affected approval. An assessment and an approval remain distinct even if the same interface displays them.

## Release scope

The target is complete lifecycle coverage, cross-platform distribution, and the six named coding-agent integrations. Delivery is incremental; planned modules and adapters are labeled planned until their acceptance criteria pass. The first pilots exercise an existing enterprise repository and an independent single-developer repository.

The [delivery plan](delivery-plan.md) defines the evidence required before this design becomes a usable release.
