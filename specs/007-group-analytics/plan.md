# Implementation Plan: Аналитика по группам и показателям

**Branch**: `007-group-analytics` | **Date**: 2025-11-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-group-analytics/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Добавление страницы аналитики для отображения статистики по группам спортсменов и их показателей за текущий сезон. Тренер получает инструменты для мониторинга:
- Количество спортсменов в каждой группе (М-19, М-117, М-118, А-29, А-218, А-219)
- Количество и список спортсменов без группы
- Показатели по упражнениям с группировкой по группам (средние, лучшие, худшие результаты)
- Возможность назначать группу спортсменам из списка "Без группы"

**Technical Approach**: Single-file PWA расширение в index.html с использованием vanilla JavaScript для расчёта статистики, SVG для визуализации графиков (zero dependencies), и существующего offline-first паттерна (localStorage → Supabase sync). Вычисления на стороне клиента с использованием Array.reduce() для агрегации данных по группам.

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+ (arrow functions, async/await, destructuring, template literals)
**Primary Dependencies**: NONE (zero runtime dependencies, Supabase JS SDK via CDN already present)
**Storage**: localStorage API (primary, 5-10MB quota) + Supabase PostgreSQL (secondary sync)
**Testing**: Manual testing on Safari iOS (primary) + Chrome Android (secondary)
**Target Platform**: Mobile web (iOS 15+, Android 10+)
**Project Type**: Single-file PWA (index.html contains all HTML+CSS+JS)
**Performance Goals**: <2s page load on 3G, <100ms touch response, <2s statistics calculation
**Constraints**: Offline-capable, localStorage 5-10MB limit, touch-optimized (44x44px minimum targets)
**Scale/Scope**: ~50-100 athletes, 6 active groups, 20-30 exercises, seasonal data (Sept-Aug) [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| Single-File Architecture | ✅ PASS | New analytics page added to index.html (HTML + CSS + JS sections) |
| Zero Runtime Dependencies | ✅ PASS | Vanilla JS + SVG for charts (no external libraries) |
| Offline-First Data Flow | ✅ PASS | FR-010, FR-011: localStorage primary, Supabase sync secondary |
| Mobile-First Design | ✅ PASS | SC-007: Touch-optimized, 44x44px minimum button sizes |
| Dark Theme Only | ✅ PASS | Uses existing color palette (#0f1117, #1a1d29, #4c9eff) |
| Russian Language Only | ✅ PASS | All UI text in Russian (buttons, labels, messages) |

**GATE RESULT**: ✅ **ALL PASSED** - Proceeding to Phase 0 Research

### Post-Design Check (After Phase 1)

| Principle | Status | Final Verification |
|-----------|--------|-------------------|
| Single-File Architecture | ✅ PASS | Confirmed: All code integrated into index.html |
| Zero Runtime Dependencies | ✅ PASS | Confirmed: No new external libraries, vanilla SVG used |
| Offline-First Data Flow | ✅ PASS | Confirmed: Statistics calculated from localStorage data |
| Mobile-First Design | ✅ PASS | Confirmed: Touch targets, responsive layout designed |
| Dark Theme Only | ✅ PASS | Confirmed: Dark theme palette applied to all new elements |
| Russian Language Only | ✅ PASS | Confirmed: All strings in Russian |

**FINAL GATE RESULT**: ✅ **ALL PASSED** - No constitution violations

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
index.html              # Single-file PWA application
├── Lines 1-15         : Meta tags, Supabase SDK CDN import
├── Lines 16-550       : CSS styles (ADDING analytics page styles)
├── Lines 551-650      : HTML markup (ADDING analytics view container)
└── Lines 651+         : JavaScript (ADDING analytics functions)

NEW SECTIONS TO ADD:
├── CSS:
│   ├── .analytics-view { }
│   ├── .group-card { }
│   ├── .statistics-table { }
│   ├── .chart-svg { }
│   └── .no-group-modal { }
│
├── HTML:
│   └── <div id="analytics-view" class="view-container">
│       ├── <div class="analytics-header">
│       ├── <div class="group-cards-container">
│       ├── <div class="exercise-selector">
│       ├── <div class="statistics-display">
│       └── <div id="no-group-modal" class="modal">
│
└── JavaScript Functions:
    ├── openAnalyticsView()
    ├── closeAnalyticsView()
    ├── loadGroupStatistics()
    ├── calculateGroupAverages(groupName, exerciseName)
    ├── renderGroupCards()
    ├── renderExerciseStatistics(exerciseName)
    ├── openNoGroupAthletes()
    ├── assignGroupToAthlete(athleteId, groupName)
    └── renderStatisticsChart(data)

NO NEW FILES - Everything integrated into existing index.html
```

**Structure Decision**: Single-file PWA architecture maintained per constitution. All new analytics functionality (HTML, CSS, JavaScript) added as sections within index.html. No separate files created. Navigation button added to existing bottom nav bar. [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**STATUS**: Not applicable - no constitution violations detected.

All design decisions align with project constitution:
- Single-file architecture preserved
- Zero runtime dependencies maintained
- Offline-first pattern extended
- Mobile-first design applied
- Dark theme used throughout
- Russian language only | [specific problem] | [why direct DB access insufficient] |
