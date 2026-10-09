# Executable engineering workflows

Use `ah-engineering` or the enrolled `node .agenthouse/run.mjs`. Every command has an `ah-` skill calling the same implementation. Command help lists supported output and input options.

## Inspect and import

`survey` reports Git state, stacks, package scripts, configuration, agents, pipelines, work locations, and static evidence for unit, component, integration, functional/API, end-to-end, interaction, regression, and contract layers without executing discovered scripts. Layer states are `present`, `absent`, `ambiguous`, or `suspected-nominal`. Empty/comment-only files, skipped-only suites, no apparent assertions, and unconditional-success signals can prompt nominal review; they do not prove poor tests. Configure consumer-reviewed layer selection and aliases under `testing.layers` and `testing.aliases` in project configuration.

`interaction` covers user-visible UI journeys (distinct from API functional tests and from visual concept conformance). Pair interaction/end-to-end plan items with Playwright or the repository e2e runner; use frontend-acceptance for concept/regression/behavior/accessibility criteria.

## Test authoring

`test-plan write` records per-criterion level, method (`tdd`, `characterization`, `verify-after`), and file path on the work item (`fields.testPlan`). `test-plan check` validates coverage. `write-tests prepare` requires a green baseline before authoring new failing tests; `write-tests mark-written` updates statuses. For `tdd` items, capture red with `spec --phase red` before implementation. Do not modify existing tests without an explicit plan decision. Organization standards select methods and naming; core does not hard-code a testing philosophy. See [ADR-0017](adr/0017-test-authoring-and-pipeline.md).

## Architecture and coding guidelines

`architecture list|show|check|write` manages architecture ADR catalogs linked as `fields.architectureCatalog`. Listing can scan `docs/adr` (or `--path`). Check validates catalog structure and linked Markdown paths; it does not prove architectural correctness or grant exception approval.

`engineering-guidelines show|check|write` manages engineering-guideline catalogs linked as `fields.codingStandards`, optionally showing a module standards document (`--module node-typescript|php-laravel`). Mechanism hints (`advisory`, lint tools, `evaluate-check`) are not enforcement; use `controls` and `evaluate` for real checks. Ready gates verify linked catalogs when those fields are present. `coding-standards` remains a compatibility alias with the same format and fields. See [engineering guidelines](engineering-guidelines.md) for assessment before changes and the distinction from catalog validation.

## Pipeline management

`pipeline status|create|plan|apply|jobs|publish` creates and manages multi-job GitHub Actions / GitLab CI for evaluate profiles and configures artifact/JUnit publishing. Evaluation generates reports; publication is a pipeline concern and must not mask evaluate exit status.

`inspect --ref BASE..HEAD` compares those commits; `inspect --ref HEAD --base main` starts at their merge base. A bare commit compares with its first parent, including root commits. Affected files, filename-based test candidates, added suppressions and unfinished-work markers are review signals, not coverage proof. Uncommitted changes appear separately in the survey.

`module --name NAME --preview --output PLAN` maps discovered package/Composer test scripts to a reviewable target configuration. It proposes both an advisory `test-adoption` profile and selected required profile without executing either. Monorepo IDs use `tests.<workspace-key>.<layer>` plus explicit repository-relative `cwd`; declared workspace names are preferred, with normalized paths and collision digests as fallbacks. `module --apply PLAN` validates the target schema, refuses a stale base configuration or identifier conflict, and changes only project configuration. Run `resolve` and `evaluate` separately after review. The original `module --name NAME [--output FILE]` template output remains available.

`backlog --source story.md --id example --provider local` imports markdown verbatim. JSON exports can supply title, kind, fields, criteria and externalId; the original object is retained. `--external-id` preserves platform identity. Repeating an identical import is a no-op; conflicting or edited records require explicit reconciliation.

## Specify behavior

Criteria use stable IDs and observable expectations, for example `{"id":"greeting","expectation":"A visitor sees their name in the greeting"}`.

Configure a command evaluator with `result: "exit-code"` and `specificationFiles` listing its test files. Run `spec --item .agenthouse/work/example.json --phase red --evaluator tests`, implement the behavior, then repeat with `--phase green`. Red requires exit 1; green requires exit 0 with unchanged criteria, test files, command definition and policy. Timeouts and launch errors cannot count as red. Inspect the failure: a setup or compilation problem is not a relevant failing assertion. This method is optional for work needing other evidence.

## Ready, done and review

