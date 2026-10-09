# Author unavailable during review

## Consumer decision

agenthouse does not choose what happens when an MR/PR author is unavailable during review. Each consumer records its decision in a repository or organization policy at `authorUnavailableDuringReview`. Until it is present, the resolved policy, session, and gate output name `review.author-unavailable-during-review` as an open decision for the project owner.

The entry states when the rule applies, the selected SOP, which roles can trigger it, and the required MR traceability. A project policy can define the rule for one repository; an organization policy can define it for all of its consumers. A later policy layer supplies the effective entry.

```json
{
  "schemaVersion": 1,
  "id": "example-project",
  "revision": "2026-10-09",
  "authorUnavailableDuringReview": {
    "appliesWhen": {"unreachableWorkingDays": 3, "declaredAbsence": true, "urgencyClasses": ["urgent"]},
    "sop": {"id": "role-swap", "reference": "docs/author-unavailable-during-review.md#role-swap"},
    "triggeredBy": ["project-owner", "team-lead"],
    "mrTraceability": {"required": ["date", "previous author", "new author", "new reviewer", "reason", "authorizer"]}
  },
  "rules": []
}
```

`appliesWhen` needs at least one condition. `sop.id` can name either reference SOP below or a consumer replacement. `mrTraceability.required` is deliberately consumer-owned: add any ticket, urgency, or push details the team requires.

## Reference SOPs (optional)

These are documented options, not agenthouse defaults. The project owner chooses, adapts, or replaces one in local governance.

### Role swap with a traceable entry

The reviewer becomes the author of record. Reassign the MR to that person; they take over answering and fixing the open threads and later press merge. A different human becomes the reviewer and provides the required independent approval. The original author's threads stay open until the new author answers each one in its thread.

Write one MR comment containing the date, previous author, new author, new reviewer, reason for the swap, and who authorized it. The policy entry and that comment are evidence for a later gate or review. The policy must require this comment shape (or a stricter one) in `mrTraceability.required`.

This SOP does not let the outgoing reviewer self-approve, and it does not make an agent an approver or merger.

### Wait for the author; clear only mechanical blockers

Wait for the original author to answer substantive review points and merge. A permitted person may clear only mechanical blockers on the branch, such as target-branch conflicts or a pipeline repair. Document every push to the branch on the MR, including date, actor, reason, and the exact mechanical change. Do not treat this as an answer to an open substantive thread.

The policy should make both the allowed blocker types and the required push-comment fields explicit. The original author's unanswered threads remain open.

## Agent behavior and evidence

When an agent sees a stated absence, an MR note, or no response for the policy threshold, it reads the resolved `authorUnavailableDuringReview` entry and follows only that consumer SOP. If there is no entry, it stops and tells the user that the project owner must decide; it can offer the two reference SOPs above for that owner to adopt or replace.

Agents never recommend that a reviewer merges or self-approves a foreign MR. They never push to another person's branch without the policy-required MR entry stating that push. A later gate or review reads both the resolved policy entry and the MR comment(s); neither is a substitute for an independent human approval.
