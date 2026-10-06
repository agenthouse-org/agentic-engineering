# ADR-0019: Signed organization channels and explicit policy adoption

Status: accepted implementation direction, 2026-10-06; authorized by the repository
owner's request to implement and release the consumer policy-tracking proposal.

## Context

Enrollment copies organization policy. Local snapshot consistency cannot reveal
whether that copy remains current or permitted. Fixed upstream specialist
dependencies must retain ownership while consumers distribute their own skills.

## Decision

Separate adopted policy identity, freshness observations and permission. Track
policy origins and exact content digests. Signed local, mounted or central-storage
channels announce recommended content and permitted digests with optional deadlines.
Observations never participate in the resolved policy digest. Discovery never
adopts; adoption requires a reviewed candidate digest and a recoverable transaction.
Frozen resolution remains deterministic and does not perform discovery. An explicit
evaluation check applies permission from locally supplied signed metadata.

Organization skill publishers receive exact identity/path/license scope through
consumer-managed trust configuration. Reuse signature, content verification and
transaction contracts without granting publishers framework or governance authority.
Upstream skills and hooks keep their existing owners. No organization-specific
host, registry, paid service or Git platform is required.

## Consequences

Existing snapshots remain compatible and report untracked upstream freshness.
Unknown authority does not pass required checks. Protected CI must supply trusted
configuration and current metadata; local state is not a malicious-owner boundary.
Signed offline metadata can become stale until expiry; local sequence memory is
replay detection, not a globally trusted freshness service. Remote transport
adapters and advanced exception management remain separate work.

Tests cover independent consumer adoption, invalid/replayed metadata, project
conflicts, publisher scope and signed skill updates. See the operating guide for
the exact limits and recovery procedures.
