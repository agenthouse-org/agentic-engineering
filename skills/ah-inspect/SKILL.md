---
name: ah-inspect
description: "List files touched by a commit or range, candidate tests, new suppressions, and leftover residue. Use when reviewing what a change touched or choosing which checks to run for a diff."
license: MIT
---

# agenthouse inspect

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Resolve the requested commit or range and use inspect to establish affected files, candidate tests and review signals. Filename candidates are heuristics; select checks using the code and requirements.

CLI reference:

```text
inspect [--ref HEAD|BASE..HEAD] [--base BRANCH] [--output FILE]
Analyze committed changes, candidate tests, added suppressions and residue. --base compares from the merge base.
```
