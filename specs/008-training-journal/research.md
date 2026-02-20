# Phase 0 Research: Training Journal (Тренерский журнал)

**Feature**: 008-training-journal | **Date**: 2026-02-20

## Research Tasks & Findings

### R1: Navigation Pattern

**Decision**: Full-screen overlay view (same pattern as Analytics view, Feature 007)

**Rationale**:
- Analytics view already implements the pattern: hide `.container`, show `#analytics-view.show`
- Bottom nav has 4 tabs (Ученики, Цели, Настройки, Логи) — adding a 5th "Журнал" tab fits naturally
- Full-screen view maximizes table space on mobile (critical for 3-column exercise table)
- `openAnalyticsView()` / `closeAnalyticsView()` provide exact template for open/close functions

**Alternatives considered**:
- Modal overlay: Rejected — modal pattern is for detail views (single athlete), not multi-row tables
- Separate page/route: Rejected — single-file PWA, no routing
- Inline section in athlete list: Rejected — not enough screen space for table + filters

**Implementation reference** (index.html):
- Analytics open: line ~5248 (`openAnalyticsView()`) — hides `.container`, shows `#analytics-view`
- Analytics close: line ~5293 (`closeAnalyticsView()`) — reverses the above
- Nav items: lines 1392-1408 (`.bottom-nav` with `.nav-item` buttons)
- Nav CSS: lines 253-284 (`.bottom-nav`, `.nav-item`, `.nav-icon`)

---

### R2: Performance Data Model

**Decision**: Reuse existing `athletesData[].performance[]` and `athletesData[].records{}` structures

**Rationale**:
- Performance data already loaded in memory from localStorage/Supabase sync
- Monthly structure: `performance[12]` = `[{month: 'Сент', pullUps: 0, pushUps: 0, dips: 0}, ...]`
- Records for max calculation: `records = {pullUps: {Сент: 5, Окт: 8}, pushUps: {...}, dips: {...}}`
- All-time records already calculated: `allTimeRecords[athleteId] = {pullUps, pushUps, dips}`
- No new data structures needed — journal reads/writes the same data

**Key data access patterns**:
```javascript
// Get current month's value for athlete
const monthIndex = getCurrentMonthIndex(); // Need to create
const monthData = athlete.performance[monthIndex];
const pullUpsValue = monthData.pullUps; // 0 = empty, >0 = has value

// Get all-time record
const record = allTimeRecords[athlete.id];
const pullUpsMax = record.pullUps;

// Filter by group
athletesData.filter(a => a.group === 'М-19');
```

**Alternatives considered**:
- Separate journal data structure: Rejected — duplicates existing data, sync complexity
- Direct Supabase query per cell: Rejected — offline-first principle violated

---

### R3: Current Month Calculation

**Decision**: Calculate from JS Date + MONTHS array mapping

**Rationale**:
- MONTHS array (line 1708): `['Сент', 'Окт', 'Нояб', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг']`
- Season runs Sept(index 0)–Aug(index 11)
- JS `getMonth()` returns 0-based (Jan=0, Feb=1, ..., Dec=11)
- Mapping formula: `jsMonth >= 8 ? jsMonth - 8 : jsMonth + 4`
  - Sept(8) → 0, Oct(9) → 1, ..., Dec(11) → 3, Jan(0) → 4, ..., Aug(7) → 11

**Implementation**:
```javascript
function getCurrentMonthIndex() {
    const jsMonth = new Date().getMonth(); // 0-11
    return jsMonth >= 8 ? jsMonth - 8 : jsMonth + 4;
}
// Feb 2026: getMonth() = 1 → 1 + 4 = 5 → MONTHS[5] = 'Фев' ✅
```

**Existing code reference**:
- `getMonthName(date)` at line 3163 — maps date → Russian month name
- `getCurrentSeason()` at line 1734 — calculates season year boundaries
- Season date calculation in sync (line 3534-3541) — maps MONTHS index back to calendar date

---

### R4: Cell Edit / Inline Input Pattern

**Decision**: Tap on cell → transform cell to `<input type="number">` → Enter/blur saves

**Rationale**:
- Must be fast (<5 seconds per entry per SC-002)
- Number input triggers numeric keyboard on mobile (critical for speed)
- No modal needed — inline editing minimizes taps (tap → type → done)
- Existing pattern: `recordsForm` uses `<input type="number">` for exercise values (line 4101-4105)

**UX flow**:
1. Tap empty cell (—) → cell becomes `<input type="number" inputmode="numeric" pattern="[0-9]*">`
2. Numeric keyboard appears
3. Type number → press Enter or tap outside
4. Value saved → cell reverts to display mode
5. If cell had value → input pre-filled with current value

