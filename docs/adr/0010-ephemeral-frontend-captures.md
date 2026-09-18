# 0010: Inspection captures stay out of Git

Status: accepted by repository owner; implemented in this preview.

Frontend-acceptance requires real screenshots to be inspected. That does not put screenshot galleries in Git. Inspection captures are ephemeral working files under ignored paths (`artifacts/agenthouse/` or `.agenthouse/evidence/`).

The framework applies these housekeeping rules:

- Enrollment ignores generated agenthouse paths and inspection captures.
- `housekeep` adds any missing ignore rules and deletes untracked inspection dumps. It does not delete evaluation reports, work records, or Git-tracked files.
- `session` runs housekeeping at task start.
- `doctor` reports missing ignore rules and tracked inspection captures.

Retain verification evidence as evaluation bundles (CI archives `artifacts/agenthouse/`), work-record findings, and reviewed Playwright snapshots/tests. The upstream skill's "keep screenshots with the project" template is a written report, not a Git binary dump. Framework wrappers route cleanup to `housekeep`; the acceptance method remains upstream.

See [visual acceptance](../visual-acceptance.md) and [operating guide](../using.md).
