---
name: ah-gate
description: "Evaluate ready or done lifecycle criteria, evidence, and independent signed approval for a work item. Use when asking if a story is ready to implement or done."
license: MIT
---

# agenthouse gate

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use the requested ready or done phase. Keep completeness, evidence failure and approval pending distinct. Never fabricate acceptance evidence or sign an independent decision as the author.

CLI reference:

```text
gate --item FILE --phase ready|done [--decision FILE] [--policy-file FILE] [--output FILE]
Evaluate configured lifecycle criteria, evidence and independent signed approval. Exit 0 passed, 1 failed, 3 pending, 4 incomplete.
```
