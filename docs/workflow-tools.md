# Executable engineering workflows

Use `ah-engineering` or the enrolled `node .agenthouse/run.mjs`. Every command has an `ah-` skill calling the same implementation. Command help lists supported output and input options.

## Inspect and import

`survey` reports Git state, stacks, package scripts, configuration, agents, pipelines and work locations without executing discovered scripts. `inspect --ref BASE..HEAD` compares those commits; `inspect --ref HEAD --base main` starts at their merge base. A bare commit compares with its first parent, including root commits. Affected files, filename-based test candidates, added suppressions and unfinished-work markers are review signals, not coverage proof. Uncommitted changes appear separately in the survey.

`backlog --source story.md --id example --provider local` imports markdown verbatim. JSON exports can supply title, kind, fields, criteria and externalId; the original object is retained. `--external-id` preserves platform identity. Repeating an identical import is a no-op; conflicting or edited records require explicit reconciliation.

## Specify behavior

Criteria use stable IDs and observable expectations, for example `{"id":"greeting","expectation":"A visitor sees their name in the greeting"}`.

Configure a command evaluator with `result: "exit-code"` and `specificationFiles` listing its test files. Run `spec --item .agenthouse/work/example.json --phase red --evaluator tests`, implement the behavior, then repeat with `--phase green`. Red requires exit 1; green requires exit 0 with unchanged criteria, test files, command definition and policy. Timeouts and launch errors cannot count as red. Inspect the failure: a setup or compilation problem is not a relevant failing assertion. This method is optional for work needing other evidence.

## Ready, done and review

Configure `lifecycle.ready` and `lifecycle.done` in project configuration or an inherited rule named `lifecycle`. Each accepts `fields`, `kindFields`, `approval`, `independent`, `allowNotApplicable`, `requireRed` and `requireGreen`. Mandatory inherited definitions cannot be weakened locally.

`gate --item FILE --phase ready` checks outcome, scope, acceptance, verification, dependencies, risks and criteria by default. `done` checks implementation, evidence, acceptance, release and rollback fields. Completion records include `build` and an `evidence` array of evaluation result paths. Every applicable criterion needs passing evidence for that build and the frozen policy. Evaluator `criteria` arrays map multiple IDs to a check; an identical check ID also matches.

Approval defaults to required. The returned `subject` hash binds the record, phase and evidence bytes. A decision uses that hash, the policy digest, project scope and action `gate:ready` or `gate:done`. Independent review defaults to required when approval is enabled: record `author` and use a different authorized issuer.

When configured, ready runs before Implement and done before Accept. `work advance --gate-decision FILE` supplies its decision; protected stage decisions use the separate `--decision FILE`. Gate exit codes: 0 passed, 1 failed, 3 pending, 4 incomplete; invalid input/signatures return 2.

`review --item FILE --evidence RESULT_JSON --ref HEAD` maps requirements to checks and rejects stale commit/policy evidence. Technical completeness does not establish code correctness or governance approval. An artifact-only CI job can retain this output without posting comments or modifying trackers.

## Small changes

Teams can define `lifecycle.paths`, mapping names to ordered stage lists, with allowed work kinds in `lifecycle.pathKinds`. Use `work new --path NAME` and explain suitability in `fields.pathReason`. Paths must start at Discover and retain Verify, Accept, Release and Retire in order. Shorter paths preserve protected decisions; teams select relevant gate fields. The default remains the full lifecycle.

`review --baseline REPORT_JSON` compares check outcomes against evidence for the merge/commit base under the same policy. It reports unchanged, improved and changed outcomes without suppressing current failures. `controls` maps policy rule IDs to concrete mechanisms and distinguishes guidance from automated checks.

Ready defaults also require reproduction/expected/observed behavior for bugs, impact/mitigation for incidents, question/completion condition for investigations, and audience for documentation. Teams may configure `kindFields` to match their process.
