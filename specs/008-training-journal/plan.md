# Implementation Plan: Training Journal (Тренерский журнал)

**Branch**: `008-training-journal` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-training-journal/spec.md`

## Summary

Новое представление в PWA — табличный тренерский журнал для быстрого просмотра и ввода результатов упражнений (подтягивания, отжимания, брусья) по группам учеников. Всё в одном экране: имена, значения за текущий месяц, личные рекорды, счётчик прогресса. Ввод тапом по ячейке. Фильтрация по группам и наличию значений.

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+ (in-browser), HTML5, CSS3
**Primary Dependencies**: None (Supabase JS SDK via CDN already loaded)
**Storage**: localStorage (primary, offline), Supabase PostgreSQL (secondary, sync)
**Testing**: Manual testing on mobile devices (Safari iOS, Chrome Android)
**Target Platform**: Mobile-only PWA (Safari iOS primary, Chrome Android secondary)
**Project Type**: Single-file PWA (`index.html`)
**Performance Goals**: Touch response <100ms, table render <500ms for 30 athletes
**Constraints**: Offline-capable, single-file architecture, no external dependencies
**Scale/Scope**: Up to 120 athletes, ~10 groups, 3 exercises, 12 months per season

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Single-File Architecture | ✅ PASS | All code in index.html — new view is HTML+CSS+JS within same file |
| Zero Runtime Dependencies | ✅ PASS | Uses existing global state (athletesData, exercisesData), no new libs |
| Offline-First Data Flow | ✅ PASS | Reads from in-memory arrays, writes to localStorage + pendingChanges |
| Mobile-First Design | ✅ PASS | Touch-optimized table, 44px min tap targets, portrait layout |
| Dark Theme Only | ✅ PASS | Uses existing color palette (#0f1117, #1a1d29, etc.) |
| Russian Language Only | ✅ PASS | All UI text in Russian |

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/008-training-journal/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
index.html               # Single-file PWA — ALL changes go here
├── <style>              # New CSS: .journal-*, table styles
├── <body>               # New HTML: journal view section, inline input
└── <script>             # New JS: journal rendering, filtering, cell editing
```

**Structure Decision**: Single-file architecture per constitution. New journal view is a section within index.html, toggled via navigation (same pattern as existing athlete list/details views). No new files created.

## Phase 0: Research (Complete)

**Output**: [research.md](research.md)

All technical unknowns resolved:

| # | Topic | Decision |
|---|-------|----------|
| R1 | Navigation | Full-screen overlay view (analytics pattern) + 5th nav tab "Журнал" |
| R2 | Data model | Reuse `athletesData[].performance[]` and `allTimeRecords{}` — no new structures |
| R3 | Current month | Formula: `jsMonth >= 8 ? jsMonth - 8 : jsMonth + 4` → MONTHS index |
| R4 | Cell editing | Inline `<input type="number">` on tap, Enter/blur saves |
| R5 | Save pattern | Memory → recalculate records → localStorage → pendingChanges (same as recordsForm) |
| R6 | Filtering | Group chips (multi-select) + exercise value toggles (has/missing) |
| R7 | Table layout | Fixed 4-column table (name + 3 exercises), no horizontal scroll |

No NEEDS CLARIFICATION items. Zero new dependencies. Zero database changes.

## Phase 1: Design (Complete)

**Outputs**: [data-model.md](data-model.md), [quickstart.md](quickstart.md)

### Data Model Summary

- **No new entities** — journal reads/writes existing `athletesData[]`, `allTimeRecords{}`
- **New view state** (in-memory only): `journalSelectedGroups[]`, `journalExerciseFilter{}`, `journalEditingCell`
- **New constant**: `JOURNAL_EXERCISES = [{field, label, fullLabel}]` for 3 exercises
- **New helper**: `getCurrentMonthIndex()` — maps JS month to MONTHS array index

### Architecture Decisions

1. **View pattern**: Full-screen overlay (hide `.container`, show `#journal-view`) — same as analytics
2. **Data source**: In-memory global arrays (already loaded from localStorage/Supabase)
3. **Save flow**: Update memory → recalculate records → save localStorage → push pendingChanges
4. **Sync compatibility**: Uses existing `type: 'athlete'` pendingChange format — zero sync code changes
5. **No API contracts needed**: No new endpoints — journal operates entirely on client-side data

### Implementation Scope

| Component | Lines (est.) | Location in index.html |
|-----------|-------------|------------------------|
| CSS styles | ~80 | After existing styles, before `</style>` |
| HTML markup | ~40 | After `#analytics-view`, before modals |
| Nav button | ~5 | In `.bottom-nav` section |
| JS functions | ~250 | After analytics functions |
| **Total** | **~375** | Single file only |

### Constitution Re-Check (Post-Design)

| Gate | Status | Notes |
|------|--------|-------|
| Single-File Architecture | ✅ PASS | ~375 lines added to index.html, no new files |
| Zero Runtime Dependencies | ✅ PASS | No new libraries, reuses existing global state |
| Offline-First Data Flow | ✅ PASS | localStorage → pendingChanges → manual sync |
| Mobile-First Design | ✅ PASS | 44px tap targets, numeric keyboard, no horizontal scroll |
| Dark Theme Only | ✅ PASS | Uses #0f1117, #1a1d29, #4c9eff palette |
| Russian Language Only | ✅ PASS | Журнал, Подтягивания, Принято — all Russian |

All gates pass post-design. Ready for Phase 2 (task generation via `/speckit.tasks`).
