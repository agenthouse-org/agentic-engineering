# agenthouse engineering cookbook

Version 1.5.0 adds conditional CI test-report publication guidance. See [CLI evaluation and CI/CD integration](cli-evaluation.md) for configuring JUnit XML upload and platform ingestion without masking failures.

This guide shows the common paths from installation to a verified change. Commands use the globally installed `ah-engineering` executable for setup and the repository-pinned launcher for daily work.

## The two command types

agenthouse exposes two related interfaces:

- CLI commands run in a terminal: `ah-engineering review`, `ah-engineering evaluate`, and `node .agenthouse/run.mjs work show`.
- Coding-agent skills run inside Claude Code, Codex, Cursor, OpenCode, Windsurf, or OpenClaw: `ah-review-change`, `ah-validate-scope`, and `ah-help`.

CLI help accepts CLI command names:

```text
ah-engineering help
ah-engineering help review
ah-engineering evaluate --help
```

Agent-skill help accepts the complete skill name:

```text
ah-engineering help ah-review-change
ah-engineering help ah-validate-scope
ah-engineering help agents
```

An agent skill may combine judgment and several CLI operations, so not every `ah-` skill has a same-named CLI subcommand.

## Recipe: work from a role or process

Discover and load guidance for the current task:

```text
node .agenthouse/run.mjs roles list
node .agenthouse/run.mjs roles use --id product-manager
node .agenthouse/run.mjs process start --id feature-request
```

To customize shared-with-yourself roles/processes, adopt definitions to the consumer global repository, edit the JSON copies, then inspect baseline drift after a framework update:

```text
node .agenthouse/run.mjs roles adopt
node .agenthouse/run.mjs process adopt
node .agenthouse/run.mjs roles check
node .agenthouse/run.mjs process check
```

Review reported field changes before `roles merge --id ID` or `process merge --id ID`. Conflicts preserve local files; deferred revisions can be recorded with `ignore`. `process where --description "..."` offers tentative orientation and does not update a tracker. See [roles and product processes](roles-and-processes.md) for details.

## Recipe: install and enroll a repository

Install the CLI once:

```text
npm install --global @agenthouse/engineering --ignore-scripts
```

Enroll each repository with an explicit agent list:

```text
ah-engineering onboard --root "C:/src/my-app" --agents codex,cursor
```

In an interactive terminal, onboarding then asks whether to open the cookbook and project agent-command guide in the system's default Markdown app, show both in the terminal, or skip. For a deterministic scripted run, select the behavior explicitly:

```text
ah-engineering onboard --root "C:/src/my-app" --agents codex,cursor --docs show
```

Use `--docs open`, `--docs show`, or `--docs skip`. Noninteractive runs skip the guides when this option is omitted.

On an existing installation, `onboard` offers the same documentation choice, prints next steps, and preserves the selected agents. To change the registered agents, run:

```text
ah-engineering init --root "C:/src/my-app" --agents codex,cursor,claude
```

Then open the enrolled repository as the coding agent's workspace and start a fresh session or reload the host. A terminal opened in the repository is not enough if the coding-agent task itself is attached to another folder.

Verify the installation:

```text
cd C:/src/my-app
node .agenthouse/run.mjs doctor
node .agenthouse/run.mjs dependencies status
```

## Recipe: discover and invoke agent skills

Show host-specific invocation and installed locations:

```text
node .agenthouse/run.mjs help agents
```

After opening the enrolled repository in Codex, select the skill or ask:

```text
$ah-help Recommend the next agenthouse workflow for this bug.
$ah-define-product-requirements Turn this multi-story request into evidence-traced requirements and a story map.
$ah-validate-scope Check whether these requirements cover the intended outcome.
$ah-review-change Review this change against its requirements and evidence.
```

Hosts with slash commands generally expose `/ah-help`; see `help agents` for the exact host map. Natural-language requests also work when the host has loaded the project skills.

## Recipe: start the first change

Create and inspect a lifecycle record:

```text
node .agenthouse/run.mjs work new --id first-change --title "Describe the intended outcome"
node .agenthouse/run.mjs work show --id first-change
```

Ask the coding agent to define the outcome, scope, acceptance criteria, dependencies, risks, and verification before implementation. Edit `.agenthouse/config.json` so its evaluators call the repository's real checks.

Inspect stack templates when useful:

```text
node .agenthouse/run.mjs module --name node-typescript
node .agenthouse/run.mjs module --name php-laravel
```

Resolve the reviewed configuration and run the checks:

```text
node .agenthouse/run.mjs resolve
node .agenthouse/run.mjs evaluate --profile pull-request --ci
```

## Recipe: assess scope before implementation

For a request that spans multiple stories, first define product requirements and a story map from available evidence, assumptions, constraints, and unresolved questions:

```text
$ah-define-product-requirements Define the checkout improvement from the discovery notes, support tickets, and analytics summary. Keep assumptions separate from evidence and do not create work items yet.
```

`ah-validate-scope` is an agent workflow, not a CLI subcommand. Give it the intended outcome and the actual requirement files or work items:

```text
$ah-validate-scope Determine whether requirements/ covers the checkout outcome. Identify gaps, unrelated work, dependencies, sequencing, and assumptions.
```

For the readiness of one structured work item, use the deterministic gate as a baseline:

```text
node .agenthouse/run.mjs gate --item .agenthouse/work/first-change.json --phase ready
```

