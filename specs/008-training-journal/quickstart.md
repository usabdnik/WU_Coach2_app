# Quickstart: Training Journal (Тренерский журнал)

**Feature**: 008-training-journal | **Date**: 2026-02-20

## Prerequisites

- `index.html` — current working PWA (single-file)
- Branch: `008-training-journal`
- Existing data in `athletesData[]` with `performance[]` and `records{}`
- `MONTHS`, `AVAILABLE_GROUPS`, `allTimeRecords` already initialized

## Implementation Order

### Step 1: CSS Styles (~80 lines)

Add journal-specific CSS in `<style>` section (after existing styles, before `</style>`):

```css
/* Journal View */
.journal-view { /* full-screen overlay, same as #analytics-view */ }
.journal-header { /* title + counter + close button */ }
.journal-filters { /* group chips + exercise filter toggles */ }
.journal-table { /* table with fixed layout */ }
.journal-table th { /* sticky header */ }
.journal-table td { /* cell styling, min 44px tap target */ }
.journal-cell { /* value display + record subtitle */ }
.journal-cell--empty { /* dash styling */ }
.journal-cell--editing { /* active input state */ }
.journal-cell__value { /* main number */ }
.journal-cell__record { /* small muted record text */ }
.journal-counter { /* "Принято: X/Y" badge */ }
.journal-filter-chip { /* exercise filter button */ }
.journal-filter-chip--active { /* active filter state */ }
```

### Step 2: HTML Markup (~40 lines)

Add journal view section in `<body>` (after `#analytics-view`, before `<!-- Модальное окно -->`):

```html
<div id="journal-view" class="journal-view">
    <div class="journal-header">
        <button onclick="closeJournalView()">←</button>
        <h2>Журнал</h2>
        <span id="journal-counter" class="journal-counter"></span>
    </div>
    <div class="journal-filters">
        <div id="journal-group-chips"></div>
        <div id="journal-exercise-filter"></div>
    </div>
    <table class="journal-table">
        <thead id="journal-thead"></thead>
        <tbody id="journal-tbody"></tbody>
    </table>
</div>
```

Add nav button in `.bottom-nav`:

```html
<button class="nav-item" data-nav="journal" onclick="openJournalView()">
    <div class="nav-icon">📋</div>
    <div>Журнал</div>
</button>
```

### Step 3: JavaScript Functions (~250 lines)

Add in `<script>` section (after analytics functions, before constitution check):

```javascript
// === JOURNAL VIEW FUNCTIONS (Feature: 008-training-journal) ===

// State
let journalSelectedGroups = [];
let journalExerciseFilter = { field: null, mode: null };
let journalEditingCell = null;

const JOURNAL_EXERCISES = [
    { field: 'pullUps', label: 'Подт', fullLabel: 'Подтягивания' },
    { field: 'pushUps', label: 'Отж', fullLabel: 'Отжимания' },
    { field: 'dips', label: 'Бр', fullLabel: 'Брусья' }
];

// Current month index in season (0=Sept, 11=Aug)
function getCurrentMonthIndex() { ... }

// Open/Close journal view
function openJournalView() { ... }   // Same pattern as openAnalyticsView()
function closeJournalView() { ... }  // Same pattern as closeAnalyticsView()

// Render functions
function renderJournalGroupChips() { ... }    // Group filter chips
function renderJournalExerciseFilter() { ... } // Exercise has/missing toggles
function renderJournalTable() { ... }          // Main table render
function renderJournalRow(athlete, monthIndex) { ... } // Single row
function updateJournalCounter(filtered, total) { ... }  // "Принято: X/Y"

// Filter functions
function toggleJournalGroup(groupName) { ... }
function toggleJournalExerciseFilter(field, mode) { ... }
function getJournalFilteredAthletes() { ... }

// Cell editing
function startJournalCellEdit(athleteId, exerciseField) { ... }
function saveJournalCellValue(athleteId, exerciseField, value) { ... }
function cancelJournalCellEdit() { ... }
```

### Step 4: Integration

1. Add nav item click handler (if not using `onclick`)
2. Ensure `calculateAllTimeRecords()` is called before opening journal
3. Test offline: values save to localStorage
4. Test sync: pendingChanges picked up by existing sync

## Key Implementation Notes

- **Current month**: February 2026 → `getMonth()=1` → index `1+4=5` → `MONTHS[5]='Фев'`
- **Empty cell display**: `—` (em dash, not hyphen)
- **Zero vs empty**: `0` displays as "0", missing/undefined displays as "—"
- **Touch targets**: All cells ≥ 44x44px
- **No horizontal scroll**: 4 columns fit in 375px viewport
- **Record display**: Below value in smaller font, e.g., `12` (value) / `р:15` (record)
- **Record update**: If new value > all-time record, record updates immediately in UI

## File Changes

Only `index.html` is modified:
- CSS: ~80 new lines (journal styles)
- HTML: ~40 new lines (journal view + nav item)
- JS: ~250 new lines (journal functions)
- Total: ~370 lines added to single file

No new files created. No database changes. No new dependencies.
