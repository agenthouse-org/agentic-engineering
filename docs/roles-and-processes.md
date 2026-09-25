# Roles and product processes

agenthouse includes generic role and product-process baselines. Use them as guidance alongside the existing skills and lifecycle commands. The definitions cover market discovery and validation, product decisions, engineering delivery, release, support, incidents, and learning. Optional marketing and sales methods identify their source and are not universal requirements.

## Discover and use definitions

```text
ah-engineering roles list
ah-engineering roles show --id product-manager
ah-engineering roles use --id engineer
ah-engineering process list
ah-engineering process show --id bug
ah-engineering process start --id feature-request
ah-engineering process where --description "Customers report that checkout fails after payment"
```

`roles use` prints a role for the current task. The `ah-roles` agent skill uses its purpose, responsibilities, and boundaries to frame the current task; role descriptions do not grant credentials or governance approval. `process start` presents guidance and linked roles/skills; it does not create a work item or record process state.

`process where` makes a tentative suggestion from the description supplied. It does not read an external tracker, update status, or approve a transition. Confirm the actual stage and status source with the user or the configured system of record. If evidence is ambiguous, the result remains ambiguous.

## Create consumer-owned global copies

Adopt the definitions you want to customize:

```text
ah-engineering roles adopt
ah-engineering process adopt
```

By default copies live under `~/.agenthouse/global/`, or `$AGENTHOUSE_HOME/global/` when `AGENTHOUSE_HOME` is set. Set `AGENTHOUSE_GLOBAL_REPO` to an absolute path to use a different consumer-controlled directory or repository. It is a separate subdirectory from versioned runtime assets. An organization can share the global repository using its own approved distribution method; agenthouse does not host or synchronize it.

The first adoption creates `roles/`, `processes/`, and `.agenthouse-global/` state with baseline version and content digest. It never overwrites a pre-existing consumer file. Inspect any adoption conflicts manually. Edit copied JSON definitions directly; their schema is validated when displayed or merged. Keep this repository backed up and share it only according to the organization's data policy.

Use `--repository PATH` to select a repository for one operation. Otherwise the configured/default global location applies. Project records do not silently rewrite the global copy.

## Review and adopt baseline updates

```text
ah-engineering roles check
ah-engineering process check
ah-engineering roles check --id engineer
```

The check reports available baseline changes, local edits, and fields that conflict under a three-way merge. A retired baseline is reported for manual migration; its consumer copy remains intact. Read the diff before choosing:

```text
ah-engineering roles merge --id engineer
ah-engineering roles ignore --id engineer
```

Merge uses the saved base, the consumer's current copy, and the newer baseline. If both sides changed the same field, it reports the conflict and leaves the file unchanged. Resolve the fields in the consumer copy and review again before merging. Ignore records the currently available baseline revision as deferred; it does not alter the local definition. Merge and ignore are explicit operations. Framework runtime updates do not apply baseline changes automatically.

Baseline metadata and prior snapshots are retained in `.agenthouse-global/` so a later update can compare against the revision last adopted. For offline use, these definitions arrive inside the framework package/bundle; no update command fetches them implicitly. A consumer can inspect and adopt only the baselines present in the pinned runtime.

## Included baseline definitions

Roles: product manager, market researcher, engineer, support specialist, and sales specialist.

Processes: product lifecycle, market validation, feature request, bug, change, release, and incident response.

Specialist skills remain owned by their upstream or framework projects. The baseline points to skill identifiers and reports whether those methods are mapped, available in the pinned package, or missing. An unmapped role/process is reported as a candidate gap for consumer review; it is not a required failure. The baseline does not copy specialist instructions into role definitions.

## Current limits

Baseline files are JSON and versioned with the framework source. Consumers manage their own global repository, backups, sharing, and retention. The current `process where` helper uses simple text cues and is advisory; it is not semantic analysis. External tracker connections, automatic notifications, hosted synchronization, cross-consumer policy distribution, and universal marketing/sales frameworks are not included.
