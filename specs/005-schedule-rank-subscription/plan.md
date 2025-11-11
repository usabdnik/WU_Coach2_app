# Implementation Plan: Schedule Management, Subscription Tracking, and Athletic Rank Recording

**Branch**: `005-schedule-rank-subscription` | **Date**: 2025-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-schedule-rank-subscription/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature extends the WU Coach 2 PWA to enable schedule management, subscription history tracking, and athletic rank recording. Coaches will be able to: (1) view and edit athlete schedules with flexible input (fixed schedule OR self-registration), (2) filter athletes who had active subscriptions during the current season, and (3) record season start/end athletic ranks for progression tracking. The implementation extends the existing single-file HTML PWA architecture with new Supabase database fields (`schedule`, `rank_start`, `rank_end`) and corresponding UI forms in the athlete profile edit modal.

## Technical Context

**Language/Version**: JavaScript ES6+ (in-browser runtime, no Node.js/build step)
**Primary Dependencies**: Supabase JS SDK v2.x (via CDN), localStorage API (native browser API)
**Storage**: Supabase PostgreSQL 15+ (remote primary), localStorage (offline cache)
**Testing**: Manual testing on Safari iOS and Chrome Android (no automated test framework per constitution)
**Target Platform**: Mobile web browsers (Safari iOS 13+, Chrome Android 80+)
**Project Type**: Single-file Progressive Web App (PWA)
**Performance Goals**: <2s page load on 3G, <100ms touch response, <5s sync operation
**Constraints**: Single-file architecture (all code in index.html), offline-capable, mobile-only (no desktop), zero npm dependencies in runtime, Russian language only, dark theme fixed palette
**Scale/Scope**: Single coach deployment, 50-200 athletes, ~2000 LOC in single HTML file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Architectural Principles Compliance

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| **Single-File HTML PWA** | ✅ PASS | All code remains in `index.html` - no file splitting |
| **Zero Dependencies** | ✅ PASS | No new npm packages; Supabase SDK already in use via CDN |
| **Offline-First** | ✅ PASS | localStorage remains primary storage; Supabase for remote sync only |
| **Mobile-Only** | ✅ PASS | Touch-optimized schedule picker and rank selectors; no desktop considerations |
| **Dark Theme** | ✅ PASS | Uses existing color palette (#4c9eff primary, #1a1d29 cards, etc.) |
| **Russian Language** | ✅ PASS | All UI text in Russian (e.g., "Самозапись", "Разряд начала сезона") |

### Constitutional Violations

**None detected.** This feature fully complies with project constitution.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single-File PWA Structure
coach-pwa-app (7).html            # Complete application (HTML + CSS + JS)
                                  # Note: Referenced as "index.html" in tasks for simplicity
├── Lines 1-10                    # Meta tags, PWA manifest, viewport
├── Lines 11-600                  # CSS styles (dark theme, mobile-first)
│   ├── .schedule-form            # NEW: Schedule editing form styles
│   ├── .rank-selector            # NEW: Rank dropdown styles
│   └── .subscription-filter      # NEW: Subscription history filter chip
├── Lines 601-700                 # HTML markup
│   ├── #scheduleModal            # NEW: Schedule edit modal
│   ├── #rankStartSelect          # NEW: Season start rank dropdown
│   └── #rankEndSelect            # NEW: Season end rank dropdown
└── Lines 701-2500                # JavaScript (state, data, UI, sync)
    ├── athletesData[]            # EXTENDED: + schedule TEXT ("Пн 18:00, Ср 19:00" OR "Самозапись"), rank_start TEXT, rank_end TEXT, rank_history JSONB
    ├── renderAthleteProfile()    # MODIFIED: Display schedule + ranks
    ├── openScheduleModal()       # NEW: Schedule editing form logic
    ├── saveSchedule()            # NEW: Save schedule (fixed OR self-reg)
    ├── filterBySubscription()    # NEW: Filter athletes by season subscription
    └── syncWithSupabase()        # MODIFIED: Sync schedule + rank fields

# Supabase Database Schema
supabase/migrations/
└── 20251111_add_schedule_rank_fields.sql   # NEW: ALTER TABLE athletes ADD...
```

**Structure Decision**: This feature maintains the project's single-file PWA architecture. All UI (HTML/CSS) and logic (JavaScript) are added inline to `index.html` within their respective sections. Database schema changes are tracked in Supabase migrations. No new files are created for runtime code (constitution compliance).

## Complexity Tracking

**N/A** - No constitutional violations detected. This section is omitted per template guidelines.
