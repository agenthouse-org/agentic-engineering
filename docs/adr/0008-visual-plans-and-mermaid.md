# ADR-0008: Local visual plans and mermaid architecture artifacts

Status: accepted product direction, 2026-09-17. Local records, CLI check, and agent workflows are implemented. Hosted review UIs remain out of scope.

## Context

Frontend acceptance already verifies a real UI against an image, story, or bug. Design-stage evidence was still prose. Teams also need a Git-native way to review wireframes and ERD/UML before implementation, without a hosted renderer or account.

## Decision

Treat a visual plan as an optional Define/Design artifact. Wireframes are semantic HTML fragments with a declared fidelity (`wireframe`, `design`, or `prototype`). Architecture uses mermaid (`erDiagram`, `classDiagram`, `sequenceDiagram`, `stateDiagram-v2`, `flowchart`, C4). The plan JSON, hashed files, and work-record path `fields.visualPlan` are the source of truth; generated pictures are projections.

Acceptance contracts may use source kind `wireframe` with hashed references. `visual-plan check` validates structure, hashes, and mermaid kind. Ready gates evaluate a linked plan when present; they do not require one for every change.

Scoping and review skills ask a short visual-surface decision (wireframe, mermaid, both, neither) and stay decision-first unless the user requests more detail. No paid or hosted planning service is required.

## Consequences

Trivial work can skip visuals. UI and data-model work can produce reviewable Git artifacts before code. A sketch cannot silently become a pixel baseline. Specialist authoring may also be published in agenthouse-skills; enrolled projects use the framework command and skill. See [visual acceptance](../visual-acceptance.md) and [lifecycle](../lifecycle.md).
