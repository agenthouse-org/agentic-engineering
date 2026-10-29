---
schemaVersion: 1
kind: market-opportunity
id: example-opportunity
title: "Shift handover notes for small veterinary clinics"
segments:
  - id: seg-small-clinics
    description: Independent veterinary clinics with one site and rotating shifts
    firmographics: 3 to 15 staff, single location, owner-managed
    buyer: Clinic owner
    user: Veterinary nurses handing over between shifts
    decisionMaker: Clinic owner
    job: Hand over patient status between shifts without missing medication or follow-up
    pain: Handover relies on paper notes and verbal briefings that get lost
    valueHypothesis: A structured handover checklist reduces missed follow-ups
    willingnessToPay: Unknown; expected under a typical practice-software add-on
    channels: [Regional veterinary association newsletters, Practice-software marketplaces]
    basis: assumption
conditions:
  - id: success-problem
    kind: success
    segment: seg-small-clinics
    statement: At least 4 of 6 interviewed nurses describe a missed follow-up in the last month
    statedAt: 2026-09-01
  - id: stop-problem
    kind: stop
    segment: seg-small-clinics
    statement: Fewer than 2 of 6 interviewed nurses describe a missed follow-up
    statedAt: 2026-09-01
---

# Shift handover notes for small veterinary clinics

This is a fictional example. Participants and clinics use pseudonymous ids.

## Problem

Nurses say handover depends on paper notes and memory (evidence: ev-01, ev-02). Missed medication follow-ups are the reported consequence (evidence).

## Assumptions

- Clinic owners buy workflow tools for nurses (assumption).
- A checklist fits inside existing practice software (assumption).

## Unresolved questions

- What would a clinic owner pay for this?
- Do multi-site groups have the same problem?

## Alternatives and switching cost (optional)

Paper handover sheets and shared spreadsheets; switching cost is low but habits are strong (assumption).
