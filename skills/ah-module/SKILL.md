---
name: ah-module
description: "Show Node/TypeScript or PHP/Laravel check templates to adapt before enabling. Use when choosing stack-specific evaluators or starting from a module template."
license: MIT
---

# agenthouse module

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Show the requested stack template and explain needed adaptation. Do not automatically replace existing evaluators.

CLI reference:

```text
module --name node-typescript|php-laravel [--output FILE]
Print or save check templates. Review and adapt them before adding to project configuration.
```
