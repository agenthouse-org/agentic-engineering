# ADR-0011: Ticket size, scope creep, and related branches

Status: accepted product direction, 2026-09-21. Ready-gate size findings, ask-first split work and branch creation, and repo-stored branch naming are implemented. Remote tracker auto-create and push/PR remain out of scope.

## Context

Lifecycle records already capture outcome, scope, and acceptance criteria. Agents still tended to keep oversized tickets as one change, or absorb mid-flight asks that belong on a separate item. Teams also need a local, tracker-agnostic way to name and create related Git branches when splitting work.

## Decision

Treat ticket size as **advisory judgment plus a thin ready-gate check**. When `criteria.length` exceeds a configurable `maxCriteria` (default 8) or `fields.sizeRisk` is `oversized`, the ready gate emits a `ticketSize` finding with status `pending` unless `fields.sizeOverride` records an explicit user reason to proceed. Disable with `lifecycle.ready.ticketSize: false`.

During implementation, if a new ask falls outside recorded scope or criteria, the agent **warns, stops**, and Decide among: expand the record, override with a short `fields.scopeNotes` reason, or open **new** local work. New work and branches are **ask-first only**.

Store the team's branch naming standard in project config as `git.branchNaming` (`pattern`, optional `example`, optional `baseDefault`). Placeholders are `{id}`, `{slug}`, and `{kind}`. Onboard or first branch use captures the pattern. `work branch --id ID [--from REF] [--parent ID]` creates and checks out a branch from a chosen base when the working tree is clean, writes `fields.branch`, and does not push or open a PR.

## Consequences

Oversized work surfaces before Implement without inventing story points. Users can override size or mid-flight scope with an explicit reason. Split/follow-up work can get a related branch using the repository's own naming convention. See [lifecycle](../lifecycle.md) and [workflow tools](../workflow-tools.md).
