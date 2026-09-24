---
name: ah-inspect
description: "List files touched by a commit or range, candidate tests, new suppressions, and leftover residue. Use when reviewing what a change touched or choosing which checks to run for a diff."
license: MIT
---

Generated from ah-engineering 1.3.0.

# agenthouse inspect

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Resolve the requested commit or range and use inspect to establish affected files, candidate tests and review signals. Filename candidates are heuristics; select checks using the code and requirements.

CLI reference:

```text
inspect [--ref HEAD|BASE..HEAD] [--base BRANCH] [--output FILE]
Analyze committed changes, candidate tests, added suppressions and residue. --base compares from the merge base.
```
