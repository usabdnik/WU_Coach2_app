# Tasks: Training Journal (Тренерский журнал)

**Input**: Design documents from `/specs/008-training-journal/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md
**Tests**: Not requested — manual testing only (per project constitution)
**Organization**: Tasks grouped by user story for independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different sections, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- All changes in single file: `index.html`

---

## Phase 1: Setup (State & Helpers)

**Purpose**: Add journal state variables, constants, and helper functions

- [ ] T001 Add journal state variables (`journalSelectedGroups`, `journalExerciseFilter`, `journalEditingCell`) and `JOURNAL_EXERCISES` constant in `<script>` section of index.html (after analytics state, before analytics functions)
- [ ] T002 Implement `getCurrentMonthIndex()` helper function that maps JS `getMonth()` to MONTHS array index using formula `jsMonth >= 8 ? jsMonth - 8 : jsMonth + 4` in `<script>` section of index.html

---

## Phase 2: Foundational (CSS + HTML + Navigation)

**Purpose**: Core visual structure and navigation — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add journal view CSS styles in `<style>` section of index.html: `.journal-view` (full-screen overlay, position fixed, background #0f1117, z-index 200), `.journal-header` (flex row, padding 15px), `.journal-table` (width 100%, border-collapse, table-layout fixed), `.journal-table th` (sticky top, background #1a1d29, color #8b8f9f, font-size 12px), `.journal-table td` (min-height 44px, padding 8px, border-bottom 1px solid #2a2d3a, text-align center, vertical-align middle), `.journal-cell__value` (font-size 17px, color #ffffff), `.journal-cell__record` (font-size 11px, color #6b6f82), `.journal-cell--empty` (color #6b6f82), `.journal-counter` (background #4c9eff, border-radius 12px, padding 4px 10px, font-size 12px)
- [ ] T004 Add journal view HTML markup in `<body>` section of index.html (after `#analytics-view` div, before `<!-- Модальное окно -->`): container `#journal-view.journal-view` with header (back button, title "Журнал", counter span), filter area (`#journal-group-chips`, `#journal-exercise-filter`), and table (`#journal-thead`, `#journal-tbody`)
- [ ] T005 Add journal nav button `<button class="nav-item" data-nav="journal" onclick="openJournalView()">` with icon 📋 and label "Журнал" in `.bottom-nav` section of index.html (between "Настройки" and "Логи" buttons)
- [ ] T006 Implement `openJournalView()` and `closeJournalView()` functions in `<script>` section of index.html following analytics pattern: hide `.container`, show/hide `#journal-view` with `.show` class, update `.nav-item` active states, call `calculateAllTimeRecords()` and `renderJournalGroupChips()` on open

**Checkpoint**: Journal view opens/closes via nav button. Empty table structure visible. Navigation works.

---

## Phase 3: User Story 1 — Просмотр журнала группы (Priority: P1) 🎯 MVP

**Goal**: Тренер видит табличный журнал группы с именами, значениями за текущий месяц, рекордами и счётчиком прогресса

**Independent Test**: Открыть журнал → выбрать группу М-19 → убедиться что все ученики группы отображаются с корректными значениями за текущий месяц, рекордами и счётчиком "Принято: X/Y"

### Implementation

