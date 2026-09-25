---
name: ah-sign
description: "Sign a reviewed governance decision or data bundle with an authorized private key. Use when a human has authorized signing; invoking this skill is not itself approval."
license: MIT
---

Generated from ah-engineering 1.4.0.

# agenthouse sign

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. First check for .agenthouse/run.mjs and .agenthouse/active.json. If absent, explain that the repository is not enrolled and point to the organization's enroll skill when configured, otherwise ah-enroll-repository. Stop without running commands or changing files. Exception: explicit setup/help/demo requests may use an already installed ah-engineering executable or this package's bin/ah-engineering.js with an explicit --root; never fetch or install implicitly. When enrolled, run context and read the same named skill from the exact repository runtime; the global plugin is a discovery/bootstrap surface, not policy authority. Do not recursively reload this same file when it is already the pinned skill. For ah-doctor pass --plugin-version with this skill's generated version so mismatches are visible.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Sign only the exact reviewed artifact using a key the user has authorized you to use. Possession of a key or invocation of this skill is not governance approval. Never invent an issuer, delegation, or allowed verdict.

CLI reference:

```text
sign --input FILE --key PRIVATE_KEY --output FILE [--delegation FILE]
Sign a reviewed governance decision or data bundle. Signing must be authorized by the key owner.
```
