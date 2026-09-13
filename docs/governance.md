# Governance, foundational ADRs, and autonomy

> Design specification. A runnable 0.1.0 preview now implements part of this specification. See [implementation status](implementation-status.md) and [operating guide](using.md) for the exact shipped commands, configuration, and remaining work. Earlier proposed-interface examples below are not a compatibility promise.


Status: confirmed governance direction. The preview implements policy resolution, signed decisions and direct delegation; broader governance records and provider workflows below remain target behavior.

## Authority and process

The organization names a central architecture/AI governance owner responsible for exceptions to organization-wide decisions. The owner can delegate approval authority. Teams define their governance workflow, including how requests are raised, reviewed, and recorded, within the authority granted to them.

This is governance rather than merely a technical gate. A CI job can verify that required evidence or an approval is present and valid; a passing job does not create the authority to approve an exception. An agent may prepare an assessment or request; whether it may resolve a decision depends on explicit policy and delegated authority.

## Foundational decisions

An organization policy package distributes foundational ADRs with stable identifiers and these proposed fields:

| Field | Meaning |
| --- | --- |
| Identifier and revision | Stable decision identity and exact revision |
| Status | Proposed, accepted, deprecated, or superseded |
| Owner | Accountable governance role or group |
| Scope | Applicable organizations, teams, repositories, components, or environments |
| Context and decision | Why the decision exists and what was decided |
| Rule references | Explicit policy rules derived from the decision |
| Authority class | Mandatory constraint, overridable default, or advisory guidance |
| Effective date | When the decision applies |
| Supersedes | Prior decisions replaced by this decision |
| Exception route | Authority and process for requesting a deviation |
| Authoritative source | Git or the external system selected by the group |

ADRs explain decisions; explicit rules express checkable obligations. Do not automatically interpret arbitrary prose as enforceable policy. Accepted decisions travel together with their referenced rules and provenance in a versioned policy snapshot.

## Composition and conflicts

1. Resolve applicable framework, organization, team, and project sources at identified revisions.
2. Apply mandatory constraints according to authority and scope.
3. Apply defaults only where an authorized, more specific choice has not replaced them.
4. Apply valid, scoped exceptions through the organization's exception route.
5. Report the effective result with provenance and unresolved conflicts.

Conflicting mandatory constraints produce an explicit unresolved policy result. The installer or agent must not guess an authority winner. A project can add stricter requirements within its authority; changing ownership or weakening an inherited constraint requires an authorized policy change or exception.

## Delegations and exceptions

A proposed delegation records the delegating authority, delegate, decision categories, permitted scope, validity interval, revocation status, and whether further delegation is permitted. Further delegation is disabled unless explicitly granted. A team cannot grant itself authority it has not received.

An exception records the affected rule and revision, scope, rationale, requested duration, evidence, compensating measures where needed, decision, approver, authority reference, and expiry or review date. Workflow states are mapped from the group's chosen tool; names of states alone do not prove approval.

Offline records must preserve the last verified authority snapshot and its validity. A decision requiring a fresh central approval remains pending when its provider is unavailable. Other permitted local work may continue. Expired or revoked authority must not silently become an approval.

## Easy-to-use autonomy profiles

Proposed starter profiles minimize setup. Organizations can tailor the permitted actions behind them; the profile name is not the enforcement mechanism.

| Profile | Intended experience |
| --- | --- |
| Supervised | Agents investigate, prepare plans and changes, and gather evidence; people resolve the configured approval points |
| Bounded autonomy | Agents perform explicitly allowed routine actions; exceptional or higher-impact actions follow the configured approval route |
| Delegated operation | Agents carry out defined workflows within explicit scope, credentials, budgets, and decision authority; actions beyond that authority escalate |

Onboarding presents a short explanation of the inherited profile and asks only questions that are not already answered by policy. Advanced action-level controls remain available without making every developer complete a governance questionnaire.

Suggested action dimensions are environment, change impact, reversibility, affected resources, credential scope, monetary or compute budget, and evidence requirements. Independent assessment, separation of duties, and human approval are configured requirements, not universal assumptions that every action needs a meeting.

## Enforcement and evidence

Distinguish four results: advisory assessment, local technical feedback, authoritative technical check, and governance decision. Link each to its rule identifiers, evidence, tool version, policy revision, and applicable artifact revision.

Local hooks improve feedback latency but may be unavailable or bypassable. Required boundary controls must run in a trusted integration appropriate to the repository. A rule without a working enforcement mechanism must be labeled advisory or unavailable, never presented as enforced.

Provider outages have policy-defined behavior by action. Unknown authorization for an action that requires approval means pending approval, not implicit permission. This should not block unrelated read-only investigation or already-authorized work.
