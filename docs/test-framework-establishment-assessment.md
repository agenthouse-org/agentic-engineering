# Existing-repository test framework establishment assessment

Status: scope assessment, repository-owner decisions, and working-tree implementation completed 2026-09-22. This document does not approve a release or change an enrolled repository's policy.

## Recommendation

agenthouse should add a bounded capability for **assessing and connecting an existing repository's test machinery**, not a promise to create a complete test framework for any stack.

The capability belongs in the current surface:

- Extend `survey` with evidence-based test-layer reporting. A new top-level command would duplicate repository discovery and force consumers to learn an artificial boundary.
- Extend `module` with a deterministic preview-and-apply configuration flow. This closes the concrete gap between a generic template and a configured evaluator while keeping execution in `evaluate`.
- Use existing named profiles and the per-check `required` flag for the first advisory-to-required adoption path. Promotion is an explicit configuration or CI change. Do not add time- or milestone-triggered policy state until its authority semantics are decided.
- Leave `spec` and `gate` unchanged for this slice. They already cover ticket-specific red/green evidence and protected lifecycle decisions.

The related consumer request for a floating `latest` preference is valid but is a separate update/distribution slice. ADR-0012 records npm-first discovery, verified GitHub fallback, release-declared compatibility, organization-overridable channel membership, exact runtime resolution, and frozen-evaluation isolation. ADR-0013 records the bounded test-establishment decisions.

## Explicit boundary

This capability does:

- inspect committed and working-tree repository evidence without running discovered commands;
- report evidence, absence, ambiguity, and suspected nominal coverage by a documented layer taxonomy;
- let a human adapt and review an evaluator/profile proposal before an explicit, conflict-checked apply;
- run only explicitly configured evaluators when the human later invokes `evaluate`;
- support an explicit advisory profile and a separate required profile;
- preserve the distinction between technical results, assessment, and governance decisions.

This capability does **not**:

- choose the repository's testing strategy, quality target, or risk appetite;
- install or replace a test runner, dependencies, fixtures, services, browsers, or CI platform;
- generate meaningful unit, functional, integration, regression, or ticket tests for arbitrary application behavior;
- execute package scripts, binaries, pipeline steps, or commands merely because survey or a module discovered them;
- prove assertion quality, behavioral relevance, mutation score, coverage, or absence of defects from static file signals;
- fabricate a baseline, mark a missing layer not-applicable, waive a failure, promote a profile, or create a signed decision;
- make a locally selected profile into a trusted branch gate; the consumer's CI/platform control remains responsible for invoking the required profile;
- encode a calendar date or tracker milestone that silently changes enforcement;
- change `spec` or `gate` in this slice;
- make stack-specific testing knowledge part of the organization-independent core when it belongs in an optional module or specialist skill.

## Work records

The proposed records use the repository's lifecycle JSON format:

| Work item | Slice | Surface and compatibility cost | Status |
| --- | --- | --- | --- |
| `floating-latest-update-channel` | Consumer-selected moving stable channel with exact resolution | CLI update/session behavior, update-policy schema, distribution docs, ADR-0012; high trust and compatibility cost | Implemented and locally verified; requires a subsequent release |
| `survey-test-layer-gaps` | Read-only layer evidence and gap analysis | CLI output, local mapping configuration, and module detector contract; additive output, no governance-policy change | Implemented and tested |
| `module-evaluator-wiring` | Interactive diff and versioned target-state handoff artifact to safe project-config apply | CLI and project-config merge behavior; frozen snapshots intentionally become stale until explicit resolve | Implemented and tested |
| `test-enforcement-adoption-profiles` | Advisory and required uses of one evaluator, owner milestone/defer record, active-work policy warning | Module-generated config, CLI/session diagnostics, docs, and agent-skill guidance; existing evaluator/profile schema is sufficient | Implemented and tested |

There is no skills-only implementation item in this set. Skills should explain and orchestrate the CLI behavior, but placing discovery, configuration mutation, or gate semantics only in prose would leave CI and non-agent consumers without the capability. Test-authoring methods for a particular stack may be proposed to `agenthouse-skills`; they are outside these core records.

## Resolved decisions

### Update channel (`OQ-UPDATE-1` through `OQ-UPDATE-4`)

