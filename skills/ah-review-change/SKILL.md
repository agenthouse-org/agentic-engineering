---
name: ah-review-change
description: "Review a change against its requirements, policy, and available evidence, and report findings. Use when reviewing a pull request, diff, or implementation against a work item."
license: MIT
---

# agenthouse review-change

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use survey and inspect to establish repository facts. Run review with the actual item, change ref and evidence paths when available. Resolve requirements from local records or configured tools. Read the diff and applicable policy.

Reply as Decide / Findings / Evidence. Do not narrate the whole change unless the user asks.

Decide:
1. Meet requirements? yes / no / blocked-on-evidence
2. Findings that must be fixed before merge (location + impact)
3. Missing visual or mermaid artifacts if the work claimed a UI or data-model change

Run relevant available checks through the configured CLI and inspect UI screenshots through frontend-acceptance when applicable. Distinguish baseline defects and missing evidence. Disclose if you authored the change. A review report does not approve, merge, or mark work done.
