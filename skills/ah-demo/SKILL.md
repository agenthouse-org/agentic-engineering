---
name: ah-demo
description: "Use agenthouse demo when the user requests this framework operation. Use a new or empty directory chosen for the demonstration."
license: MIT
---

# agenthouse demo

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use a new or empty directory chosen for the demonstration. Explain the expected failed check and corrected passing check. A demo pass is not evidence about the user’s application.

CLI reference:

```text
demo --root NEW_EMPTY_DIRECTORY
Run an isolated example: a failing acceptance check, a fix, then a passing check.
Prints the HTML report path. The demonstration does not validate your application.
```
