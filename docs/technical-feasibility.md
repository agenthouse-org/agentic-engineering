# Technical feasibility assessment

`ah-assess-tech-feasibility` owns the lifecycle assessment workflow. It uses no
third-party parser or paid service. General specialist architecture methods
remain owned by agenthouse-skills; this workflow does not copy them.

Start with a work item whose `fields.outcome` states the change hypothesis.
Save a JSON array of literal selectors, for example:

```json
[{"text":"saveRecord(","category":"persistence","reason":"Calls the affected persistence operation"}]
```

Run `node .agenthouse/run.mjs assessment --item .agenthouse/work/ID.json
--selectors docs/assessments/ID-selectors.json --ref HEAD --output
docs/assessments/ID-inventory.json` (as one command). The inventory reads Git blobs
at the resolved commit, including PHP, TypeScript, config and tests. Files are
ordered, locations include one-based lines/columns, and counts use literal
non-overlapping occurrences per selector. Binary files and symlinks are excluded.
Changing the checkout does not change the inventory for the same commit and
selectors. The selector digest is part of reproducibility: a commit alone cannot
determine the scope of an arbitrary hypothesis.

Classify every unique occurrence as `boundary`, `direct`, or `excluded`, with a
reason. Comments, declarations and strings are not automatically call sites.
Record dynamic dispatch, reflection, extra affected files and inaccessible
consumers in the document; literal search cannot prove exhaustive blast radius.
Two assessments are comparable only with the same selector/classification method.

Write an ADR-style Markdown document with context, options, decision proposal and
consequences, plus `current.mmd` and `target.mmd` through ah-visual-plan. Rank big
bang, parallel dual write and strangler/adapter (or explain alternative scenarios)
on the same scale. A higher score always means more favorable, including lower
effort, lower risk, easier reversal, fewer prerequisites and less operational
disruption. Explain every score in the document. Migration steps state ordering,
consistency invariants and abort/recovery points; dual write needs explicit
partial-write and reconciliation handling. Name each supplied consumer and its
changed and unchanged contracts.

The adjacent JSON summary uses this contract:

```json
{
  "schemaVersion": 1,
  "kind": "technical-feasibility",
  "workItem": ".agenthouse/work/ID.json",
  "commit": "EXACT_COMMIT_SHA",
  "criteriaDigest": "HASH_OF_CRITERIA_ARRAY",
  "hypothesisDigest": "HASH_OF_FIELDS_OUTCOME",
  "policyDigest": "RESOLVED_POLICY_DIGEST",
  "selectors": "docs/assessments/ID-selectors.json",
  "inventoryDigest": "HASH_OF_INVENTORY_OBJECT",
  "artifacts": {
    "docs/assessments/ID.md": "SHA256_OF_FILE_BYTES",
    "docs/assessments/current.mmd": "SHA256_OF_FILE_BYTES",
    "docs/assessments/target.mmd": "SHA256_OF_FILE_BYTES"
  },
  "callSites": [{"file":"src/store.ts","line":12,"column":3,"text":"saveRecord(","category":"boundary","reason":"Repository interface invocation"}],
  "scale": "1=least favorable;5=most favorable",
  "scenarios": [
    {"name":"big bang","rank":3,"effort":4,"risk":1,"reversibility":1,"prerequisites":2,"operationalImpact":1,"explanation":"Explain using code evidence"},
    {"name":"parallel dual write","rank":2,"effort":1,"risk":2,"reversibility":4,"prerequisites":2,"operationalImpact":2,"explanation":"Explain consistency risk"},
    {"name":"strangler with adapter","rank":1,"effort":2,"risk":4,"reversibility":4,"prerequisites":3,"operationalImpact":4,"explanation":"Explain interface constraints"}
  ],
  "migration": [{"action":"Backfill with a checkpoint","consistentWhen":"All rows through checkpoint match","abort":"Stop before cutover and retain original source"}],
  "consumers": [{"name":"Named consumer","changes":"Describe changes","unchanged":"Describe invariant contract"}],
  "openQuestions": [],
  "proposal": "Recommended option and rationale; awaiting authorized decision"
}
```

Scores above illustrate structure, not a recommendation. Hash structured values
with the pinned runtime's `hash` export from `src/io.js` (canonical sorted JSON),
and artifact contents as bytes. Run `assessment --summary FILE` to validate the
linked bundle. It returns completeness metadata, never an application test pass.
Missing, changed or malformed records raise an error.

A follow-up story links `fields.technicalAssessment` to the summary and
`fields.assessmentCommit` to the assessed commit. The ready gate verifies the
bundle, source hypothesis/criteria/policy, declared revision and open questions.
This checks evidence completeness, not architectural correctness or approval.
After source changes, reassess and explicitly update the linked revision.

Optional PoC tests use ah-spec red/green and ah-check-commit. Record all touched
lines with test locations and any gaps; line coverage alone is not behavioral
proof. PoC evaluation remains separate from the assessment proposal.
