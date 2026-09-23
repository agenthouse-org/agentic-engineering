---
name: ah-init
description: "Install the pinned runtime, lifecycle skill, and required frontend-acceptance dependency without the conversational questionnaire. Use when agents and autonomy are already chosen, or when reinstalling."
license: MIT
---

# agenthouse init

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Use the requested target and agent selection. Preserve existing policies and instructions. Do not enable unrelated integrations or weaken autonomy to make installation succeed.

CLI reference:

```text
init [--agents claude,codex,cursor,windsurf,opencode,openclaw] [--policy FILE]
     [--project NAME] [--autonomy supervised|bounded|delegated] [--scope project|user] [--integration shared|private] [--central]
Install the runtime, lifecycle skill, and required frontend-acceptance dependency.
Default autonomy: supervised. User scope caches runtime and skills centrally without touching a repository. New project setup requires --integration. Existing project installations retain storage until --central migrates unchanged owned files.
```
