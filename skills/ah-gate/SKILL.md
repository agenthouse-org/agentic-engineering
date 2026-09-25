---
name: ah-gate
description: "Check ready or done criteria, evidence files, and independent signed approval for a work item. Use when asking if a story is ready to implement or done."
license: MIT
---

Generated from ah-engineering 1.5.0.

# agenthouse gate

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use the requested ready or done phase. Keep completeness, evidence failure and approval pending distinct. Never fabricate acceptance evidence or sign an independent decision as the author.

CLI reference:

```text
gate --item FILE --phase ready|verify|done [--decision FILE] [--policy-file FILE] [--output FILE]
Evaluate configured lifecycle criteria, evidence and independent signed approval. Exit 0 passed, 1 failed, 3 pending, 4 incomplete.
```
