---
name: ah-sign
description: "Use agenthouse sign when the user requests this framework operation. Sign only the exact reviewed artifact using a key the user has authorized you to use."
license: MIT
---

# agenthouse sign

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Sign only the exact reviewed artifact using a key the user has authorized you to use. Possession of a key or invocation of this skill is not governance approval. Never invent an issuer, delegation, or allowed verdict.

CLI reference:

```text
sign --input FILE --key PRIVATE_KEY --output FILE [--delegation FILE]
Sign a reviewed governance decision or data bundle. Signing must be authorized by the key owner.
```
