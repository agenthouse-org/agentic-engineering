# Delivery plan and acceptance criteria

> Design specification. A runnable 0.1.0 preview now implements part of this specification. See [implementation status](implementation-status.md) and [operating guide](using.md) for the exact shipped commands, configuration, and remaining work. Earlier proposed-interface examples below are not a compatibility promise.


Status: delivery roadmap. An installable local 0.1.0 preview implements the core; implementation-status.md maps completed behavior and verification. The full acceptance criteria below still include open native-host, service, cross-platform and live-pilot work.

## Completion standard

The intended product is a complete agentic engineering framework. The current documents establish its design; they do not fulfill the runnable product requirements. A slice is complete only when its behavior exists, its meaningful failure paths have been tested, its documentation describes the implemented result, and its limitations are explicit.

## 1. Contracts and policy resolution

Deliver versioned schemas for framework configuration, policy sources, foundational decisions, rules, delegations, exceptions, resolved snapshots, evidence, and decision requests/responses. Provide generic enterprise and individual examples and a resolver with provenance diagnostics.

Acceptance: a project overrides a permitted default; cannot silently weaken a mandatory rule; applies a valid scoped exception; rejects an expired or out-of-scope delegation; exposes conflicting mandatory rules; and produces the same resolved snapshot for the same input revisions.

## 2. Installer and distribution

Deliver project/user installation, agent detection, explicit host selection, enrollment, diagnostics, removal, and noninteractive configuration. Choose package coordinates, runtime dependencies, artifact layout, and release trust mechanism during this slice.

Acceptance: fresh installation and repeated installation on Windows, macOS, and Linux; preserve existing instruction/hook files; recover from interruption; handle a locked file, a path with spaces, and a user-modified managed file; install from a private source behind a proxy/custom CA; install fully offline with network disabled; removal preserves consumer-owned data.

## 3. Updates and reproducibility

Deliver update discovery, staged activation, compatible update policy, organization-approved channels, exact resolution records, pinning, rollback, and offline update import.

Acceptance: unchanged task snapshot during normal updates; explicit handling for breaking changes and policy changes; unknown or tampered release rejected; interrupted download leaves active installation intact; incompatible dependency rejected; modified project files preserved; failed health check restores known-good assets; CI reconstructs a declared version set; offline update requires no undeclared fetch.

## 4. Skills and stack modules

Consume identified versions from agenthouse-skills. Integrate the hook runtime without duplicated vendor translation. Provide initial PHP/Laravel and Node.js/TypeScript modules, each generic and optional.

Acceptance: skill source/version/digest/license are recorded; offline bundle is self-contained; update occurs from the upstream dependency instead of a local fork; disabling an unrelated module leaves the core usable; actual project verification commands are selected correctly; hook initialization does not duplicate existing handlers.

## 5. Coding-agent compatibility

Implement and verify Claude Code, Codex, OpenCode, Cursor, Windsurf, and OpenClaw adapters. Record capabilities and tested versions/operating systems rather than a single undifferentiated support claim.

Acceptance for each host: documented installation scope; instructions and applicable skills discoverable; supported hook events exercise the expected checks; unsupported controls explicitly reported; existing user settings preserved; update/reload behavior verified; uninstall/reinstall verified. Hosts or operating systems that cannot be exercised remain visibly unverified and prevent an unqualified full-coverage launch claim.

## 6. Full lifecycle workflows

Deliver guidance, templates, and callable workflows for all lifecycle stages in the blueprint, with evidence appropriate to the change. Include release/recovery, operations/incidents, learning, and retirement rather than stopping at code review.

Acceptance: one feature, one bug, one small documentation change, one architectural exception, one release failure/recovery, and one operational incident travel through appropriate paths. An agent cannot turn its own unsupported success assertion into accepted evidence. Changed artifacts invalidate affected revision-bound approvals. Small work does not require irrelevant artifacts.

## 7. Governance and integrations

Deliver local records first, then tested GitHub/GitLab, Jira/Wrike, and selected documentation adapters. Design external writes for revision conflicts and safe retries. Implement the decision-provider interface with a local/open implementation before adding an optional hosted provider.

Acceptance: central owner can delegate a scoped approval; unauthorized approver rejected; team workflow mappings honored; provider outage leaves a required approval pending; approved unrelated local actions remain available; Git defaults to authority when unspecified; Confluence enhancement preserves source identity; a group-selected external authority supplies revisioned snapshots; repeated writes do not create duplicate records.

Not all platform operations need to exist at once. Publish the exact supported operations and verification evidence for each adapter. A documentation publisher must not be advertised as a complete two-way governance integration.

## 8. Pilot migration and public release

### Release prerequisites: visual acceptance and CI/CD

Implement the [frontend acceptance contract](visual-acceptance.md) and [evaluation CLI](cli-evaluation.md) as first-class release requirements. These build on contracts, skills, and distribution; they are not optional future refinements to the initial usable framework.

Visual acceptance must cover reference-image concepts, story-only UI criteria, and bug-report reproduction/fix evidence. Integrate Playwright capture/regression, criterion-based conformance assessment, behavioral verification, baseline governance, and inspectable evidence reports. Reuse frontend-acceptance upstream for the agent-facing method without treating skill prose as a pipeline runner.

CLI delivery must include noninteractive frozen evaluation, organization-owned script adapters, structured results, documented exit statuses, JSON/JUnit/HTML reports, and working GitHub Actions/GitLab CI examples. Publish a provider-neutral recipe for other CI systems. Run the meaningful failure, incomplete-evidence, offline, and platform scenarios in the two linked specifications before claiming support.

The enterprise pilot must integrate one existing organization-owned evaluator through the CLI. Both pilots must exercise a UI task: collectively cover image-backed, story-only, and bug-report acceptance. Demonstrate that an unchanged but wrong design can fail conformance, and that failed pipeline evaluation retains downloadable evidence without turning the job green.

### Migration and publication

Execute both pilots from the migration plan. Keep temporary aliases thin and remove duplicated hook execution. Prepare MIT release artifacts with dependency license notices and a contribution/release process.

Acceptance: both pilots meet their success criteria; actual release archives contain no input material or company-specific references; docs links and schemas validate; offline/private update paths pass; compatibility claims match evidence; rollback is demonstrated; install instructions reference a real published or explicitly private artifact.

## Unresolved implementation choices

- Installer runtime, package coordinates, binary/archive formats, and dependency strategy.
- Release signing and enterprise trust bootstrap.
- Existing hook-runtime version/API suitable for dependency use.
- Tested current versions and actual capabilities of each target coding agent.
- First documentation-platform operations to implement and external authority snapshot format.
- Real enterprise consumer repository and independent pilot repository locations.

These choices do not reopen the confirmed product and governance decisions. Resolve routine engineering choices during implementation; ask for organization-specific information only when required by the pilot.
