# ADR-0017: Ticket-level test authoring, roles, and CI pipeline management

Status: accepted product direction, 2026-10-02.

## Context

ADR-0013 establishes bounded survey and evaluator wiring. It deliberately does not generate meaningful application tests. Agents therefore write tests ad hoc; only red/green capture (`spec`) and evaluate evidence are governed. Consumers also lack roles for test design and DevOps-owned pipeline create/manage/publish, and survey layers treat browser journeys as end-to-end without a distinct interaction layer.

## Decision

1. **Ticket-level authoring (distinct from establishment).** Add lifecycle commands `test-plan` and `write-tests` that turn work-item acceptance criteria into a reviewable plan and then into new failing tests under repository conventions. Specialist judgment remains in agent skills; core persists structure and gates. This does not reopen ADR-0013’s rule that establishment must not invent a suite for arbitrary behavior.

2. **Work-record bindings.** Criterion→test links live on the work item as `fields.testPlan` (path to a versioned plan) and/or an embedded `testPlan` object. Evaluate reports and `specification` remain the proof that tests ran. Review and `gate --phase done` report applicable criteria with no linked test (plan item) separately from criteria that lack passing evaluate evidence.

3. **Methods, not dogma.** Each plan item declares a method: `tdd`, `characterization`, or `verify-after`. Organization standards (module standards and/or policy) choose which methods are allowed. When method is `tdd`, write-tests hands off to `spec --phase red` before implementation. Core does not mandate TDD for every change.

4. **Levels including interaction.** Portable survey layers gain `interaction` for user-visible UI journeys, distinct from API functional tests and from visual concept conformance (`frontend-acceptance`). Frontend/interaction criteria map to interaction or end-to-end plus optional visual-acceptance contracts.

5. **Roles.** Baseline roles `test-manager` (owns test plan quality and criterion coverage) and `devops` (owns CI create/manage/publish). Role guidance remains advisory and does not grant approval. Engineer continues to implement and may write tests under an accepted plan.

6. **Pipeline command.** Separate CLI `pipeline` with `status`, `create`, `plan`, `apply`, `jobs`, and `publish`. It creates and manages multi-job GitHub Actions / GitLab CI layouts for evaluate profiles and configures result publishing (artifacts; JUnit ingest where the host supports it). Evaluation generates reports; publication is pipeline’s job. Apply never silently overwrites consumer-modified workflows; it does not push to remotes. Authors of product tests never call `pipeline apply`.

7. **Hard constraints.** Do not weaken red-before-implementation for TDD items. Do not change how `spec` records evidence. Do not modify or delete existing tests without an explicit decision on the work record. Do not hard-code a testing philosophy in core.

## Consequences

ADR-0013 remains the establishment boundary. New commands and roles ship in core with schemas, skills, CI templates, and gate/review findings. Consumers pin a release that includes this ADR to use the capabilities.
