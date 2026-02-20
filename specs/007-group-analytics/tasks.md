# Implementation Tasks: Аналитика по группам и показателям

**Feature**: 007-group-analytics  
**Branch**: `007-group-analytics`  
**Date**: 2025-11-23  
**Status**: Ready for Implementation

---

## Task Summary

| Phase | User Story | Tasks | Parallelizable | Dependencies |
|-------|------------|-------|----------------|--------------|
| Phase 1 | Setup | 3 | 0 | None |
| Phase 2 | Foundational | 5 | 3 | Phase 1 complete |
| Phase 3 | US1 (P1 - MVP) | 8 | 5 | Phase 2 complete |
| Phase 4 | US2 (P2) | 7 | 4 | Phase 3 complete |
| Phase 5 | US3 (P3) | 6 | 3 | Phase 3 complete |
| Phase 6 | Polish | 6 | 4 | All stories complete |
| **TOTAL** | - | **35** | **19** | - |

---

## Implementation Strategy

### MVP First (Phase 3 - User Story 1)

**Goal**: Deliver minimal viable analytics page showing group statistics.

**What's included**:
- ✅ Navigation button to analytics page
- ✅ Group cards display (all 6 groups + "Без группы")
- ✅ Athlete counts per group
- ✅ Basic offline functionality

**What's deferred**:
- ⏭️ Exercise statistics (Phase 4)
- ⏭️ Group assignment modal (Phase 5)
- ⏭️ SVG charts (Phase 4)

**Independent test**: Open analytics page → verify all groups displayed with correct counts.

---

### Incremental Delivery

Each phase delivers independently testable functionality:

1. **Phase 3 (US1)**: Basic analytics page - tester can verify group cards
2. **Phase 4 (US2)**: Exercise statistics - tester can select exercise and see stats
3. **Phase 5 (US3)**: Group management - tester can assign groups to athletes

---

## Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
    ├──→ Phase 3 (US1 - MVP) ──→ Phase 4 (US2)
    │                        └──→ Phase 5 (US3)
    │
    └──────────────────────────→ Phase 6 (Polish)