**Alternatives considered**:
- Modal popup per cell: Rejected — too many taps, breaks flow
- Swipe to edit: Rejected — conflicts with table scroll
- Long press: Rejected — adds latency, not intuitive

---

### R5: Save Pattern for Journal Edits

**Decision**: Update in-memory `athlete.performance[monthIndex]`, recalculate records, save to localStorage, push full athlete data to pendingChanges

**Rationale**:
- Must follow constitution's offline-first data flow (constitution line 73-100)
- Existing save pattern (line 4100-4150): collects all 12 months → updates athlete → pushes to pendingChanges
- Supabase sync deletes all performances for athlete and re-inserts (line 3520-3577)
- Journal should update only the changed month in memory, but pendingChanges sends full performance array (same as existing pattern)

**Implementation pattern**:
```javascript
// 1. Update in-memory
athlete.performance[monthIndex][exerciseField] = newValue;

// 2. Recalculate records
if (newValue > 0) {
    athlete.records[exerciseField][MONTHS[monthIndex]] = newValue;
} else {
    delete athlete.records[exerciseField][MONTHS[monthIndex]];
}

// 3. Recalculate all-time records
calculateAllTimeRecords();

// 4. Save to localStorage
saveToLocalStorage();

// 5. Queue for sync (same format as recordsForm)
pendingChanges.push({
    type: 'athlete',
    athleteId: athlete.id,
    athleteName: `${athlete.lastName} ${athlete.firstName}`,
    data: { id: athlete.id, group: athlete.group, performance: athlete.performance.map(...) }
});
saveToLocalStorage();

// 6. Update UI
updatePendingIndicator();
```

**Alternatives considered**:
- Granular per-exercise pendingChange: Rejected — sync function expects full athlete data
- Debounced batch save: Rejected — complexity vs benefit for simple number inputs

---

### R6: Filtering Approach

**Decision**: Group filter (chip buttons) + exercise value filter (toggle per exercise)

**Rationale**:
- Group filter follows existing chip pattern (line ~1350-1387: group filter buttons)
- Exercise filter is new: "Есть подтягивания" / "Нет подтягиваний" toggles
- Both filters apply simultaneously (AND logic)
- Multi-group selection: allow selecting multiple group chips (like multi-select)

**Implementation**:
- Group chips: reuse `AVAILABLE_GROUPS` constant (line 1721)
- Exercise filter: 3 toggle buttons (Подт / Отж / Бр) with states: all / has value / no value
- Filter function: `athletesData.filter(a => matchesGroup(a) && matchesExerciseFilter(a))`

---

### R7: Table Layout for Mobile

**Decision**: Fixed left column (names) + 3 scrollable exercise columns

**Rationale**:
- 3 exercises fit on mobile screen without horizontal scroll (spec SC-001)
- Name column ~40% width, each exercise column ~20% width
- Portrait layout: ~375px viewport → name: ~150px, exercises: ~75px each
- Two rows per cell: current value (large) + record (small, muted)

**Layout sketch**:
```
┌──────────┬──────┬──────┬──────┐
│ Имя      │ Подт │ Отж  │ Бр   │
├──────────┼──────┼──────┼──────┤
│ Иванов   │  12  │  —   │  8   │
│          │ р:15 │      │ р:10 │
├──────────┼──────┼──────┼──────┤
│ Петров   │  —   │  25  │  —   │
│          │      │ р:25 │      │
└──────────┴──────┴──────┴──────┘
```

**Alternatives considered**:
- Horizontal scroll table: Rejected — spec requires no horizontal scroll (SC-001)
- Card layout per athlete: Rejected — doesn't show comparative view across group
- Expandable rows: Rejected — adds taps, defeats purpose of quick overview

---

## Summary

All technical unknowns resolved. No NEEDS CLARIFICATION items remain.

| # | Decision | Pattern |
|---|----------|---------|
| R1 | Navigation | Full-screen overlay (analytics pattern) + 5th nav tab |
| R2 | Data | Reuse existing `athletesData` performance/records arrays |
| R3 | Current month | `jsMonth >= 8 ? jsMonth - 8 : jsMonth + 4` formula |
| R4 | Cell editing | Inline `<input type="number">` on tap, Enter/blur saves |
| R5 | Save pattern | Update memory → recalculate → localStorage → pendingChanges |
| R6 | Filtering | Group chips (multi-select) + exercise value toggles |
| R7 | Table layout | Fixed 4-column table, no horizontal scroll, value + record per cell |
