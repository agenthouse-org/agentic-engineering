# Functional parity and replacement readiness

Assessment date: 2026-09-14. Compared the supplied reference snapshot with framework 0.1.3 at commit `75d55bb`. This is a source-level comparison, not a validation of the live company's deployment. The snapshot remains private and is not distributed with this report.

**Verdict: suitable for an isolated pilot, not yet a functionality-preserving replacement.** Agent-command coverage does not establish behavioral parity. Several original scripts and detailed policies have only brief agent instructions or generic contracts as replacements.

## Capability comparison

| Existing capability observed in the snapshot | Generic implementation today | Required before retiring the equivalent component |
| --- | --- | --- |
| Claude marketplace catalog and multiple plugin manifests | Project skills, native command aliases, npm package; no marketplace manifests | Package and verify a native Claude plugin/catalog or explicitly adopt a tested alternative installation flow |
| SessionStart hook detects enrollment and applicable stack standards | Advisory session instruction and manually/agent-invoked session CLI | Versioned hook integration with enrollment/stack discovery and tested session delivery |
| PreToolUse guard rejects selected Git bypass/force-push commands | No equivalent active guard | Configurable command protections in agenthouse-hooks, tested for actual host payloads; retain server-side controls |
| PostToolUse feedback runs existing Pint, PHPStan, or ESLint on touched files with timeouts | Manually invoked/configured evaluators; no automatic edit feedback | Hook integration for touched-file checks, missing/broken tooling, timeouts, and error delivery |
| Enrollment survey measures Git conventions, stack, tooling, agent files, and pipeline | Guided agent/policy/autonomy selection; doctor checks installation | Read-only repository survey and evidence-based configuration proposals; preserve existing settings |
| Commit-impact script classifies changes and finds candidate tests | ah-check-commit describes the method; no impact-analysis implementation | Generic change analysis with merge/root-commit/range cases, configurable work-item references, and explicit heuristic limits |
| Review survey discovers suites, merge base, added suppressions/residue, and local work items | ah-review-change plus configured evaluation | Reusable survey and criterion-to-test evidence mapping; baseline comparison; structured review output |
| Detailed Definition of Ready and Definition of Done criteria | Short readiness/review skills and stage field-completeness checks | Versioned configurable criterion sets, applicability, traceability, and separate evidence/judgment outcomes |
| Feature specification bundles and failing acceptance tests before readiness; distinct bug/technical paths | Generic lifecycle and brief regression-test guidance | Explicit specification/test-first workflow and evidence contract where policy requires it |
| Formal separation of drafting, independent assessment, human readiness, and acceptance | Signed transitions and direct delegation; skills defer to team independence rules | Express the original organization's roles and independence constraints explicitly; verify violations cannot silently pass |
| Lightweight path with exclusions and local decision records | Proportionality described; stage transitions remain adjacent | Configurable small-change path with explicit eligibility and audit records |
| Markdown backlog conventions plus tracker resolution guidance | Local JSON work records; no backlog migration or native tracker synchronization | Preserve existing item IDs/links and storage choice; migration/adapter tests before changing authoritative records |
| Detailed PHP/Laravel conventions spanning language, architecture, data, security, and tests | Small optional command template and four principles | Reviewed stack policy/module and mappings to project tooling; keep company-specific choices in private policy |
| Included usability audit harness using browser, axe, HTML checks, criteria references, and report templates | Required frontend acceptance method and Playwright evidence adapter; usability wrapper requires optional import | Versioned usability dependency with tool provisioning and verified reporting if the existing installation uses this audit |
| Proposed GitLab pipeline produces evidence then invokes an advisory review agent | Deterministic evaluator templates, no agent-review CI job | Optional artifact-reading agent-review job and real pipeline verification if this workflow is required |
| Claimed rule enforcement across review, hooks, and CI | Generic policy/evaluator/signed-decision contracts | Per-rule map of intent, authority, actual enforcement mechanism, and tested failure behavior |

The snapshot's GitLab agent-review template explicitly says it has never run. Its comments also identify missing mechanical CI checks. Those are pre-existing unfinished work, not proven functionality lost in this migration. Likewise, source presence of a guard does not establish complete protection against all command forms. Preserve intended behavior while testing both old and new implementations.

## What the generic framework adds

- Standalone CLI evaluation with distinct failed, error, pending, and incomplete results; JSON/JUnit/HTML reports.
- Managed enrollment, ownership/conflict detection, recoverable updates, offline bundles, pins, and rollback.
- Source-preserving required frontend-acceptance dependency with version, commit, and hashes.
- Visual contracts for images, stories, and bugs, with screenshot provenance and separate concept assessment.
- Policy composition, frozen snapshots, and scoped signed decisions with direct delegation.
- Broader lifecycle records and agent command projections.

These additions do not compensate for an omitted control. Forty-nine passing local tests demonstrate the implemented contracts, not equivalence with the reference framework.

## Ownership and sequence

1. **agenthouse-hooks:** normalized native events, command guards, automatic touched-file feedback; fix known CI malformed-input behavior before relying on it as a required gate.
2. **agenthouse engineering:** repository survey, impact/review tooling, configurable readiness/done contracts, specification workflow, migration utilities, distribution and CI composition.
3. **agenthouse-skills:** reusable specialist review/testing/usability methods and versioned resources. Keep the framework's workflow entry points thin.
4. **Company policy repository:** foundational ADRs, required stack conventions, approval roles, independence rules, branch protections, tracker mappings, and approved exceptions.

Prioritize native feedback/guards, policy parity, executable review helpers, and any currently used usability checks before removing the corresponding old components. Marketplace convenience and new external connectors should not distract from preserving an existing control.

## No-loss cutover rule

For every live capability, record an owner, the actual current evidence, replacement location/version, acceptance test, and rollback route. Keep it active until its replacement passes or the authorized governance owner explicitly accepts its retirement. An unsupported requirement remains a blocker; it cannot be converted to advisory prose silently.

Start by comparing the live company repository to this snapshot-based report. Use a migration branch and isolated application checkout. Run intentional failures as well as successful checks; exercise command discovery in the real Claude environment and verify company CI. Preserve identifiers, links, settings, and approval ownership. The first Claude handoff is an inventory and gap-closure proposal, not authorization to cut over.

Making the upstream repository public changes access, not release readiness. A public Git repository is not an npm publication or a reviewed marketplace listing. Use an exact commit and a verified locally built/internal package until release distribution is established.
