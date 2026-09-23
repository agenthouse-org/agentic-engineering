---
name: ah-lifecycle
description: Guide a software change through the enrolled agenthouse lifecycle, linking its intended outcome, decisions, verification, release, operation, and learning. Use in repositories enrolled with agenthouse engineering when planning, implementing, reviewing, or delivering work.
license: MIT
metadata:
  version: "0.1.0"
---

# agenthouse lifecycle

Run `node .agenthouse/run.mjs context` and read the returned lifecycle path, the relevant work record, and `.agenthouse/resolved.json`. Run the enrolled launcher from the repository root. If enrollment is absent, explain what context is missing instead of inventing organization policy.

Before implementation, identify the requested outcome, scope, acceptance criteria and applicable decisions. Record material gaps and assumptions. Select evidence appropriate to the change: a documentation correction and a permission boundary change need different verification. Keep replies to Decide / Ready or Blocked / Open unless the user asks for more.

If the ticket looks too large (more than about eight criteria, multiple independent outcomes, or `gate --phase ready` reports `ticketSize`), stop at Decide: recommend split slices, ask whether to create follow-up work items, then offer a related `work branch` from the current or chosen base. Configure `git.branchNaming` in `.agenthouse/config.json` first if missing. Never invent `fields.sizeOverride`; write it only after explicit user consent to proceed without splitting.

For UI layout or data-model work that must be seen before code, use ah-visual-plan (wireframe, mermaid, both, or neither) and store the path in `fields.visualPlan`. Do not invent screens when neither is enough.

During implementation, keep the change reviewable. If evidence contradicts the requirement, surface the disagreement and resolve it through the project's process; do not silently alter tests or add unrelated work.

If a new user ask falls outside `fields.scope` or the acceptance criteria, warn, **stop**, and Decide: (1) create a new work item for the out-of-scope ask (ask first), optionally with a related branch, (2) expand the recorded scope and criteria first, or (3) continue on this ticket only after explicit override and a short `fields.scopeNotes` reason. Do not implement scope creep until the user chooses.

For UI changes, run `context` and read its pinned `frontend-acceptance` skill path, the required versioned dependency maintained in agenthouse-skills. Run `node .agenthouse/run.mjs dependencies status` to verify its identity and integrity. If it is missing or modified, repair the dependency before proceeding with frontend acceptance. Derive observable criteria from the reference image, wireframe, story, or bug report. Run the real browser journey, inspect screenshots written only under `.agenthouse/evidence/<work-id>/`, and link findings to criteria. Never write galleries to `tests/output` or invent another dump folder. After inspection, run `node .agenthouse/run.mjs housekeep`. Keep generated output excluded from Git and retain it for review. Cleanup requires explicit configured disposable paths; fixtures and approved baselines are source assets. If no visual reviewer/browser is available, record incomplete evidence rather than a visual pass.

Use `node .agenthouse/run.mjs evaluate --profile <configured-profile> --frozen --subject <build-id>` to gather the project's checks. An explicit build ID must identify the actual tested build. Interpret JSON/HTML reports; never treat a process error, missing criterion, or pending approval as success.

Keep evidence and governance decisions separate. Do not sign an approval on behalf of a human or use a discovered private key unless the user has authorized that signing action. Follow the organization's delegation process for exceptions.

At handoff, identify fulfilled criteria, actual checks, unresolved gaps, and the next lifecycle stage. For release and operational work include recovery and ownership. Feed recurring defects back into concrete criteria or checks.
