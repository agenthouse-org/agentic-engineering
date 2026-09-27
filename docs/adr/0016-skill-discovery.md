# 0016: Discover installed specialist skills for roles and processes

Date: 2026-09-26. Status: accepted implementation decision for the requested change.

## Context

Role and process baselines name framework skills explicitly. Specialist methods such as frontend acceptance stay in agenthouse-skills and are installed as pinned dependencies. Copying those skill ids into every process definition would go stale when a dependency is added, removed, or imported.

## Decision

`roles show`, `roles use`, `process show`, `process start`, and the matching check views discover specialist skills at runtime. Discovery reads bundled dependency manifests and project skill imports. A packaged index records the processes, roles, and stages where a known skill is useful. An installed skill may add the same fields in its SKILL.md frontmatter. Installed specialist skills with no applicability are reported as unscoped.

Explicit baseline `skills` entries stay the mapped methods. Discovery does not copy skill instructions into consumer definitions, does not change workflow status, and does not grant approval.

## Consequences

A newly pinned or imported specialist skill appears without editing each process. Known upstream skills are mentioned only on the roles and processes named by the index or by their own frontmatter. Missing indexed skills are reported as not installed. Consumer baseline merge remains limited to the definition files.
