# Tasks: Schedule Management, Subscription Tracking, and Athletic Rank Recording

**Feature**: 005-schedule-rank-subscription
**Branch**: `005-schedule-rank-subscription`
**Input**: Design documents from `/specs/005-schedule-rank-subscription/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature uses manual testing only (no automated tests per constitution)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Project Structure Note

This is a single-file PWA architecture. All code exists in `coach-pwa-app (7).html`:
- Lines 1-10: Meta tags
- Lines 11-600: CSS styles
- Lines 601-700: HTML markup
- Lines 701-2500: JavaScript logic

File paths reference line ranges or sections within coach-pwa-app (7).html.

**Note**: Actual filename is `coach-pwa-app (7).html`. Tasks reference "index.html" as shorthand for clarity. Use actual filename when editing.

---

## Phase 1: Setup (Database Migration)

**Purpose**: Extend database schema to support schedule and rank fields

- [X] T001 Create migration file `supabase/migrations/20251111000002_add_schedule_rank_fields.sql`
- [X] T001a Verify Moyklass API credentials exist in environment or config
- [X] T001b Test Moyklass API connection with sample subscription query
- [N/A] T001c If Moyklass unavailable: create migration for `subscriptions` table with columns (athlete_id, start_date, end_date, status, season)
- [X] T001d Document chosen subscription data source in plan.md Dependencies section
- [X] T002 Add ALTER TABLE statements for schedule, rank_start, rank_end columns in migration
- [X] T002b Add rank_history JSONB column to migration with default '[]'::jsonb
- [X] T003 Add column comments for documentation in migration
- [X] T004 Deploy migration to Supabase with `supabase db push`
- [ ] T005 Verify columns added via Supabase dashboard → Database → athletes table

---

## Phase 2: Foundational (Shared Data & Styles)

**Purpose**: Core infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Add schedule badge styles (.schedule-badge, .self-reg) in coach-pwa-app (7).html CSS section (~lines 11-600)
- [X] T007 [P] Add rank display styles (.rank-selector, .rank-display, .rank-progression) in coach-pwa-app (7).html CSS section (~lines 11-600)
- [X] T008 [P] Add schedule form styles (.schedule-form, .schedule-type-btn, .schedule-entry) in coach-pwa-app (7).html CSS section (~lines 11-600)
- [X] T009 [P] Add subscription filter styles (.subscription-filter) in coach-pwa-app (7).html CSS section (~lines 11-600)
- [X] T010 Extend `transformSupabaseAthlete()` to include schedule, rank_start, rank_end fields in coach-pwa-app (7).html JS section (~lines 701-2500)
- [X] T011 Update `loadFromSupabase()` to fetch new columns (already automatic via SELECT *) in coach-pwa-app (7).html JS section (~lines 701-2500)
- [X] T012 Update localStorage persistence to save schedule and rank fields in coach-pwa-app (7).html JS section (~lines 701-2500)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Schedule Information Display (Priority: P1) 🎯 MVP

**Goal**: Display athlete's schedule information in their profile view immediately after viewing

**Independent Test**: View any athlete's profile and verify that saved schedule information is clearly visible (e.g., "Пн/Ср/Пт 18:00-19:00" or "Самозапись"). Test with: (1) athlete with fixed schedule, (2) athlete with self-registration, (3) athlete with no schedule.

### Implementation for User Story 1

- [X] T013 [US1] Create `formatScheduleDisplay(scheduleString)` function in coach-pwa-app (7).html JS section (~lines 701-2500)
- [X] T014 [US1] Update `renderAthleteProfile(athlete)` to include schedule display row in coach-pwa-app (7).html JS section (~lines 701-2500)

**Note**: T013 and T014 can be drafted in parallel, but T014 integration depends on T013 completion. Remove [P] marker to reflect sequential dependency.
- [X] T015 [US1] Add schedule display section to athlete profile card HTML in coach-pwa-app (7).html HTML section (~lines 601-700)
- [X] T016 [US1] Test schedule display with fixed schedule athlete ("Пн 18:00, Ср 19:00" format) [MANUAL TEST - ✅ PASSED]
- [X] T017 [US1] Test schedule display with self-registration athlete ("Самозапись" literal) [MANUAL TEST - ✅ PASSED]
- [X] T018 [US1] Test schedule display with no schedule set (should show "(Не указано)") [MANUAL TEST - ✅ PASSED]

**Checkpoint**: At this point, User Story 1 should be fully functional - coaches can see schedule in profiles

---

## Phase 4: User Story 3 - Schedule Editing with Flexible Input (Priority: P1)

**Goal**: Provide intuitive form to set athlete schedules with two options: fixed schedule (day + time) or self-registration

**Independent Test**: Open schedule edit form, select either regular schedule (day + time) or self-registration option, save, and verify the choice is reflected in athlete's profile. Test both fixed schedule with multiple entries and self-registration mode.

**Note**: Implementing US3 before US2 because both are critical P1 stories, and US3 directly depends on US1 (display) for validation.

### Implementation for User Story 3

- [X] T019 [US3] Create schedule edit modal HTML structure with type selector in coach-pwa-app (7).html HTML section (~lines 995-1042)
- [X] T020 [US3] Add day-of-week selector (Пн-Вс) and time input fields to modal in coach-pwa-app (7).html HTML section (~lines 995-1042)
- [X] T021 [US3] Add "Фиксированное расписание" and "Самозапись" toggle buttons to modal in coach-pwa-app (7).html HTML section (~lines 995-1042)
- [X] T022 [P] [US3] Create `openScheduleModal(athleteId)` function in coach-pwa-app (7).html JS section (line 2790)
- [X] T023 [P] [US3] Create `closeScheduleModal()` function in coach-pwa-app (7).html JS section (line 2815)
- [X] T024 [P] [US3] Create `selectScheduleType(type)` function to toggle fixed/self-reg modes in coach-pwa-app (7).html JS section (line 2823)
- [X] T025 [P] [US3] Create `renderScheduleEntries(entries)` function to display schedule slots in coach-pwa-app (7).html JS section (line 2843)
- [X] T026 [P] [US3] Create `addScheduleEntry()` function to add new time slot in coach-pwa-app (7).html JS section (line 2870)
- [X] T027 [P] [US3] Create `removeScheduleEntry(index)` function to delete time slot in coach-pwa-app (7).html JS section (line 2878)
- [X] T028 [P] [US3] Create `getScheduleEntries()` function to read form data in coach-pwa-app (7).html JS section (line 2886)
- [X] T029 [US3] Create `saveSchedule()` function to persist schedule to Supabase in coach-pwa-app (7).html JS section (line 2921)
- [X] T030 [US3] Add edit schedule button (✏️) next to schedule display in athlete profile in index.html (line 1801)
- [X] T031 [US3] Test fixed schedule creation with single entry (e.g., "Пн 18:00") [MANUAL TEST - ✅ PASSED]
- [X] T032 [US3] Test fixed schedule with multiple entries (e.g., "Пн 18:00, Ср 19:00, Пт 18:00") [MANUAL TEST - ✅ PASSED]
- [X] T033 [US3] Test self-registration mode saves as "Самозапись" literal [MANUAL TEST - ✅ PASSED]
- [X] T034 [US3] Test switching from fixed schedule to self-registration (previous entries cleared) [MANUAL TEST - ✅ PASSED]
- [X] T035 [US3] Test switching from self-registration back to fixed schedule [MANUAL TEST - ✅ PASSED]
- [X] T036 [US3] Verify schedule persists across browser refresh (localStorage + Supabase sync) [MANUAL TEST - ✅ PASSED]

**Checkpoint**: At this point, User Stories 1 AND 3 should both work - coaches can view AND edit schedules

---

## Phase 5: User Story 2 - Subscription History Filtering (Priority: P2)

**Goal**: Filter athlete list to show all who had active subscription during current season, even if expired

**Independent Test**: Toggle "Абонементы за сезон" filter chip and verify that athletes with expired subscriptions from current season appear alongside currently active subscribers. Test with athletes who: (1) have active subscription, (2) had subscription earlier this season but expired, (3) never had subscription this season.

### Implementation for User Story 2

- [ ] T037 [US2] Add subscription filter chip button to header filter section in coach-pwa-app (7).html HTML section (~lines 601-700)
- [ ] T038 [P] [US2] Create `toggleSubscriptionFilter()` function in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T039 [P] [US2] Create `filterBySubscriptionHistory(athletes)` function in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T040 [P] [US2] Create `getSubscriptionCache()` function to read cached Moyklass data in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T041 [P] [US2] Create `setSubscriptionCache(data)` function to cache Moyklass data in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T042 [P] [US2] Create `isCacheStale(cacheObj)` function to check 24h staleness in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T043 [US2] Create `fetchSubscriptionHistory(seasonStart, seasonEnd)` function to call VERIFIED subscription source (Moyklass API OR Supabase subscriptions table per T001d decision) in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T044 [US2] Add season date calculation logic (Sept 1 - Aug 31) in `filterBySubscriptionHistory()` in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T045 [US2] Integrate subscription filter into existing `filterAthletes()` function in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T046 [US2] Add visual indicator for subscription filter active state (chip highlight)
- [ ] T047 [US2] Test subscription filter includes athlete with active subscription
- [ ] T048 [US2] Test subscription filter includes athlete with expired subscription from current season
- [ ] T049 [US2] Test subscription filter excludes athlete with no subscription this season
- [ ] T050 [US2] Test subscription filter excludes athlete with subscription from previous season only
- [ ] T051 [US2] Test offline mode uses cached subscription data (stale data acceptable)
- [ ] T052 [US2] Test online mode refreshes subscription data if cache >24 hours old
- [ ] T053 [US2] Verify athlete count reflects filtered list correctly

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Season Start Athletic Rank Recording (Priority: P3)

**Goal**: Record which athletic rank each athlete is targeting at beginning of season for goal tracking

**Independent Test**: Edit an athlete's profile, select a rank from predefined options (e.g., "Юношеский разряд", "3 взрослый разряд"), save, and verify the rank appears in athlete's profile. Test with all 9 rank options plus "Без разряда" and empty selection.

### Implementation for User Story 4

- [ ] T054 [US4] Add rank_start dropdown selector to athlete edit modal HTML in coach-pwa-app (7).html HTML section (~lines 601-700)
- [ ] T055 [US4] Populate rank_start dropdown with all 9 ranks plus "Без разряда" and empty option in coach-pwa-app (7).html HTML section (~lines 601-700)
- [ ] T056 [P] [US4] Create `formatRankDisplay(rankStart, rankEnd)` function in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T057 [P] [US4] Create `getRankIcon(rank)` function to return appropriate emoji in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T058 [US4] Update athlete profile display to show rank_start in coach-pwa-app (7).html
- [ ] T059 [US4] Update `saveAthleteWithRanks(athleteId)` to persist rank_start to Supabase in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T060 [US4] Integrate rank_start saving into existing athlete edit form save flow in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T061 [US4] Test saving rank_start with "III юношеский разряд" selection
- [ ] T062 [US4] Test saving rank_start with "КМС" selection
- [ ] T063 [US4] Test saving rank_start with "Без разряда" selection
- [ ] T064 [US4] Test saving rank_start with empty selection (NULL)
- [ ] T065 [US4] Verify rank_start displays correctly in athlete profile with appropriate icon

**Checkpoint**: At this point, User Story 4 should work - coaches can record season start ranks

---

## Phase 7: User Story 5 - Season End Athletic Rank Recording (Priority: P3)

**Goal**: Record which athletic rank each athlete achieved by end of season for outcome tracking and certification

**Independent Test**: Edit an athlete's profile at any time, select an end-of-season rank, save, and verify it appears in profile. Test with: (1) progression (end rank > start rank), (2) maintenance (end rank = start rank), (3) only end rank set (no start rank), (4) both start and end ranks set showing progression arrow.

### Implementation for User Story 5

- [ ] T066 [US5] Add rank_end dropdown selector to athlete edit modal HTML (below rank_start) in coach-pwa-app (7).html HTML section (~lines 601-700)
- [ ] T067 [US5] Populate rank_end dropdown with same 9 ranks plus "Без разряда" and empty option in coach-pwa-app (7).html HTML section (~lines 601-700)
- [ ] T068 [US5] Update `formatRankDisplay()` to show progression arrow when both ranks set in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T069 [US5] Update athlete profile display to show rank progression (start → end) in coach-pwa-app (7).html
- [ ] T070 [US5] Update `saveAthleteWithRanks(athleteId)` to persist rank_end to Supabase in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T071 [US5] Test saving rank_end with progression ("I юношеский" → "III взрослый")
- [ ] T072 [US5] Test saving rank_end equal to rank_start (maintenance, no progression)
- [ ] T073 [US5] Test saving rank_end with no rank_start set (displays only end rank)
- [ ] T074 [US5] Verify rank progression displays with arrow (e.g., "I юношеский ➡️ III взрослый")
- [ ] T075 [US5] Verify single rank displays without arrow when only start or end set
- [ ] T076 [US5] Verify both rank fields allow empty selection (NULL)

**Checkpoint**: All user stories should now be independently functional - full feature complete

---

## Phase 7.5: Historical Rank Data Management

**Goal**: Enable viewing and storage of multi-season rank progression history

**Independent Test**: Set rank_start and rank_end for athlete, advance system date to next season (Sept 1), set new ranks, verify previous season data preserved in rank_history JSONB field.

### Implementation for Historical Ranks

- [ ] T076a [P] [HIST] Create `appendToRankHistory(athleteId, season, rankStart, rankEnd)` function in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T076b [P] [HIST] Create `getRankHistory(athleteId)` function to query rank_history JSONB in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T076c [P] [HIST] Create `getCurrentSeason()` function returning "YYYY-YYYY" format (e.g., "2024-2025") in coach-pwa-app (7).html JS section (~lines 701-2500)
- [ ] T076d [HIST] Add season detection logic: on Sept 1, trigger rank history append for all athletes with rank_start/rank_end set
- [ ] T076e [HIST] Create historical rank view modal showing progression table (Season | Start | End | Change)
- [ ] T076f [HIST] Add "История разрядов" button in athlete profile to open historical view
- [ ] T076g [HIST] Test historical data appends correctly when season changes
- [ ] T076h [HIST] Test historical view displays multiple seasons in chronological order
- [ ] T076i [HIST] Verify rank_history JSONB persists across offline/online sync

**Checkpoint**: Historical rank tracking should now work - coaches can view past season rank progressions

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, validation, and documentation updates

- [ ] T077 [P] Add console logging with emoji for all schedule operations in coach-pwa-app (7).html JS section
- [ ] T078 [P] Add console logging with emoji for all rank operations in coach-pwa-app (7).html JS section
- [ ] T079 [P] Add error handling for Supabase save failures in schedule functions
- [ ] T080 [P] Add error handling for Supabase save failures in rank functions
- [ ] T081 [P] Add error handling for Moyklass API failures in subscription filter
- [ ] T082 Validate schedule format with regex before saving (format: "Пн ЧЧ:ММ, Ср ЧЧ:ММ")
- [ ] T083 Validate rank values against allowed list before saving
- [ ] T084 Test offline mode: verify schedule/rank changes persist to localStorage
- [ ] T085 Test online mode: verify schedule/rank changes sync to Supabase
- [ ] T086 Test mobile Safari iOS: all touch interactions work (44x44px targets)
- [ ] T087 Test mobile Chrome Android: all touch interactions work
- [ ] T088 Run full quickstart.md validation checklist
- [ ] T089 Update CLAUDE.md with new feature summary and line number references
- [ ] T090 Run `.specify/scripts/bash/update-agent-context.sh claude` to update tech stack
- [ ] T091 Code cleanup: ensure BEM naming for all new CSS classes
- [ ] T092 Code cleanup: ensure Russian language for all UI text (no English)
- [ ] T093 Code cleanup: ensure dark theme colors used throughout (#4c9eff, #1a1d29, etc.)
- [ ] T094 Performance test: verify <2s page load, <100ms touch response, <5s sync
- [ ] T095 Final verification: all acceptance scenarios from spec.md pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately with database migration
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - Schedule display (MVP foundation)
- **User Story 3 (Phase 4)**: Depends on US1 - Schedule editing (extends display)
- **User Story 2 (Phase 5)**: Depends on Foundational - Subscription filter (independent of schedule)
- **User Story 4 (Phase 6)**: Depends on Foundational - Rank start (independent feature)
- **User Story 5 (Phase 7)**: Depends on US4 - Rank end (extends rank start display)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: FOUNDATION - Must complete first, all schedule features depend on display
- **User Story 3 (P1)**: Depends on US1 (extends display with editing) - Critical path
- **User Story 2 (P2)**: Independent of schedule stories, depends only on Foundational
- **User Story 4 (P3)**: Independent of schedule/subscription, depends only on Foundational
- **User Story 5 (P3)**: Depends on US4 (extends rank display with progression)

### Critical Path (MVP)

For minimal viable product, implement in this order:
1. Phase 1: Setup (database)
2. Phase 2: Foundational (styles + data)
3. Phase 3: User Story 1 (schedule display)
4. Phase 4: User Story 3 (schedule editing)
5. **STOP and VALIDATE** - This is a functional MVP for schedule management

### Parallel Opportunities

Due to single-file architecture, parallelization is limited:
- **Phase 2 (Foundational)**: T006-T009 (CSS styles) can run in parallel (different CSS sections)
- **Phase 3 (US1)**: T013 (formatScheduleDisplay function) can run parallel with T015 (HTML markup)
- **Phase 4 (US3)**: T022-T028 (all JS functions) can be drafted in parallel, then integrated
- **Phase 5 (US2)**: T038-T042 (subscription filter functions) can be drafted in parallel
- **Phase 6 (US4)**: T056-T057 (rank display functions) can run in parallel
- **Phase 8 (Polish)**: T077-T081 (logging/error handling) can run in parallel with T082-T083 (validation)

### Parallel Example: Foundational Styles

```bash
# Launch all style additions together (different CSS sections):
Task: "Add schedule badge styles (.schedule-badge, .self-reg)"
Task: "Add rank display styles (.rank-selector, .rank-display)"
Task: "Add schedule form styles (.schedule-form, .schedule-type-btn)"
Task: "Add subscription filter styles (.subscription-filter)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3 Only)

