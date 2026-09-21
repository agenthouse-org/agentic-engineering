---
name: ah-work
description: "Create, show, advance, or branch local lifecycle work records. Use when filing a story, inspecting a work item, moving work to a new stage, or creating a related Git branch for a work item."
license: MIT
---

# agenthouse work

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Choose new, show, advance, or branch from the request. Default to show when the action is unclear. Get missing identity/outcome from the user rather than fabricating it. Never create a work item or Git branch unless the user explicitly says yes. When splitting oversized or out-of-scope work: ask to create the follow-up item, then offer work branch from a chosen base using git.branchNaming; if the pattern is missing, ask for the team standard and write it to config first. Stage transitions require actual fields and applicable signed decisions; never manufacture approval.

CLI reference:

```text
work new --id ID --title "Outcome" [--kind feature|bug|incident|change|investigation|documentation] [--path NAME] [--parent ID]
work show --id ID
work advance --id ID --to STAGE [--decision REPOSITORY_RELATIVE_FILE] [--gate-decision FILE] [--policy-file FILE]
work branch --id ID [--from REF] [--parent ID]
Edit fields in .agenthouse/work/ID.json. Stages require evidence and applicable approvals.
work branch requires git.branchNaming.pattern, a clean tree, creates and checks out the branch, and does not push.
```
