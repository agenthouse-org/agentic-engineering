---
name: agenthouse-lifecycle
description: Guide a software change through the enrolled agenthouse lifecycle, linking its intended outcome, decisions, verification, release, operation, and learning. Use in repositories enrolled with agenthouse engineering when planning, implementing, reviewing, or delivering work.
license: MIT
metadata:
  version: "0.1.0"
---

# agenthouse lifecycle

Read `.agenthouse/lifecycle.md`, the relevant work record, and `.agenthouse/resolved.json`. Run the enrolled launcher from the repository root. If enrollment is absent, explain what context is missing instead of inventing organization policy.

Before implementation, identify the requested outcome, scope, acceptance criteria and applicable decisions. Record material gaps and assumptions. Select evidence appropriate to the change: a documentation correction and a permission boundary change need different verification.

During implementation, keep the change reviewable. If evidence contradicts the requirement, surface the disagreement and resolve it through the project's process; do not silently alter tests or add unrelated work.

For UI changes, use the installed frontend-acceptance skill if available. Derive observable criteria from the reference image, story, or bug report. Run the real browser journey, inspect screenshots, and link findings to criteria. If no visual reviewer/browser is available, record incomplete evidence rather than a visual pass.

Use `node .agenthouse/run.mjs evaluate --profile <configured-profile> --frozen --subject <build-id>` to gather the project's checks. An explicit build ID must identify the actual tested build. Interpret JSON/HTML reports; never treat a process error, missing criterion, or pending approval as success.

Keep evidence and governance decisions separate. Do not sign an approval on behalf of a human or use a discovered private key unless the user has authorized that signing action. Follow the organization's delegation process for exceptions.

At handoff, identify fulfilled criteria, actual checks, unresolved gaps, and the next lifecycle stage. For release and operational work include recovery and ownership. Feed recurring defects back into concrete criteria or checks.