1. Complete Phase 1: Setup (database migration)
2. Complete Phase 2: Foundational (styles + data extensions)
3. Complete Phase 3: User Story 1 (schedule display)
4. Complete Phase 4: User Story 3 (schedule editing)
5. **STOP and VALIDATE**: Test schedule display + editing independently on mobile
6. Deploy/demo if ready (coaches can now view and edit athlete schedules)

**Value delivered**: Core schedule management workflow complete

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **Deploy (Display only)**
3. Add User Story 3 → Test independently → **Deploy (Display + Editing MVP!)**
4. Add User Story 2 → Test independently → **Deploy (+ Subscription filtering)**
5. Add User Story 4 → Test independently → **Deploy (+ Season start ranks)**
6. Add User Story 5 → Test independently → **Deploy (+ Season end ranks + progression)**
7. Each story adds value without breaking previous stories

### Single Developer Strategy

Due to single-file architecture, one developer works sequentially:

1. Week 1: Setup + Foundational + US1 (schedule display)
2. Week 2: US3 (schedule editing) → Deploy MVP
3. Week 3: US2 (subscription filter) → Deploy incremental update
4. Week 4: US4 + US5 (rank tracking) → Deploy final feature complete
5. Week 5: Polish + testing → Final validation

### Risk Mitigation

