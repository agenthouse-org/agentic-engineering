---
name: ah-frontend-acceptance
description: "Verify UI work with the pinned frontend-acceptance method, using the story, bug, wireframe, or reference image and real screenshots. Use when checking visual design, screens, or frontend acceptance."
license: MIT
---

# agenthouse frontend-acceptance

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Run dependencies status, then read .agents/skills/frontend-acceptance/SKILL.md and follow its supporting resources. Derive evidence from the reference image, wireframe, story, or bug. Do not substitute regression equality for concept conformance. If the upstream dependency is missing or modified, report the problem rather than inventing an alternative method.

The upstream evidence-record template is a written report, not permission to commit screenshot dumps. Inspection captures are ephemeral: write them only under artifacts/agenthouse/ or .agenthouse/evidence/. After inspecting, run node .agenthouse/run.mjs housekeep instead of inventing a screenshot directory or deleting files ad hoc. Housekeep adds missing ignore rules and removes untracked inspection captures; it does not delete evaluation reports under artifacts/agenthouse/ or Git-tracked files. Durable Git coverage is reviewed Playwright snapshots and tests. Record criterion findings, hashes, and evaluation report paths on the work item. CI archives artifacts/agenthouse/; that is retained verification evidence.
