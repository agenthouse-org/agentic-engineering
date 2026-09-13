---
name: ah-assess-story-readiness
description: "Assess whether an existing work item is ready to implement."
license: MIT
---

# agenthouse assess-story-readiness

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Read the item and applicable project readiness policy. Check outcome, scope, observable criteria, dependencies, risks, and verification approach. Cite each missing fact and make suggested wording explicit. Evaluate completeness separately from truth. Disclose authorship; follow the project’s independence requirements. Produce a readiness assessment, not an automatic stage transition or signature.