- [ ] T007 [US1] Implement `renderJournalGroupChips()` in `<script>` of index.html: generate chip buttons from `AVAILABLE_GROUPS` array, each with onclick calling `toggleJournalGroup(groupName)`, use CSS classes `.journal-group-chip` and `.journal-group-chip--active`, render into `#journal-group-chips` container
- [ ] T008 [US1] Add CSS for `.journal-group-chip` (background #2a2d3a, color #8b8f9f, border-radius 16px, padding 6px 14px, min-height 36px, margin 4px, font-size 13px) and `.journal-group-chip--active` (background #4c9eff, color #ffffff) in `<style>` of index.html
- [ ] T009 [US1] Implement `toggleJournalGroup(groupName)` in `<script>` of index.html: set `journalSelectedGroups = [groupName]` (single-select for US1, multi-select added in US4), re-render chips and table
- [ ] T010 [US1] Implement `getJournalFilteredAthletes()` in `<script>` of index.html: filter `athletesData` by `journalSelectedGroups` (athlete.group must be in selected list), exclude athletes with `group === null`, filter only active athletes (`status === 'active'`), sort by `lastName`
- [ ] T011 [US1] Implement `renderJournalTable()` in `<script>` of index.html: get current month index via `getCurrentMonthIndex()`, get filtered athletes, render `<thead>` with columns (Имя, Подт, Отж, Бр), render `<tbody>` by calling `renderJournalRow()` for each athlete, show "Нет учеников в группе" if empty, update counter
- [ ] T012 [US1] Implement `renderJournalRow(athlete, monthIndex)` in `<script>` of index.html: create `<tr>` with name cell (athlete.lastName + first initial), 3 exercise cells each showing current month value (from `athlete.performance[monthIndex][field]`) as number, "0" if zero, or "—" if undefined/missing (per FR-010), and all-time record below value (`allTimeRecords[athlete.id][field]`) in `.journal-cell__record` span with "р:" prefix, only show record if record > 0 and record differs from current value
- [ ] T013 [US1] Implement `updateJournalCounter()` in `<script>` of index.html: count athletes with at least one non-zero exercise value in current month, display "Принято: X/Y" in `#journal-counter` element where X = athletes with values, Y = total in filtered list
- [ ] T014 [US1] Handle edge cases in journal render functions in index.html: display "Нет учеников в группе" when group is empty, display "Выберите группу" when no group selected, display "0" for zero values (not "—"), display "—" only for undefined/missing values
- [ ] T015 [US1] Add emoji console logging for journal operations in `<script>` of index.html: `📋 Открытие журнала`, `📋 Выбрана группа: {name}`, `📋 Отрисовка: {count} учеников`

**Checkpoint**: US1 complete — journal shows group table with values, records, counter. Manually testable.

---

## Phase 4: User Story 2 — Быстрый ввод результата (Priority: P1)

**Goal**: Тренер тапом по ячейке открывает числовое поле ввода, вводит значение — оно сохраняется в localStorage и pendingChanges

**Independent Test**: Тапнуть по пустой ячейке → ввести число → Enter → убедиться что значение отображается, счётчик обновился, pendingChanges содержит изменение

### Implementation

- [ ] T016 [US2] Add onclick handler to exercise cells in `renderJournalRow()`: each `<td>` calls `startJournalCellEdit(athleteId, exerciseField)` on tap in `<script>` of index.html
- [ ] T017 [US2] Implement `startJournalCellEdit(athleteId, exerciseField)` in `<script>` of index.html: replace cell content with `<input type="number" inputmode="numeric" pattern="[0-9]*" min="0">`, pre-fill with current value if > 0, auto-focus input, set `journalEditingCell = {athleteId, exerciseField}`, add keydown listener for Enter (save) and Escape (cancel), add blur listener (save)
- [ ] T018 [US2] Add CSS for journal cell input in `<style>` of index.html: `.journal-cell input` (width 100%, background #2a2d3a, color #ffffff, border 1px solid #4c9eff, border-radius 6px, font-size 17px, text-align center, padding 4px, min-height 36px, -webkit-appearance none)
- [ ] T019 [US2] Implement `saveJournalCellValue(athleteId, exerciseField, value)` in `<script>` of index.html: parse integer from input, validate ≥ 0, update `athlete.performance[currentMonthIndex][exerciseField]`, update `athlete.records[exerciseField]` (set or delete month key), call `calculateAllTimeRecords()`, push to `pendingChanges` with `type: 'athlete'` format (same as recordsForm pattern at line ~4136), call `saveToLocalStorage()`, call `updatePendingIndicator()`, re-render the changed row, update journal counter
- [ ] T020 [US2] Implement `cancelJournalCellEdit()` in `<script>` of index.html: revert cell content to display mode with previous value, clear `journalEditingCell`
- [ ] T021 [US2] Add input validation in `saveJournalCellValue()` in index.html: reject negative values, handle empty input (revert to previous), handle NaN from parseInt (revert), handle blur when input is empty (cancel edit, don't save)
- [ ] T022 [US2] Add console logging for cell edits in `<script>` of index.html: `📋 Редактирование: {athleteName} / {exerciseName}`, `✅ Сохранено: {athleteName} / {exerciseName} = {value}`, `⏳ Добавлено в очередь синхронизации`

**Checkpoint**: US2 complete — tap to edit cells, values persist in localStorage, pendingChanges queue updated.

---

## Phase 5: User Story 3 — Фильтрация по наличию значений (Priority: P2)

**Goal**: Тренер фильтрует список учеников по наличию/отсутствию значений конкретного упражнения

**Independent Test**: Выбрать группу → включить фильтр "Нет подтягиваний" → убедиться что показаны только ученики без значения подтягиваний → ввести значение одному → он исчезает из списка

### Implementation

- [ ] T023 [US3] Implement `renderJournalExerciseFilter()` in `<script>` of index.html: render 3 toggle chips (Подт / Отж / Бр) in `#journal-exercise-filter`, each with 3 states via onclick cycling: off → "Есть" (has) → "Нет" (missing) → off, display current state text on chip
- [ ] T024 [US3] Add CSS for `.journal-filter-chip` (similar to group chip but smaller, margin-top 8px) and state variants: `--has` (background #4ade80, color #0f1117), `--missing` (background #dc2626, color #ffffff) in `<style>` of index.html
- [ ] T025 [US3] Implement `toggleJournalExerciseFilter(field)` in `<script>` of index.html: cycle filter state for given field (null → 'has' → 'missing' → null), update `journalExerciseFilter`, re-render filter UI and table
- [ ] T026 [US3] Update `getJournalFilteredAthletes()` in `<script>` of index.html: apply exercise filter as AND condition with group filter — if `journalExerciseFilter.field` is set, check `athlete.performance[currentMonthIndex][field]`: mode 'has' = value > 0, mode 'missing' = value === 0 or undefined
- [ ] T027 [US3] Ensure real-time filter update after cell save: after `saveJournalCellValue()`, call `renderJournalTable()` which re-applies all active filters, so athlete may appear/disappear from filtered list

**Checkpoint**: US3 complete — exercise filter toggles work, real-time update on value entry.

---

## Phase 6: User Story 4 — Мультигрупповой просмотр (Priority: P3)

**Goal**: Тренер выбирает несколько групп одновременно и видит учеников всех групп с визуальным разделением

**Independent Test**: Выбрать две группы → убедиться что ученики обеих групп видны → группы визуально разделены подзаголовками

### Implementation

- [ ] T028 [US4] Update `toggleJournalGroup(groupName)` in `<script>` of index.html: change from single-select to multi-toggle — if group already in `journalSelectedGroups` remove it, otherwise add it; re-render chips and table
- [ ] T029 [US4] Update `renderJournalTable()` in `<script>` of index.html: when multiple groups selected, group athletes by `athlete.group`, render group subheader row (`<tr class="journal-group-header"><td colspan="4">{groupName} ({count})</td></tr>`) before each group's athletes
- [ ] T030 [US4] Add CSS for `.journal-group-header` (background #1a1d29, color #4c9eff, font-size 13px, font-weight 600, padding 8px 10px, text-align left) in `<style>` of index.html

**Checkpoint**: US4 complete — multi-group selection with visual separators works.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, constitution compliance, testing, documentation

- [ ] T031 Verify constitution compliance in index.html: single-file (no new files created), no runtime dependencies added, offline-first data flow (localStorage → pendingChanges), dark theme colors only (#0f1117, #1a1d29, #4c9eff, etc.), Russian language only (all UI text), mobile-first (44px touch targets, no horizontal scroll)
- [ ] T032 Verify all touch targets ≥ 44x44px in journal view: table cells, filter chips, nav button, back button, input field in `<style>` of index.html
- [ ] T033 Manual testing: open journal via nav → select group → verify athletes display with correct current month values and all-time records
- [ ] T034 Manual testing: tap cell → enter value → verify save to localStorage → check pendingChanges array in DevTools → verify counter update
- [ ] T035 Manual testing: offline mode (airplane mode) → enter values → verify localStorage persistence → reconnect → sync → verify data in Supabase
- [ ] T036 Manual testing: exercise filter → "Нет подтягиваний" → verify correct filtering → enter value → verify athlete disappears from filtered list
- [ ] T037 Manual testing: multi-group selection → verify group subheaders → verify counter shows combined totals
- [ ] T038 Update CLAUDE.md with Feature 008 status, key function references and line numbers in CLAUDE.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (state vars and helper used by CSS/HTML/JS)
- **User Stories (Phase 3+)**: All depend on Phase 2 (visual structure and navigation)
  - US1 (Phase 3): Depends on Phase 2 only
  - US2 (Phase 4): Depends on US1 (needs rendered table cells to edit)
  - US3 (Phase 5): Depends on US1 (needs table to filter) + US2 (real-time update on save)
  - US4 (Phase 6): Depends on US1 (extends group selection logic)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                        │
                        ▼
                   Phase 3 (US1: View) ─────────────┐
                        │                           │
                        ▼                           ▼
                   Phase 4 (US2: Edit)    Phase 6 (US4: Multi-group)
                        │
                        ▼
                   Phase 5 (US3: Filter)
                        │
                        ▼
                   Phase 7 (Polish)
```

### Parallel Opportunities

Within each phase, tasks editing different sections of index.html (`<style>` vs `<script>` vs `<body>`) can be parallelized:
- **Phase 2**: T003 (CSS) and T004 (HTML) can run in parallel, then T005 + T006
- **Phase 3**: T007-T008 (chips + CSS) in parallel with T010-T012 (table render)
- **Phase 4**: T018 (CSS) in parallel with T017 (JS handler)
- **Phase 5**: T024 (CSS) in parallel with T023 (JS render)

---

## Parallel Example: User Story 1

```bash
# Step 1: Group filter (chips) + Table render (core) in parallel:
Task T007: "Implement renderJournalGroupChips() in <script>"
Task T008: "Add CSS for .journal-group-chip in <style>"
# ↕ parallel with
Task T010: "Implement renderJournalTable() in <script>"
Task T011: "Implement renderJournalRow() in <script>"

# Step 2: After both complete (sequential):
Task T009: "Implement toggleJournalGroup() — connects chips to table"
Task T012: "Implement updateJournalCounter()"
Task T013: "Edge cases and empty states"
Task T014: "Console logging"
Task T015: "Console logging"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational CSS + HTML + Nav (T003-T006)
3. Complete Phase 3: US1 — View journal with group selection (T007-T015)
4. **STOP and VALIDATE**: Open journal, select group, verify table displays correctly
5. Complete Phase 4: US2 — Tap to edit cells (T016-T022)
6. **STOP and VALIDATE**: Edit cells, verify localStorage + pendingChanges
7. Deploy/demo — core feature is usable

### Incremental Delivery

1. Setup + Foundational → Journal view opens/closes ✅
2. US1 → Table with values + records + counter ✅ (viewable but read-only)
3. US2 → Tap to edit + save ✅ (fully functional MVP!)
4. US3 → Exercise filtering ✅ (workflow optimization)
5. US4 → Multi-group view ✅ (mixed training support)
6. Polish → Testing + docs ✅

---

## Summary

| Metric | Value |
|--------|-------|
| **Total tasks** | 38 |
| **Phase 1 (Setup)** | 2 tasks |
| **Phase 2 (Foundational)** | 4 tasks |
| **Phase 3 (US1: View)** | 9 tasks |
| **Phase 4 (US2: Edit)** | 7 tasks |
| **Phase 5 (US3: Filter)** | 5 tasks |
| **Phase 6 (US4: Multi-group)** | 3 tasks |
| **Phase 7 (Polish)** | 8 tasks |
| **Suggested MVP** | Phases 1-4 (US1 + US2 = 22 tasks) |
| **Files modified** | 1 (index.html) |
| **New files** | 0 |
| **Database changes** | 0 |

## Notes

- All changes in single file `index.html` — no merge conflicts between phases
- [P] marker omitted because all tasks target the same file — parallelism is at section level only
- [Story] labels map: US1=View, US2=Edit, US3=Filter, US4=Multi-group
- Each phase checkpoint allows manual validation before proceeding
- Commit after each completed phase for easy rollback
