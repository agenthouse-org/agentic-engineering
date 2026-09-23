# 0010: Inspection captures stay out of Git

Status: cleanup and ignore behavior superseded by [ADR-0014](0014-central-storage-and-repository-integration.md). The historical heuristics below must not be used by the current runtime.

Frontend-acceptance requires real screenshots to be inspected. That does not put screenshot galleries in Git. Inspection captures are ephemeral working files under `.agenthouse/evidence/<work-id>/`. Evaluation reports stay under `artifacts/agenthouse/`. Agents must not invent dump folders such as `tests/output`.

The framework applies these housekeeping rules:

- Enrollment ignores generated agenthouse paths, inspection captures, `tests/output/`, `tests/evidence/`, Playwright `test-results/` and `playwright-report/`, and repository-root `tmp/` plus `tmp-*` drafts.
- `housekeep` adds any missing ignore rules and deletes untracked inspection dumps: canonical scratch, known dump roots (`tests/output`, Playwright output), untracked image-only galleries that look like viewport captures, and untracked root `tmp-*` files (draft PR/issue bodies). It does not delete evaluation reports, work records, or Git-tracked files.
- `session` runs housekeeping at task start.
- `doctor` reports missing ignore rules, tracked inspection captures, and leftover dumps outside the canonical path.

Retain verification evidence as evaluation bundles (CI archives `artifacts/agenthouse/`), work-record findings, and reviewed Playwright snapshots/tests. The upstream skill's "keep screenshots with the project" template is a written report, not a Git binary dump. Framework wrappers route cleanup to `housekeep`; the acceptance method remains upstream. Ignoring a path is not enough: agents still write elsewhere unless housekeep removes those trees and skills name one allowed capture path.

See [visual acceptance](../visual-acceptance.md) and [operating guide](../using.md).
