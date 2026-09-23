# ADR-0007: Generated project assets and exact-pin restoration

Status: superseded for new enrollment by [ADR-0014](0014-central-storage-and-repository-integration.md). Retained for legacy project-copy compatibility.

Project configuration, policy sources and snapshots, work records, installation ownership, and the active runtime/dependency identity remain project authority. Generated agenthouse skill resources and host command projections are disposable installation output.

New installations ignore their exact owned skill and command paths. Existing installations retain their ignore behavior unless they explicitly adopt it with `restore --ignore-generated`. Never ignore entire host directories: consumer-owned skills, commands, settings and hooks must remain visible to Git.

Provide `restore` independently of interrupted-transaction `recover`. Restore uses the exact active payload digest and recorded agent set, refuses conflicting edits or different generated projections, and preserves configuration and resolved policy snapshots. Sources are the verified cached runtime, an exact executing package, or the original unsigned offline bundle whose canonical payload digest matches the project manifest. No implicit network access, global-version substitution, or governance approval is introduced.

Keep ordinary project files and reject symlinked managed paths in diagnostics. Shared storage and filesystem deduplication are deferred. This decision removes Git duplication, not physical disk duplication.