```

**Story Independence**:
- ✅ US1 → US2: Sequential (US2 depends on US1 navigation)
- ✅ US1 → US3: Sequential (US3 depends on US1 navigation)
- ⚠️ US2 ⇄ US3: Independent (can be implemented in parallel after US1)

---

## Phase 1: Setup (Project Initialization)

**Goal**: Prepare development environment and verify constitution compliance.

**Duration**: ~10 minutes

**Independent Test**: N/A (infrastructure only)

### Tasks

- [ ] T001 Verify feature branch checked out (007-group-analytics)
- [ ] T002 Read constitution.md and verify compliance with all 6 principles (index.html)
- [ ] T003 Read existing index.html structure and identify insertion points for CSS/HTML/JS (index.html:1-3500)

**Completion Criteria**: Branch active, constitution verified, code structure understood.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Add core navigation and page structure that all user stories depend on.

**Duration**: ~30 minutes

**Independent Test**: Navigate to analytics page → see empty page with header "Аналитика".

### Tasks

- [ ] T004 [P] Add CSS styles for .analytics-view container in index.html (index.html:16-550)
- [ ] T005 [P] Add CSS styles for .analytics-header with title styling in index.html (index.html:16-550)
- [ ] T006 Add HTML structure <div id="analytics-view" class="view-container"> in index.html (index.html:551-650)
- [ ] T007 Add navigation button "📊 Аналитика" to bottom nav bar in index.html (index.html:551-650)
- [ ] T008 Implement openAnalyticsView() function in index.html (index.html:651+)

**Completion Criteria**: 
- ✅ Analytics button visible in bottom nav
- ✅ Clicking button shows analytics page with header
- ✅ Page uses dark theme colors (#0f1117, #1a1d29)
- ✅ Touch target 44x44px minimum

**Parallel Execution Example**:
```bash
# T004 and T005 can run in parallel (different CSS sections)
Task A: Add .analytics-view styles (lines 300-320)
Task B: Add .analytics-header styles (lines 321-340)
```

---

## Phase 3: User Story 1 - Просмотр статистики по группам (P1 - MVP)

**Goal**: Display group cards showing athlete counts for all groups including "Без группы".

**Duration**: ~1-2 hours

**User Story**: Тренер открывает страницу аналитики и видит сводную информацию по всем группам: количество спортсменов в каждой группе, количество спортсменов без группы.

**Independent Test**: 
1. Open index.html in mobile browser
2. Tap "📊 Аналитика" button
3. Verify all 6 groups displayed: М-19, М-117, М-118, А-29, А-218, А-219
4. Verify "Без группы" card appears if athletes with null group exist
5. Verify athlete counts match localStorage data

**Acceptance Criteria**:
- ✅ Page opens in <2 seconds (SC-001)
- ✅ All groups displayed with correct counts
- ✅ "Без группы" count shown (SC-002)
- ✅ Works offline from localStorage (SC-005)

### Tasks

- [ ] T009 [P] [US1] Add CSS styles for .group-card component with dark theme in index.html (index.html:16-550)
- [ ] T010 [P] [US1] Add CSS styles for .group-cards-container grid layout in index.html (index.html:16-550)
- [ ] T011 [US1] Add HTML container <div class="group-cards-container"> in analytics-view in index.html (index.html:551-650)
- [ ] T012 [P] [US1] Implement loadGroupStatistics() function to load data from localStorage in index.html (index.html:651+)
- [ ] T013 [P] [US1] Implement calculateGroupCounts() helper to count athletes per group in index.html (index.html:651+)
- [ ] T014 [P] [US1] Implement renderGroupCards() function to display group cards with counts in index.html (index.html:651+)
- [ ] T015 [US1] Update openAnalyticsView() to call loadGroupStatistics() and renderGroupCards() in index.html (index.html:651+)
- [ ] T016 [US1] Add console logging with emoji (📊, ✅) for group loading operations in index.html (index.html:651+)

**Completion Criteria**:
- ✅ 7 group cards render (6 active groups + "Без группы")
- ✅ Counts calculated from athletesData in localStorage
- ✅ Groups with 0 athletes show "0 спортсменов"
- ✅ AVAILABLE_GROUPS constant used for group list
- ✅ Touch-optimized (44x44px cards) (SC-007)
- ✅ Russian language only

**Parallel Execution Example**:
```bash
# After T011 completes, T012-T014 can run in parallel (different functions)
Task A: Implement loadGroupStatistics() (T012)
Task B: Implement calculateGroupCounts() (T013)  
Task C: Implement renderGroupCards() (T014)
```

---

## Phase 4: User Story 2 - Просмотр показателей по упражнениям (P2)

**Goal**: Add exercise selector and statistics display with group comparison.

**Duration**: ~2-3 hours

**User Story**: Тренер выбирает упражнение и видит показатели за текущий сезон (год) с разбивкой по группам: средние значения, лучшие результаты, динамику по месяцам.

**Independent Test**:
1. Open analytics page
2. Select exercise "Подтягивания" from dropdown
3. Verify statistics table displays for each group:
   - Количество спортсменов: [count]
   - Средний результат: [average] раз
   - Лучший результат: [max] раз
4. Verify statistics calculate in <2 seconds (SC-003)
5. Verify groups with no data show "Нет данных"

**Acceptance Criteria**:
- ✅ Exercise dropdown populated from exercisesData
- ✅ Statistics calculate from current season only (Sept-Aug)
- ✅ Calculation time <2 seconds (SC-003)
- ✅ Groups with no performances show "Нет данных"
- ✅ Units display correctly (раз/кг/сек)

### Tasks

- [ ] T017 [P] [US2] Add CSS styles for .exercise-selector dropdown in index.html (index.html:16-550)
- [ ] T018 [P] [US2] Add CSS styles for .statistics-table with dark theme in index.html (index.html:16-550)
- [ ] T019 [P] [US2] Add CSS styles for .chart-svg container for future chart rendering in index.html (index.html:16-550)
- [ ] T020 [US2] Add HTML <select class="exercise-selector"> dropdown in analytics-view in index.html (index.html:551-650)
- [ ] T021 [US2] Add HTML <div class="statistics-display"> container in analytics-view in index.html (index.html:551-650)
- [ ] T022 [US2] Implement calculateGroupStatistics(groupName, exerciseName) function using Array.reduce() in index.html (index.html:651+)
- [ ] T023 [US2] Implement renderExerciseStatistics(exerciseName) function to display table with group stats in index.html (index.html:651+)

**Completion Criteria**:
- ✅ Exercise dropdown shows all exercises from exercisesData
- ✅ Selecting exercise triggers statistics calculation
- ✅ Statistics use getCurrentSeason() for date filtering
- ✅ Average/best/worst calculated correctly with Array.reduce()
- ✅ Edge case: empty performances array returns 0 values
- ✅ Console logging with emoji (📊 Расчет статистики...)

**Parallel Execution Example**:
```bash
# T017-T019 can run in parallel (different CSS sections)
Task A: Add .exercise-selector styles (T017)
Task B: Add .statistics-table styles (T018)
Task C: Add .chart-svg styles (T019)

