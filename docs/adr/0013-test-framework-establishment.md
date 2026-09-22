# ADR-0013: Bounded test-framework establishment workflow

Status: accepted product direction, 2026-09-22. Implementation is planned in the linked lifecycle records.

## Context

`survey` discovers repository tooling, `module` supplies generic evaluator templates, and `evaluate` runs configured checks. Consumers still lack a safe path from repository evidence to a reviewed evaluator configuration, and a new test layer often needs an advisory period before it becomes a required gate.

## Decision

Add a bounded establishment workflow by extending the existing commands:

- `survey` reports evidence for the portable layers unit, component, integration, functional/API, end-to-end, regression, and contract. A coding agent may ask which layers and aliases the organization uses, then record a consumer-reviewed local mapping. Static signals can mark coverage as suspected nominal, but never prove behavioral value.
- `module` presents an interactive configuration diff and can save the same proposed target state as a versioned handoff artifact bound to the base configuration digest. Apply may add evaluator definitions, add selected checks to existing profiles, or create adoption profiles, but only for changes explicitly present in the reviewed diff/artifact.
- Monorepo evaluators use `tests.<workspace-key>.<layer>` identifiers and an explicit repository-relative `cwd`. Prefer the declared package/module/workspace name as `workspace-key`; otherwise normalize the repository-relative workspace path. If normalized keys collide, append a short digest of the canonical repository-relative path. The proposal records the original name/path so normalization is inspectable and deterministic.
- The initial staged-enforcement model uses named profiles and the existing per-check `required` flag. A repository-owner-authored comment or ADR can identify that the promotion milestone has been reached or deferred. That record is evidence of intent, not a signed governance decision. Promotion still occurs through a reviewed configuration, policy, or CI change under applicable authority.
- When a changed policy is detected during active work, report the new revision and affected checks, keep the active frozen snapshot unchanged, and ask whether the work should explicitly adopt the new snapshot. Noninteractive execution reports the mismatch and required action rather than choosing on the user's behalf.

No discovered repository command is executed by survey or module preview/apply. Missing tests remain missing, and technical results remain separate from governance approval.

## Consequences

No new top-level command is needed. The core owns portable result and configuration contracts; stack-specific detection remains in optional modules, and specialist test-authoring methods may remain in `agenthouse-skills`. Existing configurations and frozen snapshots retain their current meaning until explicitly changed.
