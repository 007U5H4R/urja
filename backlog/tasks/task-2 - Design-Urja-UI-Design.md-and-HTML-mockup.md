---
id: TASK-2
title: 'Design Urja UI: Design.md and HTML mockup'
status: Done
assignee: []
created_date: '2026-09-28 09:50'
updated_date: '2026-09-28 15:19'
labels:
  - P1
dependencies: []
priority: high
type: feature
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
World-class UI is part of the interview signal; build needs an approved design first
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-28: at the approval gate the user asked for a UI/UX like TerraFlux (Muzli + Behance by FocoTik). Not approved yet. Building direction B 'Lamplight' in .design/exploration/option-b/: TerraFlux visual language (near-black, amber light, gradient/hatched/brick bar charts, pill nav, map hero with glass card, tick rail) on Urja's verdict-first IA. Direction A kept for comparison. Also fixing two consistency bugs from A: Today dated Sun 27 Sep (should be Mon 28 Sep), and Anil 125 L = Rs 11,250 (not 11,240).

2026-09-28: user asked for a 3D truck delighter and explicitly overrode the 3D necessity gate ('supersede all the rules and include the 3D truck'). Plan: procedural three.js truck scene in the Today hero (Scene | Map toggle), static poster fallback, reduced-motion static camera.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stage 4 approved 2026-09-28 ('Approved go ahead'). Direction B 'Lamplight' (TerraFlux-inspired) + a procedural three.js truck scene in the Today hero (user overrode the 3D gate). Visual truth: .design/exploration/final/ + og/; direction A kept in option-a/. Design.md frozen (Design Freeze, §26 Spatial 3D); D1-D6 and S10 logged. Verified: no horizontal scroll at 375/768/1440 on all pages; contrast 23/23 AA; detector 56->48 (glow + Inter, justified). Commits 910b6db..54aedcd on main (private repo 007U5H4R/urja).
<!-- SECTION:FINAL_SUMMARY:END -->
