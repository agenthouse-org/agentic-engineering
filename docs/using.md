# Using agenthouse engineering

This is a runnable developer preview. The core requires Node.js 22 or newer and has no runtime package dependencies. See [implementation status](implementation-status.md) for tested behavior and remaining platform work. Native agent hooks and remote product-specific connectors are not claimed as complete.

## Install and enroll

From this checkout:

```text
node C:/src/agenthouse-agentic-engineering/bin/ah-engineering.js init --root C:/path/to/project --agents claude,codex,cursor
```

For normal use, install the CLI with `npm install --global @agenthouse/engineering --ignore-scripts`, then run `ah-engineering onboard --root /path/to/project`. Each application is enrolled separately; no framework checkout is needed. To pin the CLI, install `@agenthouse/engineering@0.1.7` instead.

For a project-local CLI, use `npm install --save-dev --save-exact @agenthouse/engineering@0.1.7 --ignore-scripts`, then `npx --no-install ah-engineering onboard`. This updates the application's package manifest and lockfile; use the global option if you do not want a development dependency. A supplied archive can be installed with `npm install --global /path/to/agenthouse-engineering-0.1.7.tgz --ignore-scripts`. npm's registry, proxy and certificate configuration applies when distributing through internal registries. The dependency-free tarball can be installed offline with Node/npm already provisioned.

`init` detects agent directories when `--agents` is omitted. Explicit supported values are claude, codex, opencode, cursor, windsurf, and openclaw. OpenClaw enrollment must target its configured workspace. When no host is detected, generic AGENTS.md instructions and the lifecycle skill are still installed. All CLI commands accept `--root`; by default they use the current directory.

Enrollment writes a local launcher and an immutable runtime under `.agenthouse`, appends owned instruction blocks, and preserves consumer configuration. It does not enable native hooks. Re-enrollment refuses to overwrite user-modified managed content. `uninstall` removes only unchanged owned content and retains policies, keys, work records, evidence, and runtime caches. `recover` restores an interrupted transaction when files still match its recorded before/after states. If a crashed process leaves `mutation.lock`, verify the recorded process has exited before removing that one lock file.

`init --scope user` creates an explicitly separate defaults workspace under `~/.agenthouse-defaults`; this preview does not automatically merge it into project policy or configure each vendor's global settings. Prefer global CLI installation plus project enrollment for normal use.

## The first work item

```text
node .agenthouse/run.mjs work new --id first-change --title "Deliver the first outcome"
node .agenthouse/run.mjs work show --id first-change
```

Edit `.agenthouse/work/first-change.json` with the actual outcome and evidence. [Lifecycle fields](lifecycle.md) explain each stage. The initial pull-request profile checks that the first-change plan has a verification strategy. This is intentionally an incomplete starter until the team configures its actual checks; it does not pretend to test application code.

The starter uses supervised autonomy and creates a local Ed25519 owner key in `.agenthouse/local/owner.key`, which is ignored by Git. This local owner is a single-developer convenience, not an enterprise authority. Enterprise enrollment uses `init --policy /path/to/organization-policy.json`, copying the chosen policy snapshot. Keep private keys in the organization's approved secret store and supply a trusted policy mount in CI.

## Configure your own processes

Configuration is JSON in this release. The earlier YAML design examples are conceptual; YAML parsing is not implemented. JSON schemas live in `schemas/` and runtime validation rejects unknown fields. Example:

```json
{
  "schemaVersion": 1,
  "project": "example-project",
  "autonomy": "bounded",
  "documentationAuthority": "git",
  "policySources": [".agenthouse/policy.json"],
  "evaluators": [
    {"id":"tests","kind":"command","executable":"node","args":["--test"],"result":"exit-code","timeoutSeconds":120},
    {"id":"release-readiness","kind":"command","executable":"python","args":["tools/release_check.py"],"result":"json"}
  ],
  "profiles": {
    "pull-request":{"checks":[{"evaluator":"tests","required":true}]},
    "release":{"checks":[{"evaluator":"tests"},{"evaluator":"release-readiness"}]}
  }
}
```

Register direct executables with argument arrays. On Windows use `node path/to/tool.js` or `php path/to/tool` rather than an npm `.cmd` shim; the runner deliberately does not interpolate shell strings. A shell script can use an explicit interpreter. Command evaluators inherit the process environment; run them only from reviewed configuration with appropriately scoped credentials. They are not sandboxed.

Exit-code evaluators default to 0 passed and 1 failed; unmapped codes, timeouts, launch failures, and output-limit violations are errors. A JSON evaluator must exit 0 and print only a valid check-result object on stdout, such as `{"schemaVersion":1,"status":"passed","reason":"Required checks met"}`. Its business status can still be failed, incomplete, or pending. Limits prevent unlimited stdout/stderr capture.

