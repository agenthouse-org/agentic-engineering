# 0015 — Consumer assessments, discovery and incoming review

Date: 2026-09-24. Status: accepted implementation decision for the requested change.

Add a lifecycle-specific technical feasibility skill and deterministic committed
inventory helper. Keep assessment completeness, technical evaluation and governance
approval distinct. Linked assessment bundles participate in ready completeness;
they cannot become successful build checks by renaming their output.

Keep plugin discovery separate from repository runtime/policy authority. Existing
Codex/Claude manifests package the same generated skills. Plugin entrypoints route
enrolled work to the exact repository pin and stop with enrollment guidance when
no pin exists, except explicitly requested bootstrap/help operations. Retain
central storage and existing legacy projections rather than silently migrating
private installations back to repository-local host files.

Add read-only evaluation plans and explicit check provenance. Organize discovery
by lifecycle with administration in the extended map.

Incoming URL review is a provider-neutral agent workflow using available read
connectors, not an assertion of built-in tracker support. Prose criterion IDs
require human confirmation. Baseline comparison annotates inherited failures
without making them pass. Open requirements yield incomplete review evidence.
Disposable recipes remain inspected agent instructions rather than automatic
execution of incoming repository content. A configurable verify gate can require
specification evidence; no external tracker enforcement is implied.

Limitations: native plugin search across all hosts, live provider access and
project-specific container recipes require consumer validation. No publication or
new hosted release is implied by these source changes.
