---
description: "Task list for Goal Editing & Dynamic Athlete Sync implementation"
---

# Tasks: Goal Editing & Dynamic Athlete Sync

**Input**: Design documents from `specs/001-goal-editing-athlete-sync/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Manual testing only per constitution (no automated test tasks)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different file sections, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact line numbers/sections for single-file architecture

## Path Convention

**CRITICAL DEVIATION**: This project uses single-file architecture (coach-pwa-app (7).html), NOT standard `src/` paths.

All code changes are insertions/modifications within ONE file at specific line ranges:
- **HTML section**: Lines 526-619 (insert modals, forms)
- **CSS section**: Lines 11-524 (insert styles after existing patterns)
- **JavaScript section**: Lines 621-1350 (insert functions after related code)

---

## Phase 1: Setup (Infrastructure)

**Purpose**: Single-file migration and UUID helper setup

- [ ] T001 Add UUID generation helper function to coach-pwa-app (7).html JavaScript section (~line 650)
- [ ] T002 [P] Add data migration function for Goal.updatedAt field in coach-pwa-app (7).html (~line 680)
- [ ] T003 [P] Add data migration function for Athlete ID/status/order fields in coach-pwa-app (7).html (~line 700)
- [ ] T004 Run data migration on app load (add to DOMContentLoaded event listener in coach-pwa-app (7).html ~line 1340)

**Checkpoint**: Helper functions ready, existing data migrated with new fields

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation and modal infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement date validation function validateGoalDates() in coach-pwa-app (7).html JavaScript section (~line 720)
- [ ] T006 [P] Implement description validation function validateDescription() in coach-pwa-app (7).html (~line 740)
- [ ] T007 [P] Implement target value validation function validateTargetValue() in coach-pwa-app (7).html (~line 760)
- [ ] T008 [P] Implement full goal validation function validateGoal() in coach-pwa-app (7).html (~line 780)
- [ ] T009 Implement edit queue coalescing function coalescePendingChanges() in coach-pwa-app (7).html (~line 1100)
- [ ] T010 Update syncData() to use coalesced changes in coach-pwa-app (7).html (~line 1150)

**Checkpoint**: Foundation ready - validation framework operational, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Редактирование дат целей (Edit Goal Dates) (Priority: P1) 🎯 MVP

**Goal**: Coach can edit goal start/end dates via modal, changes save offline and sync

**Independent Test**: Create goal → tap to edit → change start/end dates → save → verify dates persist after page reload → sync → verify in Google Sheets

### HTML for User Story 1

- [ ] T011 [US1] Add goal edit modal HTML structure to coach-pwa-app (7).html body section after existing modals (~line 585)
- [ ] T012 [US1] Add date input fields (start date, end date) to goal edit modal in coach-pwa-app (7).html (~line 590)
- [ ] T013 [US1] Add save/cancel buttons to goal edit modal in coach-pwa-app (7).html (~line 595)
- [ ] T014 [US1] Add validation error display div below date inputs in coach-pwa-app (7).html (~line 593)

### CSS for User Story 1

- [ ] T015 [P] [US1] Add goal edit modal styles to coach-pwa-app (7).html style section after existing modal styles (~line 425)
- [ ] T016 [P] [US1] Add date input styles (dark theme, 48px height, 16px font) in coach-pwa-app (7).html (~line 435)
- [ ] T017 [P] [US1] Add validation error styles (red text, #dc2626 color) in coach-pwa-app (7).html (~line 445)
- [ ] T018 [P] [US1] Add save/cancel button styles (touch-optimized, 48px min) in coach-pwa-app (7).html (~line 455)

### JavaScript for User Story 1

- [ ] T019 [US1] Implement openGoalEditModal(goalId) function in coach-pwa-app (7).html JavaScript section (~line 960)
- [ ] T020 [US1] Implement closeGoalEditModal() function with reset logic in coach-pwa-app (7).html (~line 980)
- [ ] T021 [US1] Implement saveGoalDateEdit(goalId) function with validation in coach-pwa-app (7).html (~line 1000)
- [ ] T022 [US1] Update goal object with new dates and updatedAt timestamp in saveGoalDateEdit() (~line 1010)
- [ ] T023 [US1] Save to localStorage and add to pendingChanges queue in saveGoalDateEdit() (~line 1020)
- [ ] T024 [US1] Update renderGoals() to display updated dates immediately in coach-pwa-app (7).html (~line 900)
- [ ] T025 [US1] Add tap event listener to goal cards to trigger openGoalEditModal() in coach-pwa-app (7).html (~line 920)
- [ ] T026 [US1] Display pending sync indicator (⏳) when pendingChanges queue has goal_edit items in coach-pwa-app (7).html (~line 1130)

**Checkpoint**: User Story 1 complete and independently testable - coach can edit goal dates offline and sync

---

## Phase 4: User Story 2 - Полное редактирование целей (Full Goal Editing) (Priority: P2)

**Goal**: Extend edit modal to support all goal fields (description, target value, exercise type)

**Independent Test**: Edit goal description → save → verify. Edit target value → save → verify. Edit exercise type → save → verify.

### HTML for User Story 2

- [ ] T027 [P] [US2] Add description text input field to goal edit modal in coach-pwa-app (7).html (~line 591)
- [ ] T028 [P] [US2] Add target value number input field to goal edit modal in coach-pwa-app (7).html (~line 592)
- [ ] T029 [P] [US2] Add exercise type dropdown (Подтягивания, Отжимания, Отжимания на брусьях) to goal edit modal in coach-pwa-app (7).html (~line 594)

### CSS for User Story 2

- [ ] T030 [P] [US2] Add text input styles for description field in coach-pwa-app (7).html style section (~line 440)
- [ ] T031 [P] [US2] Add number input styles for target value field in coach-pwa-app (7).html (~line 447)
- [ ] T032 [P] [US2] Add dropdown styles for exercise type selector in coach-pwa-app (7).html (~line 452)

### JavaScript for User Story 2

- [ ] T033 [US2] Extend openGoalEditModal() to pre-fill description, target, exercise type fields in coach-pwa-app (7).html (~line 970)
- [ ] T034 [US2] Extend saveGoalDateEdit() to saveGoalEdit() (handle all fields) in coach-pwa-app (7).html (~line 1030)
- [ ] T035 [US2] Add description validation to saveGoalEdit() using validateDescription() in coach-pwa-app (7).html (~line 1035)
- [ ] T036 [US2] Add target value validation to saveGoalEdit() using validateTargetValue() in coach-pwa-app (7).html (~line 1040)
- [ ] T037 [US2] Update goal object with all changed fields atomically in saveGoalEdit() in coach-pwa-app (7).html (~line 1045)
- [ ] T038 [US2] Update renderGoals() to reflect all field changes (description, target, type) in coach-pwa-app (7).html (~line 905)

**Checkpoint**: User Story 2 complete - full goal editing functional, builds on US1 foundation

---

## Phase 5: User Story 3 - Динамическая синхронизация списка спортсменов (Dynamic Athlete Sync) (Priority: P3)

**Goal**: Athlete roster automatically syncs from Google Sheets (add/remove/reorder), historical data preserved

**Independent Test**: Add athlete in Sheets → sync → verify appears in app. Remove athlete → sync → verify disappears but data in archive. Change order → sync → verify matches.

### JavaScript for User Story 3

- [ ] T039 [P] [US3] Implement mergeAthleteRoster(localAthletes, sheetsAthletes) function in coach-pwa-app (7).html JavaScript section (~line 1160)
- [ ] T040 [P] [US3] Implement detectAthleteChanges() to identify added/removed/updated athletes in coach-pwa-app (7).html (~line 1180)
- [ ] T041 [US3] Update syncData() to call mergeAthleteRoster() and apply changes in coach-pwa-app (7).html (~line 1155)
- [ ] T042 [US3] Mark removed athletes as status='inactive' with deactivatedAt timestamp in mergeAthleteRoster() (~line 1170)
- [ ] T043 [US3] Update athlete order to match Google Sheets row order in mergeAthleteRoster() (~line 1175)
- [ ] T044 [US3] Preserve performance data when athlete name changes (ID-based linking) in mergeAthleteRoster() (~line 1172)
- [ ] T045 [US3] Implement showSyncNotification(athleteChanges) to display "Добавлено: X, Удалено: Y" in coach-pwa-app (7).html (~line 1200)
- [ ] T046 [US3] Add visual highlight to newly added athletes (5-second temporary class) in showSyncNotification() (~line 1210)
- [ ] T047 [US3] Update renderAthletes() to respect athlete.order for display sorting in coach-pwa-app (7).html (~line 850)
- [ ] T048 [US3] Filter inactive athletes from main list (show only status='active') in renderAthletes() (~line 855)

### HTML for User Story 3

- [ ] T049 [P] [US3] Add sync notification banner HTML to coach-pwa-app (7).html body section (~line 560)
- [ ] T050 [P] [US3] Add "Архив" (Archive) tab/filter option to navigation in coach-pwa-app (7).html (~line 615)

### CSS for User Story 3

- [ ] T051 [P] [US3] Add sync notification banner styles (yellow warning color, auto-dismiss) in coach-pwa-app (7).html style section (~line 460)
- [ ] T052 [P] [US3] Add newly-added athlete highlight styles (temporary animation) in coach-pwa-app (7).html (~line 470)
- [ ] T053 [P] [US3] Add archive tab styles in coach-pwa-app (7).html (~line 480)

**Checkpoint**: User Story 3 complete - dynamic athlete sync operational, all user stories now functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

- [ ] T054 [P] Add emoji logging to all new functions (✅ success, ❌ error, 🔄 sync) in coach-pwa-app (7).html JavaScript section
- [ ] T055 [P] Verify dark theme color palette compliance across all new styles in coach-pwa-app (7).html style section
- [ ] T056 [P] Verify Russian language text in all new UI elements in coach-pwa-app (7).html HTML section
- [ ] T057 Verify offline-first pattern maintained (localStorage immediate, pendingChanges queue) across all edit functions
- [ ] T058 [P] Verify touch target sizes (48px minimum) for all new buttons and inputs in coach-pwa-app (7).html
- [ ] T059 Run manual testing checklist from quickstart.md on real mobile device (Safari iOS or Chrome Android)
- [ ] T060 Verify constitution compliance: single file, zero dependencies, offline-first, mobile-only, dark theme, Russian language

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion - BLOCKS US2
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (extends edit modal)
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion - INDEPENDENT of US1/US2
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ MVP
- **User Story 2 (P2)**: Depends on User Story 1 (extends existing edit modal)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - INDEPENDENT of US1/US2 (can parallelize)

### Within Each User Story

**User Story 1**:
- HTML tasks (T011-T014) can run in parallel
- CSS tasks (T015-T018) marked [P] can run in parallel
- JavaScript tasks must be sequential: modal functions (T019-T020) → save logic (T021-T023) → render update (T024) → event listeners (T025-T026)

**User Story 2**:
- HTML tasks (T027-T029) marked [P] can run in parallel
- CSS tasks (T030-T032) marked [P] can run in parallel
- JavaScript tasks sequential: extend modal (T033) → extend save (T034-T037) → update render (T038)

**User Story 3**:
- JavaScript tasks T039-T040 marked [P] can run in parallel (different functions)
- HTML tasks (T049-T050) marked [P] can run in parallel
- CSS tasks (T051-T053) marked [P] can run in parallel
- Integration tasks (T041-T048) must be sequential after T039-T040 complete

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T002 and T003 can run in parallel (different migration functions)

**Foundational Phase (Phase 2)**:
- T005, T006, T007 can run in parallel (separate validation functions)

**User Story 1 (Phase 3)**:
```bash
# Launch HTML tasks together:
Task T011, T012, T013, T014