The runner provides `AH_SUBJECT`, `AH_POLICY_DIGEST`, `AH_PROJECT`, `AH_BASE_URL`, and `AH_CONTEXT`. Required environment names can be declared using `requiredEnvironment`. Values are never included by the framework itself, but a team-owned evaluator can print sensitive data; configure its output accordingly.

```text
node .agenthouse/run.mjs resolve
node .agenthouse/run.mjs evaluate --profile pull-request --ci --frozen --subject build-123
```

Commit the reviewed config, policy and resolved snapshot. Frozen evaluation re-derives the snapshot and rejects drift. If no subject is supplied, the CLI uses HEAD only for a clean Git checkout; dirty/non-Git work requires an explicit identity that the caller is responsible for assigning to the tested build.

Runs have unique directories under `artifacts/agenthouse/`, containing result.json, junit.xml, report.html, context.json, and copied evidence. `latest.json` points to the most recent run. Exit statuses are 0 satisfied, 1 failed/denied, 2 execution/configuration error, 3 pending approval, and 4 incomplete evidence. A narrower profile that omits an organization-required check is incomplete. Advisory findings stay visible. Required not-applicable outcomes require explicit `allowNotApplicable` on that profile check.

## Policy and governance

Policy layers have stable IDs/revisions, mandatory/default/advisory rules, public authority keys and required check IDs. `overrides` may specialize defaults but cannot weaken mandatory values. Mandatory `autonomy` and `documentation-authority` rules bind the corresponding config fields. A mandatory `evaluator.<id>` rule can hold the exact evaluator object to prevent substituting its command.

For a hostile contribution threat model, protect the framework binary and CI job and mount a trusted policy outside the checkout. Run both resolve and evaluate with `--policy-file /trusted/organization.json`. A policy committed in the same writable branch as an adversarial change is not a trust boundary. Required check IDs alone do not authenticate a modified evaluator; pin its definition and protect its executable or image too.

`keygen --output /secure/owner.key` creates an Ed25519 key and matching `.pub`. Policy `owner` names an entry in `authorities` whose value is the public PEM. Do not commit private keys. Generate a decision payload:

```json
{
  "schemaVersion":1,"kind":"decision","issuer":"architecture-owner",
  "scope":"example-project","action":"release","subject":"build-123",
  "policyDigest":"COPY_THE_RESOLVED_DIGEST",
  "issuedAt":"2026-09-13T12:00:00Z","expiresAt":"2026-09-14T12:00:00Z",
  "verdict":"allowed"
}
```

The owner signs through `sign --input request.json --key /secure/owner.key --output approval.json`. Dates and digest in the example must be replaced with actual values. Signing is an explicit owner operation, never an automatic consequence of passing tests. An approval evaluator names its file and action.

The central owner may sign a delegation payload containing `kind: delegation`, `issuer`, `delegate`, `scope`, `actions`, `policyDigest`, `issuedAt`, and `expiresAt`. The delegate signs a decision and includes that envelope through `sign --delegation delegation.json`. Only direct central-owner delegation is supported; recursive delegation is deliberately rejected. Changing the trusted policy revision invalidates old signed decisions/delegations. Verdicts, scope, subject, expiry and signatures are checked. The preview does not implement a live revocation service or signed per-rule waivers.

`work advance --id first-change --to define --decision decisions/approval.json` binds transition decisions to the hash of the current work record, action `transition:define`, and the project scope. Use the `subjectHash` returned by `work show` as that subject. In supervised mode every transition requires approval. Bounded/delegated modes allow routine transitions but still require approval for accept, release and retire. These starter profiles are conservative; a fully configurable action matrix is remaining work.

## Visual acceptance with Playwright

Copy/adapt `templates/frontend/`. Install Playwright in the consuming project and provision its browser separately. Evaluation never downloads a browser. A command evaluator runs the project's Playwright CLI using the provided reporter. Put a following `visual` evaluator in the profile with `contract` and `assessment` paths. The adapter emits hashed screenshots, criterion results, environment metadata, and build/contract/policy identity.

The contract supports image, wireframe, story, or bug sources. Image and wireframe contracts require reference paths and hashes. Record wireframe fidelity (`wireframe`, `design`, or `prototype`); sketch treatment is not a pixel requirement. Criteria distinguish concept, regression, behavior and accessibility. Browser tests annotate criterion IDs, viewport and state; the reporter refuses to fabricate concept approval. A concept reviewer must add a criterion with `reviewer`, `inspected: true`, a reason, and the hashed screenshot evidence. It remains incomplete until reviewed. The framework verifies provenance and completeness of the record, not the truthfulness of a self-asserted review; require an independent signed approval where organizational policy demands it.

Local visual plans are optional Design artifacts: semantic HTML fragments, mermaid ERD/UML, and `visual-plan check`. Link the plan from `fields.visualPlan` when a ready gate should validate it. See [ADR-0008](adr/0008-visual-plans-and-mermaid.md). They do not replace frontend-acceptance or real-browser evidence.