# After T020-T021 complete, T022-T023 can run in parallel
Task D: Implement calculateGroupStatistics() (T022)
Task E: Implement renderExerciseStatistics() (T023)
```

---

## Phase 5: User Story 3 - Управление спортсменами без группы (P3)

**Goal**: Allow coach to assign groups to athletes from "Без группы" list.

**Duration**: ~1-2 hours

**User Story**: Тренер открывает список спортсменов без группы и видит детальный список с возможностью быстро назначить группу каждому спортсмену.

**Independent Test**:
1. Open analytics page
2. Tap "Без группы" card
3. Verify modal opens with list of athletes where group = null
4. Tap athlete name → select group "М-19" → save
5. Verify athlete moved to М-19 group
6. Verify "⏳" pending indicator appears
7. Verify localStorage updated immediately
8. Verify change added to pendingChanges queue

**Acceptance Criteria**:
- ✅ Modal opens when "Без группы" card clicked (SC-002)
- ✅ All athletes with group=null displayed
- ✅ Group assignment saves in <10 seconds (SC-004)
- ✅ Changes saved to localStorage + pendingChanges (FR-010)
- ✅ Pending indicator "⏳" displays (FR-012)
- ✅ Group cards refresh after assignment

### Tasks

- [ ] T024 [P] [US3] Add CSS styles for .no-group-modal dark theme styling in index.html (index.html:16-550)
- [ ] T025 [P] [US3] Add CSS styles for .athlete-list-item touch-optimized (44x44px) in index.html (index.html:16-550)
- [ ] T026 [US3] Add HTML <div id="no-group-modal" class="modal"> structure in index.html (index.html:551-650)
- [ ] T027 [US3] Implement openNoGroupAthletes() function to open modal with filtered athletes in index.html (index.html:651+)
- [ ] T028 [P] [US3] Implement assignGroupToAthlete(athleteId, groupName) function with validation in index.html (index.html:651+)
- [ ] T029 [US3] Update group assignment to save to localStorage and add to pendingChanges queue in index.html (index.html:651+)

**Completion Criteria**:
- ✅ Modal opens on "Без группы" card click
- ✅ Athletes with group=null filtered correctly
- ✅ Group dropdown shows AVAILABLE_GROUPS
- ✅ Validation: group must be in AVAILABLE_GROUPS
- ✅ localStorage updated immediately
- ✅ pendingChanges queue includes change
- ✅ Group cards refresh after save
- ✅ Console logging: "✅ Группа назначена: [athlete] → [group]"

**Parallel Execution Example**:
```bash
# T024-T025 can run in parallel (different CSS sections)
Task A: Add .no-group-modal styles (T024)
Task B: Add .athlete-list-item styles (T025)

