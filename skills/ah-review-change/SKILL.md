---
name: ah-review-change
description: "Review a change against its requirements, policy, and available evidence, and report findings. Use when reviewing a pull request, diff, or implementation against a work item."
license: MIT
---

Generated from ah-engineering 1.6.0.

# agenthouse review-change

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use survey and inspect to establish repository facts. Run review with the actual item, change ref and evidence paths when available. Resolve requirements from local records or configured tools. Read the diff and applicable policy.

Reply as Decide / Findings / Evidence. Do not narrate the whole change unless the user asks.

Decide:
1. Meet requirements? yes / no / blocked-on-evidence
2. Findings that must be fixed before merge (location + impact)
3. Missing visual or mermaid artifacts if the work claimed a UI or data-model change

Run relevant available checks through the configured CLI and inspect UI screenshots through frontend-acceptance when applicable. Distinguish baseline defects and missing evidence. Disclose if you authored the change. A review report does not approve, merge, or mark work done.