- Use npm `latest` as the primary public discovery source and GitHub Releases as fallback.
- Treat npm as trusted only after expected package identity, registry integrity, and available registry signature/provenance verification succeed. The dist-tag selects a candidate; it is not by itself proof. GitHub fallback must use an immutable release asset with verified release/artifact attestation and must not weaken verification.
- Use release-declared compatibility, including before 1.0.
- Default to stable `latest`; organization update policy may change channel membership and source precedence.

### Test-layer survey (`OQ-TEST-1` and `OQ-TEST-2`)

- Use unit, component, integration, functional/API, end-to-end, regression, and contract as the portable vocabulary.
- The coding agent may ask which layers and aliases the organization uses and retain a consumer-reviewed local mapping. This local choice does not change the vocabulary for other repositories.
- Empty files, skipped-only suites, no apparent assertions, and unconditional-success scripts may produce `suspected-nominal` with the triggering evidence and false-positive limitation. They never establish semantic inadequacy by themselves.

### Evaluator wiring (`OQ-WIRE-1` through `OQ-WIRE-3`)

- Present an interactive diff. The handoff artifact records that same target state, proposal version, and base-configuration digest so another session can apply exactly what was reviewed.
- Apply may add evaluators, add selected checks to existing profiles, and create adoption profiles, but only when those mutations are explicitly selected and shown in the reviewed diff/artifact.
- Use an explicit repository-relative `cwd` and `tests.<workspace-key>.<layer>` evaluator IDs. Prefer the declared package/module/workspace name for the key; fall back to a normalized repository-relative path; append a short digest of the canonical path on collision. Retain the original name/path in the proposal so the mapping is inspectable.

### Staged enforcement (`OQ-STAGE-1` through `OQ-STAGE-3`)

- The repository owner records that the milestone was reached or deferred in a comment or ADR.
- That comment/ADR is intent evidence, not a signed governance decision. The repository owner initiates or accepts the reviewed configuration, policy, or CI promotion under applicable authority and may defer it.
- A new policy/configuration revision applies to future sessions by default. Active work keeps its frozen snapshot, warns the user with the changed revision and affected checks, and asks whether to adopt the new policy. Noninteractive work reports the mismatch and required action instead of choosing.

## Implementation notes

The implementation uses `testing.layers`/`testing.aliases`, `tests.<workspace-key>.<layer>`, an eight-character collision digest, npm CLI signature/provenance verification, and GitHub CLI artifact-attestation verification. These choices are documented and tested and do not reopen the product boundary.

## `/ah-validate-scope` result

### Decide

1. **Does this set hit the outcome?** **Yes for a bounded establishment workflow**, provided the open decisions are answered. It does not and should not claim to create a complete test framework for any repository.
2. **Must-have versus later:** Must-have is additive survey evidence, safe evaluator wiring, and explicit advisory/required profiles. Floating latest is independently valuable and can proceed in parallel after its trust decisions. Automatic milestone-driven enforcement, semantic test-quality scoring, runner installation, and generated tests are later or out of scope.
3. **Visual plan:** Neither. These are CLI, schema, and lifecycle-contract changes; acceptance fixtures and state-transition tests are more useful than a wireframe or architecture diagram.

### Coverage

The four records cover discovery, reviewed configuration, evaluation adoption, backward compatibility, no-execution safety, honest empty-repository behavior, governance separation, and consumer update intent. `spec` and `gate` remain available for the per-ticket red/green loop without being pulled into the establishment slice.

### Implemented sequencing and remaining release work

1. The additive survey contract, local taxonomy mapping, nominal signals, and fixtures are implemented.
2. Interactive diff/handoff, selected profile mutations, deterministic monorepo identities, preservation, stale-base rejection, and frozen-snapshot behavior are implemented.
3. Adoption profiles, owner milestone/defer references, deferred-profile incomplete results, and active-work policy-change reporting are implemented.
4. npm-first/GitHub-fallback verification, release compatibility metadata, organization channel configuration, and exact/latest tracking are implemented.
5. Publish a subsequent release through the updated workflow. That release must prove npm provenance and attach an attested GitHub bundle before GitHub fallback can be claimed for it.

No supplied requirement is unrelated. Floating updates remain independent of test establishment. Silent automatic milestone enforcement remains out of scope; owner-recorded intent plus a reviewed promotion and explicit active-work adoption satisfy the staged path without weakening frozen snapshots.
