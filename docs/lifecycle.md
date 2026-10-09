# The agenthouse lifecycle

Use the smallest evidence set that demonstrates the requested outcome. Keep work scoped and link each requirement to its verification. The lifecycle record is stored as `.agenthouse/work/<id>.json`; long explanations and artifacts can be referenced from its fields.

Before planning or making a change, load applicable engineering guidelines and assess the approach against them (`engineering.guidelines-before-change`). Follow mandatory rules, explain relevant deviations, and run applicable automated checks during verification. Ask only when guidance conflicts, a material decision is missing, or an exception needs authorization. See [engineering guidelines](engineering-guidelines.md) for discovery, assessment, and compatibility.

| Stage | Record before leaving the stage |
| --- | --- |
| discover | `outcome`: actor, desired observable change, success measure, exclusions |
| define | `scope`, `acceptance`: coverage, dependencies, assumptions, examples of success/failure |
| design | `decisions`: chosen approach, alternatives, inherited ADRs, risks and exceptions. Optional `visualPlan`: repository-relative visual-plan JSON for wireframes and mermaid |
| plan | `verification`: concrete checks, fixtures, relevant environments, independent review where required |
| implement | `changes`: revision/build, decisions made during implementation, remaining gaps |
| verify | `evidence`: actual automated results, browser evidence for UI work, unresolved findings |
| accept | `acceptanceEvidence`: which criteria were met, who/what assessed them, approval reference |
| release | `releasePlan`, `rollbackPlan`: target, deployment sequence, recovery trigger and method. For a public npm package, `npm-provenance` inspects or adds registry attestations; it does not publish |
| operate | `serviceObjectives`, `runbook`: observable service health, incident response and ownership |
| learn | `learning`: measured result, incidents, prevention and improvement proposals |
| retire | `retirement`: decommissioning, retention/deletion decisions, dependency and ownership closure |

For cross-functional product guidance beyond engineering work records, see [roles and product processes](roles-and-processes.md). Those process definitions guide work without owning external status.

For a bug, record reproducible actual versus expected behavior and preserve failing-before evidence when available. For an incident, recovery may happen before ordinary implementation planning under the organization's emergency process; the lifecycle record is retrospective evidence, not permission to defer urgent authorized recovery.

For frontend work derive acceptance from an image, wireframe, story, or bug report. Use the frontend-acceptance skill when installed. For UI layout or data-model shape that must be seen before code, use `ah-visual-plan` and `visual-plan check`; skip it for trivial work. Capture the real UI; write inspection screenshots only under `.agenthouse/evidence/<work-id>/`; inspect them; record findings on the work item; run `housekeep`. Never write galleries to `tests/output`. Do not commit inspection screenshot galleries. Baseline regression, design conformance, interaction correctness, and accessibility are complementary. Do not replace missing concept assessment with an image similarity number.

Never change a test, baseline, threshold, scope, or policy solely to make an evaluation green. A justified change belongs in the decision/evidence trail. When a requirement is wrong, record the correction and re-evaluate affected criteria.

## Before opening an MR/PR

**`git.integrate-target-before-review` (advisory):** Identify the project's intended target branch (for example `main`, `develop`, or `master`) and ask the user to integrate its latest changes into the working branch. Guide them through the project's merge or rebase workflow, resolve conflicts, and rerun relevant checks. Respect existing authorization and project policy; if declined or unavailable, disclose that integration remains outstanding.

Use project conventions and available context; ask if the target is ambiguous. Preserve user changes. Skip redundant integration when the branch is already current; if offline or freshness cannot be verified, disclose that limitation. This recommendation neither authorizes Git operations by itself nor adds a required gate.

## Ticket size and scope creep

Ready gates treat oversized work as a pending `ticketSize` finding when there are more than `lifecycle.ready.maxCriteria` criteria (default 8) or `fields.sizeRisk` is `oversized`, unless `fields.sizeOverride` records an explicit user reason to proceed. Disable with `lifecycle.ready.ticketSize: false`. Prefer splitting into thinner local work items.

When splitting or opening follow-up work for scope creep: ask before `work new`; then offer a related Git branch with `work branch --id ID [--from REF] [--parent ID]`. Store the team's naming standard in `.agenthouse/config.json` as `git.branchNaming` (`pattern` with `{id}`, `{slug}`, optional `{kind}`; optional `example` and `baseDefault`). Mid-flight asks outside recorded scope: warn, stop, and Decide among new work, expand scope/criteria, or override with `fields.scopeNotes`.

Optional linkage fields: `fields.parentWork`, `fields.relatedWork`, `fields.branch`.

`work advance` verifies required record fields and applicable signed transition authority. Field completeness is not proof of product correctness; configure executable and assessment evaluators for that. Use organization policy for gate coverage and a protected CI job for authoritative technical checks. Local records and private signing keys are under the user's control; they are not a defense against a malicious repository owner.
