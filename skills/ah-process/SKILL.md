---
name: ah-process
description: "Navigate the product lifecycle or subprocesses for features, bugs, changes, releases, and incidents, or request orientation about current evidence. Use when starting product-process guidance or asking where work stands. Process guidance does not track or change status."
license: MIT
---

Generated from ah-engineering 1.4.0.

# agenthouse process

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use process list/show to select applicable guidance and process start to present stages, roles, outputs, and linked skills. Do not create tracker state unless separately requested. For “where are we?”, gather evidence, use process where, state its uncertainty, and ask the user to compare with authoritative status. Never invent progress, transition, acceptance or approval.

CLI reference:

```text
process list
process show --id PROCESS_ID
process start --id PROCESS_ID
process where --description "current situation and evidence"
process adopt [--id PROCESS_ID] [--repository PATH]
process check [--id PROCESS_ID] [--repository PATH]
process merge --id PROCESS_ID [--repository PATH]
process ignore --id PROCESS_ID [--repository PATH]
Navigate product lifecycle processes and subprocesses. Start prints guidance; it does not create or track workflow status. Where gives tentative orientation from supplied text and asks you to confirm against the authoritative status source. Consumer copies use AGENTHOUSE_GLOBAL_REPO or ~/.agenthouse/global. Baseline updates require explicit review and merge.
```
