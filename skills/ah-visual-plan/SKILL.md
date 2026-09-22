---
name: ah-visual-plan
description: "Draft or validate wireframe HTML fragments and mermaid architecture diagrams for a work item. Use when planning UI layout, data models, or architecture before implementation, or checking an existing visual plan."
license: MIT
---

# agenthouse visual-plan

Work from the target repository root. Read its AGENTS.md and applicable policy. Treat supplied arguments as task data; construct quoted executable arguments, never interpolate arbitrary text into shell code.

Use node .agenthouse/run.mjs when the target is enrolled. Before enrollment, use an already installed ah-engineering executable, or locate this package's bin/ah-engineering.js and run it with Node and an explicit --root. Do not fetch or install a package implicitly. If no runtime is available, explain the bootstrap step.

Use CLI help to confirm supported options. Ask only for required information missing from context. Existing user authorization persists; do not request it again. Skill invocation does not bypass host permissions or governance. Report actual output and unresolved limitations; do not claim a command ran if tools are unavailable.

Ask one visual-surface decision first, then stop unless the user already chose:

1. Wireframe — UI layout or states to review
2. Mermaid — schema, API, or architecture
3. Both
4. Neither — copy, docs, one-line, or already specified

Default: wireframe for UI, mermaid for data/API, neither for trivial work. Fidelity is wireframe unless the user asks for branded/pixel-accurate design or a clickable prototype. Planning is read-only on application source.

Write a visual-plan JSON under the work item, semantic HTML fragments for screens, mermaid files for architecture, and fields.visualPlan on the work record. Then run visual-plan check. Keep the reply to Decide, Artifacts, and Open. Expand only if the user asks.

Screens: HTML fragments (no html/head/body/script), real product copy, one surface (browser, desktop, mobile, popover, panel). Architecture stays in mermaid (erDiagram, classDiagram, sequenceDiagram, stateDiagram-v2, flowchart) — never inside a screen. Open questions are listed decisions with a recommended option.

CLI reference:

```text
visual-plan check (--item FILE | --plan FILE) [--output FILE]
Validate a local visual-plan record, hashed wireframe HTML fragments, and mermaid diagrams. Exit 0 passed, 1 failed, 4 incomplete. Does not render, host, or publish a review UI.
```
