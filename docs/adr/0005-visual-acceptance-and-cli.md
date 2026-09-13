# ADR-0005: Visual acceptance and a primary evaluation CLI

Status: accepted product direction, 2026-09-13. Detailed interfaces are design proposals pending implementation.

## Context

Frontend correctness includes whether a concept was fulfilled, not just whether code builds or screenshots remain unchanged. The intended concept can be expressed through a reference image, a user story, or a bug report. Enterprise DevOps teams also need to evaluate their own engineering processes in existing CI/CD pipelines with minimal integration effort.

## Decision

Make visual and behavioral frontend acceptance first-class lifecycle and release requirements. Derive observable criteria from images or written requirements, exercise the actual application, inspect screenshots, and preserve criterion-level evidence. Distinguish concept conformance from baseline regression, behavior, and accessibility.

Use the existing frontend-acceptance skill as the agent-facing method, presented as frontend acceptance in framework documentation. The owner subsequently requested removal of the ambiguous acronym; rename the identifier to frontend-acceptance while preserving upstream ownership and the acceptance method. Version 0.2.0 was published in agenthouse-skills release-2026-09-13. Installed-consumer migration remains separate. Playwright is the initial browser capture/regression adapter, with alternatives permitted through an open contract.

Make a noninteractive evaluation CLI a primary interface shared by developers, agents, and pipelines. Support organization-owned executables alongside built-in evaluators. Produce reliable process statuses, structured/human-readable reports, and evidence bundles. Ship easy-to-adapt CI templates and support private/offline execution. No interactive coding agent or paid service is required for deterministic evaluation.

## Consequences

An absent image does not prevent visual acceptance; a precise story or bug report can supply the criteria. Passing regression cannot overrule failed concept conformance. Baselines and thresholds are governed inputs and cannot be silently rewritten to pass. Missing assessment and pending approval remain explicit.

Skills provide methods, executable evaluators run checks, and governance policy determines which evidence and approvals satisfy a gate. Existing organization scripts do not need to become skills. A running process or a stored screenshot is not by itself proof of successful evaluation.

See [visual acceptance](../visual-acceptance.md) and [CLI evaluation](../cli-evaluation.md) for the proposed contracts and acceptance scenarios.
