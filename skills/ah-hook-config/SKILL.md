---
name: ah-hook-config
description: "Use agenthouse hook-config when the user requests this framework operation. Print native settings and inspect existing host configuration before activation."
license: MIT
---

# agenthouse hook-config

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Print native settings and inspect existing host configuration before activation. Merge the intended handlers, preserving unrelated hooks and avoiding duplicates. The host may require trust or review before activation.

CLI reference:

```text
hook-config [--vendor claude] [--install | --remove]
Print settings, or install/remove owned hook entries while preserving other settings. Activate once per repository after reviewing host requirements. Run from the enrolled repository root.
```