# Launch CSS tasks together (after HTML):
Task T015, T016, T017, T018

# JavaScript tasks sequential for US1
```

**User Story 2 (Phase 4)**:
```bash
# Launch HTML tasks together:
Task T027, T028, T029

# Launch CSS tasks together:
Task T030, T031, T032
```

**User Story 3 (Phase 5)**:
```bash
# Launch initial functions in parallel:
Task T039, T040

# Launch UI tasks in parallel:
Task T049, T050, T051, T052, T053
```

**Polish Phase (Phase 6)**:
- T054, T055, T056, T058 can run in parallel (independent style/text checks)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Edit Goal Dates)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Open app on mobile device
   - Create test goal
   - Tap goal card → edit modal opens
   - Change start date → save → verify localStorage
   - Change end date → save → verify localStorage
   - Test offline editing (airplane mode)
   - Reconnect → press sync → verify Google Sheets update
   - Reload page → verify dates persist
5. Deploy/demo if ready (MVP complete!)

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 = 26 tasks (T001-T026)

### Incremental Delivery

1. **Foundation**: Complete Setup + Foundational → Foundation ready (10 tasks)
2. **MVP**: Add User Story 1 → Test independently → Deploy (16 tasks, total 26)
3. **Enhancement**: Add User Story 2 → Test independently → Deploy (12 tasks, total 38)
4. **Advanced**: Add User Story 3 → Test independently → Deploy (15 tasks, total 53)
5. **Polish**: Complete Phase 6 → Final quality checks → Production release (7 tasks, total 60)

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers (if applicable):

1. Team completes Setup + Foundational together (10 tasks)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (16 tasks)
   - **Developer B**: User Story 3 (15 tasks, independent!)
3. After US1 complete:
   - **Developer A**: User Story 2 (12 tasks, extends US1)
4. Stories integrate independently, no merge conflicts (single file, different line ranges)

---

## Notes

### Single-File Architecture Considerations

- **Line numbers are approximate**: Will shift as code grows
- **Use section markers**: Comment blocks to identify insertion points
- **Test incrementally**: Each phase modifies same file, test after each task group
- **Git strategy**: Commit frequently (after each user story phase), easy rollback with `git checkout HEAD -- "coach-pwa-app (7).html"`

### Constitution Compliance Checkpoints

After each phase, verify:
- ✅ Single HTML file (no new .js, .css, .html files)
- ✅ No external dependencies (vanilla JS, native HTML5 inputs)
- ✅ Offline-first pattern (localStorage → pendingChanges → manual sync)
- ✅ Mobile-first design (48px touch targets, native date pickers)
- ✅ Dark theme colors (only official palette colors)
- ✅ Russian language UI (all user-facing text in Russian)

### Manual Testing Protocol

**Per quickstart.md** - After each user story phase:

1. Open coach-pwa-app (7).html in Chrome (desktop preview)
2. Open Chrome DevTools device mode (mobile preview)
3. Test on real device (Safari iOS or Chrome Android - PRIMARY validation)
4. Test offline mode (airplane mode, verify localStorage persistence)
5. Test sync after reconnect (verify pendingChanges upload)

**Test scenarios checklist in quickstart.md** - run after Phase 6 (Polish) complete.

### Rollback Strategy

If implementation breaks at any phase:

```bash
# View changes:
git diff main -- "coach-pwa-app (7).html"

