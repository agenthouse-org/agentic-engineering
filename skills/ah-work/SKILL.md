---
name: ah-work
description: "Use agenthouse work when the user requests this framework operation. Choose new, show, or advance from the request."
license: MIT
---

# agenthouse work

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Choose new, show, or advance from the request. Default to show when the action is unclear. Get missing identity/outcome from the user rather than fabricating it. Stage transitions require actual fields and applicable signed decisions; never manufacture approval.

CLI reference:

```text
work new --id ID --title "Outcome" [--kind feature|bug|incident|change|investigation|documentation] [--path NAME]
work show --id ID
work advance --id ID --to STAGE [--decision REPOSITORY_RELATIVE_FILE] [--gate-decision FILE] [--policy-file FILE]
Edit fields in .agenthouse/work/ID.json. Stages require evidence and applicable approvals.
```
