---
name: ah-evaluate
description: "Use agenthouse evaluate when the user requests this framework operation. Use the project’s configured profile and actual build identity."
license: MIT
---

# agenthouse evaluate

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use the project’s configured profile and actual build identity. Preserve failure, error, pending, and incomplete statuses. Explain report paths and missing evidence. Do not modify tests, policies, or checks merely to obtain a pass.

CLI reference:

```text
evaluate [--profile pull-request] [--ci] [--frozen] [--subject BUILD_ID]
         [--base-url URL] [--output PATH] [--policy-file FILE]
Run configured checks and write JSON, JUnit, and HTML evidence reports.
Exit codes: 0 passed; 1 failed; 2 error; 3 approval pending; 4 incomplete.
--ci implies --frozen and never updates dependencies. BUILD_ID must identify the tested build.
```
