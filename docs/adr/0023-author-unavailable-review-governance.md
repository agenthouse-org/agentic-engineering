# ADR-0023: Consumer-owned author-unavailable review procedure

Date: 2026-10-09. Status: accepted product direction.

agenthouse must surface, but not fill, the governance gap created when an MR/PR author is unavailable during review. Policy resolution records `review.author-unavailable-during-review` as an open decision until a consumer policy supplies `authorUnavailableDuringReview`. Session, gate, and resolved-policy output expose the same notice without changing technical gate status.

The policy entry records applicability, SOP identity, permitted trigger roles, and required MR traceability. Consumers can set it in a repository or organization layer; normal policy composition determines the effective entry. agenthouse documents role swap and wait-with-mechanical-blockers as optional reference SOPs, never defaults.

Agent guidance requires reading the effective policy, stopping for the open decision when it is absent, preserving independent human approval, and documenting a push to another person's branch on the MR. This is governance guidance and traceability, not a new merge, approval, or remote-write capability.
