---
name: ah-spec
description: "Capture a failing (red) then passing (green) run of the same configured test command for a work item. Use when recording specification evidence that a check actually failed before the fix."
license: MIT
---

# agenthouse spec

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Capture red before implementing and green after using the same configured test command. Inspect the failing output to confirm a relevant assertion failed. A compilation or environment failure is not a valid specification example.

CLI reference:

```text
spec --item FILE --phase red|green --evaluator ID [--output FILE]
Capture an expected test failure (exit 1), then success (exit 0) with the same configured command and criteria. Review the failure cause; an exit code alone is not proof of a valid test.
```
