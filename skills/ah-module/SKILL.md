---
name: ah-module
description: "Show a stack template, or preview/apply a reviewed plan that wires repository test commands into evaluate profiles. Use when connecting npm/php test scripts to agenthouse without hand-editing config."
license: MIT
---

# agenthouse module

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Show the requested stack template for exploration. For wiring, run --preview, show the diff and limitations, save the versioned target-state artifact for handoff when requested, and use --apply only after that exact artifact was reviewed. Ask for organization layer aliases when needed. Preview and apply never execute evaluators, refresh frozen policy, or create approval.

CLI reference:

```text
module --name node-typescript|php-laravel [--output FILE]
module --name NAME --preview [--workspace PATH] [--layers LIST] [--profile NAME] [--advisory-profile NAME] [--output PLAN]
module --apply PLAN
Print the legacy template, preview an evidence-led interactive diff/target-state handoff artifact, or apply an exactly reviewed plan. Preview/apply never executes proposed evaluators; resolve and evaluate remain separate.
```