# After T026 completes, T027-T028 can run in parallel
Task C: Implement openNoGroupAthletes() (T027)
Task D: Implement assignGroupToAthlete() (T028)
```

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Improve UX, add error handling, optimize performance, and prepare for production.

**Duration**: ~1-2 hours

**Independent Test**: 
1. Test all user stories on real mobile device (Safari iOS)
2. Test offline mode (airplane mode)
3. Test edge cases (empty data, null values)
4. Verify performance targets met

### Tasks

- [ ] T030 [P] Add error handling for empty athletesData in loadGroupStatistics() in index.html (index.html:651+)
- [ ] T031 [P] Add error handling for empty performancesData in calculateGroupStatistics() in index.html (index.html:651+)
- [ ] T032 [P] Add loading indicator "Загрузка..." during statistics calculation in index.html (index.html:651+)
- [ ] T033 [P] Add "Нет данных" message when exercise has no performances for current season in index.html (index.html:651+)
- [ ] T034 Verify all Russian language strings (no English UI text) in index.html (index.html:1-3500)
- [ ] T035 Manual testing: Test on Safari iOS and Chrome Android with real devices

**Completion Criteria**:
- ✅ Graceful handling of empty data arrays
- ✅ Loading indicators during calculations
- ✅ "Нет данных" shown when appropriate
- ✅ All UI text in Russian
- ✅ Performance: page load <2s, stats <2s (SC-001, SC-003)
- ✅ Touch targets 44x44px minimum (SC-007)
- ✅ Works offline (SC-005)

**Parallel Execution Example**:
```bash
# T030-T033 can run in parallel (different functions)
Task A: Error handling for athletesData (T030)
Task B: Error handling for performancesData (T031)
Task C: Loading indicators (T032)
Task D: "Нет данных" messages (T033)
```

---

## Testing Checklist

### Manual Testing (Required)

Use quickstart.md for detailed testing protocol.

**User Story 1 (US1)**:
- [ ] Group cards display with correct counts
- [ ] "Без группы" card appears if athletes with null group
- [ ] Page loads in <2 seconds (SC-001)
- [ ] Works offline from localStorage (SC-005)

**User Story 2 (US2)**:
- [ ] Exercise dropdown populated
- [ ] Statistics calculate correctly (verify 2-3 manually)
- [ ] Calculation time <2 seconds (SC-003)
- [ ] "Нет данных" shown for groups with no performances
- [ ] Only current season data included

**User Story 3 (US3)**:
- [ ] "Без группы" modal opens
- [ ] Athletes with null group displayed
- [ ] Group assignment saves and updates cards
- [ ] localStorage updated immediately
- [ ] pendingChanges queue includes change
- [ ] "⏳" pending indicator appears

**Cross-Story Testing**:
- [ ] All touch targets 44x44px minimum (SC-007)
- [ ] All UI text in Russian
- [ ] Dark theme colors used throughout
- [ ] Offline mode works (airplane mode test)
- [ ] Sync to Supabase when online

---

## Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page load | <2s on 3G | Lighthouse mobile audit |
| Group cards render | <10ms | console.time() in loadGroupStatistics() |
| Statistics calculation | <50ms | console.time() in calculateGroupStatistics() |
| Touch response | <100ms | Manual testing on device |
| Total analytics page | <100ms | Sum of all calculations |

---

## Edge Cases to Test

- [ ] Empty athletesData (no athletes in system)
- [ ] Empty performancesData (no performances recorded)
- [ ] All athletes have null group (only "Без группы" card)
- [ ] Group with 0 athletes (shows "0 спортсменов")
- [ ] Exercise with no performances for current season ("Нет данных")
- [ ] Very long exercise names (truncation)
- [ ] Very high performance values (display formatting)

---

## Rollback Plan

If feature needs to be reverted:

1. **Remove navigation button**: Delete "📊 Аналитика" button from bottom nav
2. **Hide analytics view**: Add `display: none` to #analytics-view
3. **No data migration needed**: No Supabase schema changes
4. **localStorage unchanged**: Existing athletesData not modified

**Rollback command**:
```bash
git checkout main -- index.html
# OR revert specific commit
git revert <commit-hash>
```

---

## Success Metrics (Post-Launch)

After feature is deployed and used by coach:

- [ ] Analytics page opened at least once per training session
- [ ] Group assignments from "Без группы" reduce null count to <5%
- [ ] Exercise statistics viewed for >3 different exercises per session
- [ ] No performance complaints (<2s target met in production)
- [ ] No offline functionality issues reported

---

## Next Steps After Task Completion

1. **Run /speckit.analyze**: Validate tasks.md consistency with spec.md and plan.md
2. **Start /speckit.implement**: Execute tasks in order (T001 → T035)
3. **Test after each phase**: Use quickstart.md testing protocol
4. **Commit incrementally**: Commit after each completed phase
5. **Final validation**: Complete all manual testing checklist items

---

**Tasks Ready for Implementation** - 35 tasks, 19 parallelizable, 6 phases
