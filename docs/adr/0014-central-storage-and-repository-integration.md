# ADR-0014: Central storage and explicit repository integration

Status: accepted product direction from repository owner, 2026-09-23; implemented for version 1.2.0.

Supersedes the new-installation defaults of ADR-0007 and the blanket ignore/deletion behavior of ADR-0010. Exact-pin restoration, policy authority, upstream specialist ownership and governance boundaries remain in force.

## Decision

`AH-STORAGE-001`: Store runtime and framework skills centrally for the current machine user, keyed by exact payload identity. Store bundled specialist skills unchanged, keyed by verified upstream identity; retain provenance and licensing. New repositories must not receive copies of skills, native command catalogs or runtimes. Per-project pins select versions independently. Store no absolute machine paths in shared pins. Offline restore must require exact source content, and diagnostics must detect modified shared assets.

`AH-INTEGRATION-001`: Onboarding must explicitly distinguish shared repository integration from private local integration. Shared mode commits only project state and small instruction bridges. Private mode leaves tracked instruction files and shared ignore settings untouched and excludes its local state. Explain context loading, teammate/CI setup and native-host limitations. Do not imply that ignoring a file hides changes to an already tracked file or that central storage registers every host's skill menu. Preserve existing installation choices on updates; migration is explicit and conflicts preserve consumer content.

`AH-ARTIFACT-001`: Generated execution output must remain excluded from commits in every integration mode. Classify output and source fixtures/baselines per repository, verify effective Git exclusions and indexed files, and repeat the check after central evaluation. Errors and missing exclusions cannot pass this check. Retain evidence for review; deletion requires explicitly configured disposable paths and an explicit cleanup command. Never infer permission to delete from an untracked filename, screenshot dimensions or a conventional directory name.

Configuration resolution is not governance approval. Configuration-writing paths should validate and refresh their snapshot together, restoring prior configuration on failure. Manual edits still require an explicit resolve; frozen evaluation continues to reject stale or modified snapshots.

## Consequences and limits

A fresh clone needs the exact runtime/skills in its machine cache or an exact offline restore source. Private use does not onboard teammates or CI. Small shared bridges use the project launcher to print the pinned central context. Native menus and host filesystem permissions require separate verification.

Legacy project-copy installations remain compatible until explicitly migrated. Unchanged owned copies can be removed during migration; user modifications block activation, consumer-owned resources survive, and old caches are retained for recovery. Shared-cache removal and historical runtime compatibility are not inferred.

The artifact check covers configured locations and actual Git exclusions. It cannot classify all arbitrarily named outputs or stop a bypassed local check; authoritative use requires required CI wiring. No broad baseline directory is ignored by default.

Implementation and verified fixture scope: [central installation](../central-installation.md).