Use `capture(page, testInfo)` from the Playwright adapter. Baseline comparison uses the project's normal Playwright assertions. Validation configs should set `updateSnapshots: 'none'`; baseline generation is a separate reviewed operation. Never accept a baseline automatically just to turn a failure green.

`npm run test:browser` exercises a real local fixture, establishes a test-only baseline under work/, deliberately breaks the layout, asserts failure, restores it, and verifies the evidence. Set `AH_BROWSER_EXECUTABLE` for an already installed Chrome/Chromium, or provision the pinned Playwright browser first. This test script's baseline generation is not a production pipeline pattern.

## Agent-facing commands

Every CLI command has an ah-prefixed skill. Enrollment also creates native command/workflow aliases for selected hosts. Read [agent commands](agent-commands.md) for the full command map, workflow skills, invocation syntax, and bootstrap limitations.

## Discover commands and onboarding

Run `ah-engineering help` for the command map, `ah-engineering help evaluate` for command-specific options, `ah-engineering help agents` for coding-agent installation and invocation, and `ah-engineering help cookbook` (or `help extended`) for longer recipes. `help ah-SKILL` explains an exact coding-agent skill and distinguishes it from a CLI subcommand. `ah-engineering onboard --root /path/to/project` guides terminal setup, then asks whether to open its two Markdown guides in the system default app, show them in the terminal, or skip. For scripts, supply `--agents codex` or `--non-interactive` and select `--docs open|show|skip`; omitted documentation defaults to skip outside an interactive terminal. Existing installations receive the same documentation choice and a read-only guide while preserving their registered agent list; use `init --agents` with the complete desired list to change it. `ah-engineering demo --root ./new-demo-directory` runs an isolated failure/fix example and prints report paths. See the README for the full walkthrough.

## Shared specialist skills and hooks

Frontend acceptance is installed automatically from agenthouse-skills as a required versioned dependency. See [dependency operations](dependencies.md) for updates, pins, offline bundles, and rollback.

Import another reviewed skill with `skill --source /path/to/another-reviewed-skill`. The source is copied intact, and its file hashes, version and source are recorded in `.agenthouse/skills.json`. Optional `--sha256` checks a precomputed manifest digest. The framework does not fork the skill method. Existing changed imports are refused, rather than overwritten. Automatic updates for the required frontend dependency are supported through approved bundles; updates of other manually imported skills remain separate.

The lifecycle skill is installed into `.agents/skills/ah-lifecycle`; agent instructions link the method. Hosts with other skill discovery conventions can read these files through the common entry point. Native plugin/skill-loader behavior is not yet host-certified. `agenthouse-hooks` remains independent; invoke a reviewed `scan` command through an exit-code evaluator if needed. Its malformed-input `run --vendor ci` behavior still needs upstream correction before that path is authoritative.

## Updates, offline bundles and rollback

`bundle --output engineering.bundle.json` creates a dependency-free runtime bundle. `--key /secure/release.key` signs it. Keep verification keys/checksums in trusted distribution configuration. `update --bundle FILE --sha256 TRUSTED_DIGEST` checks an unsigned bundle against the supplied digest; `--public-key FILE` verifies a signed bundle. A checksum from the same untrusted download is not origin authentication.

Updates stage an immutable runtime and health-check its CLI before activating managed projections. The previous installation is retained; `rollback` verifies its cached digest before restoring it. An edited managed file yields a conflict. `update --check` reports compatibility without activation. Pre-1.0 minor-version changes are considered breaking and need `--allow-breaking`; pins in `.agenthouse/update.json` must also match.

For automatic between-session updates, configure `.agenthouse/update.json` with `automatic: true`, a repository-relative `bundle` path supplied by the organization's distribution process, and a trusted `sha256` or `publicKey` path. `session` imports eligible bundles and records its active runtime. A subsequent CLI invocation uses the new version. This preview does not provide a network polling daemon or automatic native session hooks; agents invoke the session command via instructions, or teams call it from their launcher. CI frozen evaluation never auto-updates.

Bundles include the framework, lifecycle skill and stack templates; separately imported specialist skills and browser binaries must be transferred separately for offline use. Full multi-package offline closure and registry/Git-source synchronization remain roadmap work.

## CI and platform integration

Use `templates/ci/github.yml` or `templates/ci/gitlab.yml` after adding the tarball as a locked dependency. Both preserve reports on failure. Protect the job through the platform's normal required-check/release policy. Other CI systems run the same command, preserve its exit status, and archive its output directory even on failure.

To attach npm provenance to a **public** package publish, use `npm-provenance status` and `npm-provenance apply`. Trusted publishing on GitHub-hosted or GitLab.com runners is the default. The command does not publish or configure npmjs.com. See [npm provenance](npm-provenance.md).

Jira, Wrike, documentation services, and REST/MCP decision providers can be integrated through an organization's existing CLI returning the check-result contract. Dedicated native connectors and two-way synchronization are not implemented in this preview. Documentation authority is recorded in policy/configuration; the framework does not publish pages or resolve external-platform conflicts yet.