Configure `lifecycle.ready` and `lifecycle.done` in project configuration or an inherited rule named `lifecycle`. Each accepts `fields`, `kindFields`, `approval`, `independent`, `allowNotApplicable`, `requireRed`, `requireGreen`, `ticketSize`, and `maxCriteria`. Mandatory inherited definitions cannot be weakened locally.

`gate --item FILE --phase ready` checks outcome, scope, acceptance, verification, dependencies, risks and criteria by default. When `ticketSize` is not disabled, more than `maxCriteria` criteria (default 8) or `fields.sizeRisk: "oversized"` yields a pending `ticketSize` finding unless `fields.sizeOverride` explains an explicit user override. `done` checks implementation, evidence, acceptance, release and rollback fields. Completion records include `build` and an `evidence` array of evaluation result paths. Every applicable criterion needs passing evidence for that build and the frozen policy. Evaluator `criteria` arrays map multiple IDs to a check; an identical check ID also matches.

Approval defaults to required. The returned `subject` hash binds the record, phase and evidence bytes. A decision uses that hash, the policy digest, project scope and action `gate:ready` or `gate:done`. Independent review defaults to required when approval is enabled: record `author` and use a different authorized issuer.

When configured, ready runs before Implement and done before Accept. `work advance --gate-decision FILE` supplies its decision; protected stage decisions use the separate `--decision FILE`. Gate exit codes: 0 passed, 1 failed, 3 pending, 4 incomplete; invalid input/signatures return 2.

## Work items and related branches

`work new`, `work show`, and `work advance` manage `.agenthouse/work/<id>.json`. `work new --parent ID` records `fields.parentWork` for a split or follow-up item. Agents must ask before creating work or branches.

`work branch --id ID [--from REF] [--parent ID]` requires `git.branchNaming.pattern` in `.agenthouse/config.json`, a clean working tree, creates and checks out a branch from `--from` (default current HEAD), writes `fields.branch`, and does not push. Pattern placeholders: `{id}`, `{slug}` (from the title), `{kind}`. Onboard can set `--branch-pattern`, `--branch-example`, and `--branch-base`, or ask interactively when Git is present. `doctor` warns when Git exists without a pattern.

`review --item FILE --evidence RESULT_JSON --ref HEAD` maps requirements to checks and rejects stale commit/policy evidence. Technical completeness does not establish code correctness or governance approval. An artifact-only CI job can retain this output without posting comments or modifying trackers.

## Visual plans

`visual-plan check --plan FILE` (or `--item` when `fields.visualPlan` is set) validates a local visual-plan JSON: hashed semantic HTML wireframes and mermaid architecture diagrams. Exit 0 passed, 1 failed, 4 incomplete. It does not render or host a review UI. Ready gates check a linked plan when the field is present; they do not require one for every change. Copy `templates/visual-plan/` as a starting layout.

## npm provenance

`npm-provenance status` inspects `package.json`, git origin, and GitHub Actions / GitLab CI files for a public npm publish. Exit 0 ready or inapplicable, 1 failed, 4 incomplete. `npm-provenance apply --provider github|gitlab` writes a new publish workflow only when that file is missing and reports required edits otherwise. Default `--publish trusted` uses OIDC; `--publish token` adds `--provenance` and an `NPM_TOKEN` reference. Neither action publishes or writes credentials. See [npm provenance](npm-provenance.md).

## Small changes

Teams can define `lifecycle.paths`, mapping names to ordered stage lists, with allowed work kinds in `lifecycle.pathKinds`. Use `work new --path NAME` and explain suitability in `fields.pathReason`. Paths must start at Discover and retain Verify, Accept, Release and Retire in order. Shorter paths preserve protected decisions; teams select relevant gate fields. The default remains the full lifecycle.

`review --baseline REPORT_JSON` compares check outcomes against evidence for the merge/commit base under the same policy. It reports unchanged, improved and changed outcomes without suppressing current failures. `controls` maps policy rule IDs to concrete mechanisms and distinguishes guidance from automated checks.

Profiles may record repository-owner milestone intent as `promotion: {status: "reached"|"deferred", reference, owner}`. A deferred enforced profile returns incomplete rather than green. The reference is intent evidence, not signed governance approval. `session` reports policy drift and leaves the frozen snapshot unchanged; adopt a reviewed revision explicitly with `resolve`.

Ready defaults also require reproduction/expected/observed behavior for bugs, impact/mitigation for incidents, question/completion condition for investigations, and audience for documentation. Teams may configure `kindFields` to match their process.
