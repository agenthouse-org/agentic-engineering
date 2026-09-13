# 0006: Required versioned frontend acceptance dependency

Status: accepted by repository owner; implemented in 0.1.1.

The SDLC framework uses frontend-acceptance from agenthouse-skills as its required agent-facing method for UI changes. Enrollment installs a verified snapshot with source commit, version, license attribution, and per-file hashes. The specialist method remains maintained upstream.

Ship this snapshot in framework packages for offline enrollment. Support separately approved dependency updates, exact project pins, between-command automatic activation, conflict detection, and rollback through the existing installation transaction. Record the dependency set in evaluation results. Never fetch an unspecified upstream HEAD during evaluation.

Native hook-runtime integration remains a separate tested contract. See [dependency operations](../dependencies.md) for supported commands and limits.
