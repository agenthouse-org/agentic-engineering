---
name: ah-work
description: "Create, show, advance, or branch a local lifecycle work item under .agenthouse/work. Use when filing a story, opening a work record, moving it to a new stage, or creating a related Git branch."
license: MIT
---

Generated from ah-engineering 1.4.0.

# agenthouse work

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Choose new, show, advance, or branch from the request. Default to show when the action is unclear. Get missing identity/outcome from the user rather than fabricating it. Never create a work item or Git branch unless the user explicitly says yes. When splitting oversized or out-of-scope work: ask to create the follow-up item, then offer work branch from a chosen base using git.branchNaming; if the pattern is missing, ask for the team standard and store it through onboard --branch-pattern PATTERN, which validates and resolves configuration. Stage transitions require actual fields and applicable signed decisions; never manufacture approval.

CLI reference:

```text
work new --id ID --title "Outcome" [--kind feature|bug|incident|change|investigation|documentation] [--path NAME] [--parent ID]
work show --id ID
work advance --id ID --to STAGE [--decision REPOSITORY_RELATIVE_FILE] [--gate-decision FILE] [--policy-file FILE]
work branch --id ID [--from REF] [--parent ID]
Edit fields in .agenthouse/work/ID.json. Stages require evidence and applicable approvals.
work branch requires git.branchNaming.pattern, a clean tree, creates and checks out the branch, and does not push.
```