# Rollback to main:
git checkout main -- "coach-pwa-app (7).html"

# Or rollback to last commit:
git checkout HEAD~1 -- "coach-pwa-app (7).html"

# Feature branch advantage: isolated changes
git checkout main  # switch back to main
git branch -D 001-goal-editing-athlete-sync  # delete broken branch
git checkout -b 001-goal-editing-athlete-sync  # start fresh
```

### Performance Considerations

- **Single file size**: 1350 lines → ~1600 lines (+18%, acceptable)
- **localStorage**: ~36KB → ~50KB (+39%, well under 5MB limit)
- **Edit operations**: <100ms save to localStorage (per performance goals)
- **Sync operations**: <5s upload (per performance goals)
- **Mobile rendering**: No performance impact expected (minimal new DOM elements)

### Google Apps Script Updates Required

**Out of scope for this task list** (backend work):

User Story 1 & 2 require Apps Script changes:
- Add `goal_edit` operation handler
- Update Goals sheet schema (add ID, Updated At columns)
- Implement field update logic (partial updates, not full row replace)

User Story 3 requires Apps Script changes:
- Add UUID generation for new athletes
- Return athlete IDs in sync response
- Add sync summary to response (athletesAdded, athletesRemoved counts)

**Recommendation**: Implement Apps Script changes in parallel with User Story tasks, test sync integration after each story phase.

---

## Task Summary

**Total Tasks**: 60

**By Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 6 tasks
- Phase 3 (User Story 1 - P1 MVP): 16 tasks
- Phase 4 (User Story 2 - P2): 12 tasks
- Phase 5 (User Story 3 - P3): 15 tasks
- Phase 6 (Polish): 7 tasks

**By User Story**:
- User Story 1 (Edit Goal Dates): 16 tasks (MVP)
- User Story 2 (Full Goal Editing): 12 tasks
- User Story 3 (Dynamic Athlete Sync): 15 tasks
- Infrastructure (Setup + Foundational): 10 tasks
- Polish: 7 tasks

**Parallel Opportunities**: 23 tasks marked [P] (can run concurrently with others in same phase)

**MVP Scope** (Phase 1 + Phase 2 + Phase 3): 26 tasks

**Independent Test Criteria**:
- ✅ US1: Create goal → edit dates → save → reload → verify persistence → sync
- ✅ US2: Edit description/target/type → save → verify display
- ✅ US3: Modify Sheets roster → sync → verify app matches

**Suggested MVP**: Phase 1-3 (26 tasks) delivers immediate value (edit goal dates), testable independently, deployable as standalone improvement.
