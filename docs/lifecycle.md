# The agenthouse lifecycle

Use the smallest evidence set that demonstrates the requested outcome. Keep work scoped and link each requirement to its verification. The lifecycle record is stored as `.agenthouse/work/<id>.json`; long explanations and artifacts can be referenced from its fields.

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

For a bug, record reproducible actual versus expected behavior and preserve failing-before evidence when available. For an incident, recovery may happen before ordinary implementation planning under the organization's emergency process; the lifecycle record is retrospective evidence, not permission to defer urgent authorized recovery.

For frontend work derive acceptance from an image, wireframe, story, or bug report. Use the frontend-acceptance skill when installed. For UI layout or data-model shape that must be seen before code, use `ah-visual-plan` and `visual-plan check`; skip it for trivial work. Capture the real UI; inspect the screenshots. Baseline regression, design conformance, interaction correctness, and accessibility are complementary. Do not replace missing concept assessment with an image similarity number.

Never change a test, baseline, threshold, scope, or policy solely to make an evaluation green. A justified change belongs in the decision/evidence trail. When a requirement is wrong, record the correction and re-evaluate affected criteria.

`work advance` verifies required record fields and applicable signed transition authority. Field completeness is not proof of product correctness; configure executable and assessment evaluators for that. Use organization policy for gate coverage and a protected CI job for authoritative technical checks. Local records and private signing keys are under the user's control; they are not a defense against a malicious repository owner.