Readiness completeness is not proof that the requirements are true or sufficient; the agent assessment supplies that judgment. Scoping skills ask a short Decide list (including whether a wireframe, mermaid, both, or neither is needed) and stay brief unless you ask for more. When a ticket is too large, the ready gate reports a pending `ticketSize` finding; ask before creating split work items and offer `work branch` after `git.branchNaming` is set. Mid-flight out-of-scope asks: warn, stop, then Decide new work vs expand vs override.

## Recipe: related branch for a split work item

```text
node .agenthouse/run.mjs work new --id login-slice --title "Add login form" --parent first-change
node .agenthouse/run.mjs work branch --id login-slice --from HEAD --parent first-change
```

Configure naming once (onboard or edit `.agenthouse/config.json`):

```json
"git": { "branchNaming": { "pattern": "{id}-{slug}", "example": "login-slice-add-login-form", "baseDefault": "main" } }
```

## Recipe: visual plan before UI or data-model work

When a layout or schema must be seen before code:

```text
$ah-visual-plan Empty cart in the browser shell, plus an erDiagram for orders. Fidelity is wireframe.
```

Then check the files:

```text
node .agenthouse/run.mjs visual-plan check --plan design/cart-plan.json
```

Skip this for copy, docs, or one-line changes. `templates/visual-plan/` is a starting layout. The check does not render a hosted review UI.

## Recipe: add npm provenance before a public publish

When the repository is about to publish a public package to npm:

```text
$ah-npm-provenance We need to publish this package. Should we add provenance?
node .agenthouse/run.mjs npm-provenance status
```

Say yes to write a GitHub Actions or GitLab.com job if the target file is missing:

```text
node .agenthouse/run.mjs npm-provenance apply --provider github
```

Trusted publishing is the default: OIDC from cloud-hosted CI, no long-lived npm token, provenance attached automatically. Then add the trusted publisher on npmjs.com (org/user, repository, workflow filename). The command does not publish, store tokens, or change the registry. See [npm provenance](npm-provenance.md).

## Recipe: review a change

Survey the repository and inspect the change range:

```text
node .agenthouse/run.mjs survey
node .agenthouse/run.mjs inspect --base main
```

Then invoke the agent workflow:

```text
$ah-review-change Review the current change against .agenthouse/work/first-change.json and the available evidence.
```

The workflow combines repository inspection, relevant checks, requirement coverage, and evidence review. A passing technical result does not grant governance approval.

## Recipe: UI and browser evidence

The required `frontend-acceptance` skill is installed during enrollment. For a UI change, invoke:

```text
$ah-frontend-acceptance Verify this UI against the story and inspect real screenshots.
```

Write inspection captures under `.agenthouse/evidence/<work-id>/` only. Inspect them, then run `node .agenthouse/run.mjs housekeep`. Do not write or commit galleries under `tests/output`, and do not leave `tmp-pr-*.md` drafts at the repository root. Evaluation reports stay under `artifacts/agenthouse/` and are archived by CI.

For the separate web-usability audit:

```text
node .agenthouse/run.mjs usability setup
node .agenthouse/run.mjs usability run --url http://localhost:3000 --output artifacts/agenthouse/usability.json
```

Setup provisions optional locked tooling; review it before authorizing downloads. Audit output is evidence to inspect, not an automatic conformity certificate.

## Recipe: diagnose an installation

```text
node .agenthouse/run.mjs doctor
node .agenthouse/run.mjs dependencies status
node .agenthouse/run.mjs session
```

Use the pinned launcher inside enrolled repositories. The global CLI may be newer than the repository runtime; `session` reports the version actually executing.

If an installation transaction was interrupted:

```text
node .agenthouse/run.mjs recover
```

Do not delete ownership metadata or conflicting files to force installation. Preserve the reported files and resolve the ownership conflict explicitly.

## Common mistakes

### `help ah-scope` reports an unknown topic

The skill is named `ah-validate-scope`:

```text
ah-engineering help ah-validate-scope
```

Invoke it in Codex with `$ah-validate-scope`.

### Skills are installed but missing from the coding agent

Confirm that the intended agent is registered with `doctor`. Open the enrolled repository as the agent workspace, then reload or start a new session. Skills are project-scoped; an existing task attached to another directory will not discover them.

### Rerunning onboarding did not add an agent

This is intentional preservation behavior for existing installations. Use `init` with the complete desired list:

```text
ah-engineering init --root "C:/src/my-app" --agents codex,cursor
```

### A command works globally but behaves differently through the repository launcher

Compare `ah-engineering --help` with `node .agenthouse/run.mjs --help`. Use the repository launcher for repeatable project work and update the pinned runtime through the reviewed update process.

## More documentation

- `docs/agent-commands.md`: host-specific skill installation and invocation
- `docs/using.md`: operating and configuration details
- `docs/workflow-tools.md`: survey, inspect, review, gates, and specification evidence
- `docs/dependencies.md`: dependency integrity, pins, updates, and rollback
- `docs/visual-acceptance.md`: UI acceptance and browser evidence
- `docs/npm-provenance.md`: public npm publish provenance and trusted publishing

## Administration

Use `help COMMAND` for keygen, npm-provenance, bundle, module, skill, hook-config, init, restore, uninstall, resolve, dependencies, context and assessment. These remain available outside the default lifecycle map.

See [technical feasibility](technical-feasibility.md) and [incoming URL reviews](review-mr.md).
