# CLI evaluation and CI/CD integration

> Design specification. A runnable 0.1.0 preview now implements part of this specification. See [implementation status](implementation-status.md) and [operating guide](using.md) for the exact shipped commands, configuration, and remaining work. Earlier proposed-interface examples below are not a compatibility promise.


Status: required product capability, 2026-09-13. The evaluation CLI is implemented in the local 0.1.0 preview. The examples below describe the wider target: JSON configuration and the commands in the operating guide are implemented; YAML and the umbrella --evidence import option remain proposed.

## DevOps experience

An engineer installs an identified framework release, selects an evaluation profile, supplies the build/workspace and any evidence inputs, and runs one noninteractive command. The command produces a useful terminal summary, structured results, test reports, visual evidence where applicable, and a reliable process status. It does not require an interactive coding agent, a paid service, or a framework-specific CI platform.

The same core evaluates developer runs, agent-triggered runs, pull/merge requests, release jobs, and post-deployment smoke checks. Agent skills help prepare and interpret evaluations; pipelines invoke executable evaluators directly.

## Proposed commands

```text
ah-engineering evaluate --profile pull-request --ci --frozen --output artifacts/agenthouse
ah-engineering evaluate --profile frontend --base-url http://127.0.0.1:4173 --ci --frozen --output artifacts/agenthouse
ah-engineering evaluate --profile release --evidence artifacts/previous-run --ci --frozen --output artifacts/release
```

`--ci` disables prompts and uses documented noninteractive defaults; missing required input is an error. `--frozen` requires an existing valid resolved snapshot and performs no dependency/policy updates. Evaluation never installs dependencies or enables new network destinations implicitly. Installation, browser provisioning, app startup, update, evaluation, and baseline approval are separate operations.

`--evidence` imports an evidence bundle only after verifying its schema, artifact/build identity, contract and policy revisions, integrity, and applicable freshness. It must not accept an arbitrary report as proof simply because a file exists. The profile defines which checks reuse evidence and which require a new run, such as post-deployment smoke tests.

Profiles are simple named selections of checks and gate policies, such as pull-request, frontend, release, and post-deploy. Organizations can add their own names and processes. A narrower requested profile cannot claim to satisfy an organization gate unless it includes that gate's required coverage.

## Built-in and organization-owned evaluators

An evaluator is an executable capability with stable identity, version, declared inputs, supported checks, and output contract. It can run tests, inspect policy/evidence, assess readiness, validate release conditions, or invoke an explicitly configured external service.

Register an existing organization CLI using an executable and argument array, working directory, required environment-variable names, timeout, and result mapping. No framework-specific skill or rewrite of the existing process is required. Support two integration levels:

- **Exit-code adapter:** map the script's documented success, finding, and execution-error codes; retain stdout/stderr as evidence. Unmapped statuses are errors.
- **Structured adapter:** validate a versioned JSON result containing individual findings, criteria, evidence references, and execution status. A successful process exit with missing or invalid required output is an error.

Illustrative organization configuration, pending schema implementation:

```yaml
schemaVersion: 1
evaluators:
  - id: org.release-readiness
    executable: python
    args: [tools/release_readiness.py, --format, json]
    cwd: .
    timeoutSeconds: 120
    result:
      kind: json
      schemaVersion: 1
      source: stdout
    requiredEnvironment: [RELEASE_TARGET]
profiles:
  release:
    checks:
      - evaluator: org.release-readiness
        required: true
```

Use direct process invocation with arguments, not string-built shell commands. Shell scripts can be explicitly registered with their interpreter. Do not execute instructions discovered inside a story, artifact, or remote assessment. Trust and credential scope come from the chosen policy/configuration, particularly when pipelines evaluate untrusted changes.

An evaluator may be local, containerized, or service-backed through an explicit adapter. Declare networking, credentials, supported platforms, runtime dependencies, and offline capability. A required unavailable dependency/provider produces an error or pending governance decision as appropriate, never a pass. Credential values are supplied by the environment/secret store and excluded from reports.

## Shared result contract

Each run records schema version, run ID, subject commit/build and environment, framework and evaluator versions, resolved policy snapshot, profile, timestamps, result status, and artifact inventory.

Each check records its ID, criterion/rule references, required/advisory classification, status, findings, evidence references/digests, elapsed time, and reason. Allowed check statuses are passed, failed, error, incomplete, pending, and not-applicable. Preserve the evaluator's original result and any policy exception separately; do not rewrite failed evidence as passed.

Gate states are satisfied, unsatisfied, error, incomplete, and pending. A valid authorized waiver can satisfy a gate while visibly retaining the waived finding and approval reference. Advisory findings remain visible but do not fail a gate. Skipping a required check without a valid applicability decision or authorized exception leaves the gate incomplete.

Proposed process statuses for cross-platform scripts:

| Exit | Meaning |
| --- | --- |
| 0 | Requested gate requirements satisfied; advisory findings or authorized exceptions remain visible |
| 1 | Required criterion failed or authorization denied |
| 2 | Invalid configuration, evaluator/runner error, malformed output, missing dependency, or timeout |
| 3 | Required authorized governance decision is pending |
| 4 | Required coverage or assessment is incomplete, stale, or missing |

For multiple outcomes, exit precedence is error (2), failure (1), incomplete (4), pending (3), then satisfied (0). Reports retain all outcomes. Advisory check failures/errors are reported but affect the gate only if policy makes that check required. Framework initialization or report-generation failure always yields error. Exit 0 must never mean merely "the framework ran."

Missing artifacts despite an external runner reporting success are incomplete evidence; a violated structured-output contract is an execution error. A semantic reviewer not yet selected is incomplete; an actual approval request awaiting its authorized approver is pending. These states should not be conflated.

## Reports and artifacts

The initial target outputs are a concise terminal summary, `result.json` as the authoritative machine contract, `junit.xml` for conventional CI test views, and `report.html` for human review. Include screenshot/reference/difference artifacts for applicable frontend checks. Add platform-native formats only when they provide useful fidelity. Evaluation writes JUnit XML locally; CI must separately upload or ingest it. A file appearing in the workspace is not proof that it reached the platform's report view.

JUnit is a projection of framework evaluation checks: failed criteria map to failures, execution errors to errors, and pending/incomplete/not-applicable states remain explicitly labeled in properties and case messages. It does not contain the underlying test runner's individual cases unless that runner separately emits them. Project-specific test-runner JUnit configuration is separate. Non-passed framework checks may appear as skipped in a viewer, but the process exit and full JSON preserve blocking semantics. Advisory results must be identified so report import does not silently establish a different gate policy.

Write the result atomically; retain partial diagnostics on interruption where possible and signal an unsuccessful run. Report artifact provenance and protect paths against traversal during evidence import. Do not mix diagnostic logs into machine-readable JSON stdout.

## CI/CD integration recipe

Ship concise copy/adapt templates for GitHub Actions and GitLab CI, plus a platform-neutral command recipe for Jenkins, Azure Pipelines, and other systems. Templates reference real release coordinates only after publication; no placeholder masquerades as a working installer.

Each template must show:

1. Checkout and install the locked framework and declared evaluator/browser dependencies from the selected public, private, or offline source.
2. Prepare deterministic fixtures and start or identify the application when required; wait for readiness and guarantee cleanup.
3. Invoke the chosen profile with `--ci --frozen`, explicit environment/build identity, and an output directory.
4. Publish reports and evidence even when evaluation returns a nonzero status, preserving the original status as the job result.
5. Connect the job's result to the platform's branch/release policy where a required gate is intended.

When the test runner or evaluator produces JUnit XML and the CI platform has a supported report integration, configure it explicitly and retain the file on both successful and failed runs. Report generation and report publication are separate responsibilities. GitLab displays JUnit reports when the job declares `artifacts:reports:junit`; set `artifacts:when: always` and use a file glob rather than a directory. The supplied GitLab template does this. GitHub Actions' workflow artifacts preserve downloadable files but do not parse arbitrary JUnit XML into a native test-results view. The supplied GitHub template uploads evaluation evidence, including `junit.xml`; an in-page test summary needs a separately reviewed reporting action or integration. Do not add third-party actions without the consumer's normal supply-chain review. A report uploader must not mask the original test/evaluation exit status or mark a failed gate as passed.

Do not use a blanket ignore-error option that makes failed evaluation green. Handling pending approval may involve a separate platform approval job; the evaluation itself does not approve or deploy. Pull-request evaluation should not gain production credentials just because the release profile needs them.

Cache immutable dependencies using the resolved version set. Parallel checks write separate run locations; aggregate deterministically and reject evidence from another build. Post-deployment evaluation is read-only by default; corrective actions, rollback, or tracker writes are separate policy-authorized operations.

## Current reuse and a known integration gap


## Verification scenarios required for release

- A DevOps engineer uses the supplied GitHub and GitLab examples without an interactive agent or paid account.
- A plain organization script and a structured organization evaluator work through the same profile, with deliberate pass/fail/error examples.
- Required failure, timeout, invalid JSON, missing output, pending approval, missing coverage, and valid not-applicable cases produce the documented statuses.
- A visual evaluation based on an image, a story alone, and a bug report publishes criterion-level evidence and a readable report.
- A failed evaluation still publishes its evidence and leaves the pipeline unsuccessful; JUnit import does not override gate semantics.
- Frozen/offline evaluation performs no update or undeclared fetch; a missing dependency is actionable and nonzero.
- Reused evidence from a different commit, contract, policy, or environment is rejected; duplicate/retried runs do not overwrite unrelated results.
- Windows, macOS, and Linux exercise argument quoting, paths with spaces, timeouts, and subprocess failures consistently.

The engineering hook command rejects malformed event input with exit 2. It supplements the evaluation boundary; see [hooks](hooks.md).