**Risk**: Single-file architecture creates merge conflicts if parallel work attempted

**Mitigation**:
- Work strictly sequentially within the file
- Commit after each task or logical group
- Use feature branch with frequent commits
- Test after each user story phase completion

---

## Notes

- **Single-file PWA**: All code in `coach-pwa-app (7).html`, no separate source files
- **[P] tasks**: Limited parallelization due to single-file architecture (mainly CSS/HTML vs JS)
- **[Story] label**: Maps task to specific user story for traceability
- **No automated tests**: Manual testing only per project constitution
- **Mobile-first**: All testing must be done on Safari iOS and Chrome Android
- **Offline-first**: Verify localStorage persistence for all data operations
- **Dark theme**: Use fixed color palette from constitution (#4c9eff, #1a1d29, etc.)
- **Russian language**: All UI text must be in Russian (no English)
- **Constitution compliance**: Verify no npm dependencies, no file splitting, no desktop optimization

## Success Criteria Summary

By completion of all phases:

✅ **SC-001**: Coaches can view athlete schedules in <2 seconds from opening profile
✅ **SC-002**: Schedule editing form supports both fixed schedule and self-registration with clear visual distinction
✅ **SC-003**: Athlete list filtering includes all athletes with subscription history during current season within 3 seconds
✅ **SC-004**: 100% of schedule data persists across browser sessions and device switches
✅ **SC-005**: Coaches can record both season start and end ranks with ranks visible in profile
✅ **SC-006**: Historical rank data from previous seasons remains accessible

---

## Total Task Count

- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 7 tasks
- **Phase 3 (US1)**: 6 tasks
- **Phase 4 (US3)**: 18 tasks
- **Phase 5 (US2)**: 17 tasks
- **Phase 6 (US4)**: 12 tasks
- **Phase 7 (US5)**: 11 tasks
- **Phase 8 (Polish)**: 19 tasks

**Total: 95 tasks**

**Estimated Implementation Time**:
- MVP (Phases 1-4): ~2-3 weeks (schedule management core)
- Full Feature (All phases): ~4-5 weeks (all user stories + polish)

**Parallelization Benefit**: Limited due to single-file architecture, but style/HTML/JS drafting can overlap (~10-15% time savings)

**MVP Scope**: Phases 1-4 (User Stories 1 + 3) deliver functional schedule management - recommended first delivery milestone
