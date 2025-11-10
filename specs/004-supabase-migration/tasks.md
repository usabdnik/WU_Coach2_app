# Tasks: Supabase Migration with Autonomous Development Workflow

**Input**: Design documents from `/specs/004-supabase-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No automated tests requested in specification - manual testing on Safari iOS + Chrome Android

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md:
- **Single-file PWA**: `coach-pwa-app.html` (repository root)
- **Supabase files**: `.specify/supabase/` (schema, functions, policies)
- **Migration scripts**: `migration/` (one-time executables)
- **MCP context**: `.specify/memory/SUPABASE_CONTEXT.md`
- **Slash commands**: `.claude/commands/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Supabase project initialization and schema deployment

- [ ] T001 Create Supabase project via https://supabase.com/dashboard (manual - save credentials)
- [ ] T002 [P] Create directory structure: .specify/supabase/, .specify/memory/, migration/, .claude/commands/
- [ ] T003 [P] Create .specify/memory/SUPABASE_CONTEXT.md with project URL and API keys from Supabase dashboard
- [ ] T004 Create .specify/supabase/schema.sql from specs/004-supabase-migration/data-model.md (4 tables: athletes, exercises, goals, performances)
- [ ] T005 [P] Create .specify/supabase/rls_policies.sql from specs/004-supabase-migration/contracts/rls-policies.md
- [ ] T006 [P] Create .specify/supabase/functions.sql from specs/004-supabase-migration/contracts/rpc-functions.md (5 functions)
- [ ] T007 Deploy .specify/supabase/schema.sql to Supabase via SQL Editor in dashboard
- [ ] T008 Deploy .specify/supabase/rls_policies.sql to Supabase via SQL Editor
- [ ] T009 Deploy .specify/supabase/functions.sql to Supabase via SQL Editor
- [ ] T010 Verify schema deployment: check tables exist in Supabase dashboard → Database → Tables
- [ ] T011 [P] Verify RLS policies: check policies exist in Supabase dashboard → Authentication → Policies
- [ ] T012 [P] Verify functions exist: SELECT * FROM pg_proc WHERE proname IN ('get_current_season', 'sync_offline_changes', 'calculate_season_stats', 'save_athlete_with_validation', 'get_athlete_performances')

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T013 Create migration/01-setup-schema.sql (copy from .specify/supabase/schema.sql for version control)
- [ ] T014 [P] Create migration/02-setup-rls.sql (copy from .specify/supabase/rls_policies.sql)
- [ ] T015 [P] Create migration/03-setup-functions.sql (copy from .specify/supabase/functions.sql)
- [ ] T016 [P] Create migration/rollback.sql with DELETE statements for emergency rollback (BEGIN; DELETE FROM performances; DELETE FROM goals; DELETE FROM exercises; DELETE FROM athletes; -- COMMIT or ROLLBACK manually)
- [ ] T017 Create .specify/supabase/seed.sql with test data for development (2-3 athletes, 3-5 exercises, 5-10 goals)
- [ ] T018 Deploy seed data to Supabase for testing: run .specify/supabase/seed.sql in SQL Editor
- [ ] T019 Verify seed data: SELECT COUNT(*) FROM athletes, exercises, goals in Supabase SQL Editor

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Database Migration from Google Sheets to Supabase (Priority: P1) 🎯 MVP

**Goal**: Migrate all existing athlete data, exercises, and goals from Google Sheets to Supabase database without data loss or service interruption

**Independent Test**: Export data from Google Sheets, import to Supabase, verify data integrity through checksum/record count validation

### Implementation for User Story 1

- [ ] T020 [US1] Export Google Sheets athletes data to CSV: File → Download → Comma-separated values → save as data/athletes.csv
- [ ] T021 [P] [US1] Export Google Sheets exercises data to CSV → save as data/exercises.csv
- [ ] T022 [P] [US1] Export Google Sheets goals data to CSV → save as data/goals.csv
- [ ] T023 [P] [US1] Export Google Sheets performances data to CSV (if exists) → save as data/performances.csv
- [ ] T024 [US1] Create migration/export-from-sheets.js to convert CSV to JSON with UUID generation (athletes, exercises, goals, performances)
- [ ] T025 [US1] Run migration/export-from-sheets.js: node migration/export-from-sheets.js → generates data/athletes.json, data/exercises.json, data/goals.json
- [ ] T026 [US1] Create migration/import-to-supabase.js using Supabase service role key to batch insert JSON data
- [ ] T027 [US1] Run migration/import-to-supabase.js: node migration/import-to-supabase.js → imports all data to Supabase
- [ ] T028 [US1] Create migration/verify-integrity.js to compare record counts and generate checksums (athletes.name sorted → hash)
- [ ] T029 [US1] Run migration/verify-integrity.js: node migration/verify-integrity.js → verify 100% data integrity (FR-020)
- [ ] T030 [US1] Test rollback mechanism: backup current Supabase data → run migration/rollback.sql → verify empty tables → restore from backup
- [ ] T031 [US1] Keep Google Sheets read-only for 30 days as backup (manual - update sheet permissions)
- [ ] T032 [US1] Update coach-pwa-app.html: add Supabase CDN script tag before </head>: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> (FR-016)
- [ ] T033 [US1] Update coach-pwa-app.html: initialize Supabase client in <script> section with SUPABASE_URL and SUPABASE_ANON_KEY from .specify/memory/SUPABASE_CONTEXT.md
- [ ] T034 [US1] Update coach-pwa-app.html: create loadDataFromSupabase() function to fetch goals and athletes via supabase.from().select()
- [ ] T035 [US1] Update coach-pwa-app.html: create syncToSupabase() function using supabase.rpc('sync_offline_changes', { changes: pendingChanges }) (FR-019)
- [ ] T036 [US1] Update coach-pwa-app.html: replace Google Apps Script sync calls with Supabase sync in existing sync functions
- [ ] T037 [US1] Update coach-pwa-app.html: add error handling for Supabase connection failures with specific error types: (1) NetworkError → retry with exponential backoff (3 attempts), then fallback to localStorage-only mode, (2) AuthError → clear credentials + prompt re-authentication, (3) RLSError → log policy violation + show user-friendly message, (4) 500 Internal Server Error → log for debugging + fallback to localStorage (Edge case: offline mode)
- [ ] T038 [US1] Test PWA offline-first flow: open coach-pwa-app.html in Chrome DevTools device mode → enable airplane mode → add goal → verify saves to localStorage → disable airplane mode → click sync → verify uploads to Supabase (FR-006)
- [ ] T039 [US1] Test PWA on Safari iOS: deploy coach-pwa-app.html to test server → open in Safari → test offline mode → test sync
- [ ] T040 [P] [US1] Test PWA on Chrome Android: open deployed app → test offline mode → test sync
- [ ] T041 [US1] Verify all 20 functional requirements met: check FR-001 to FR-020 against implementation
- [ ] T042 [US1] Verify success criteria SC-001: 100% data migration with zero data loss (checksum match)
- [ ] T043 [P] [US1] Verify success criteria SC-004: PWA offline functionality works (airplane mode test passed)
- [ ] T044 [P] [US1] Verify success criteria SC-005: Migration completed in <30min (measure actual time)
- [ ] T045 [P] [US1] Verify success criteria SC-008: All queries complete in <2s (measure query performance in browser DevTools Network tab)
- [ ] T046 [P] [US1] Verify success criteria SC-009: Rollback mechanism works (tested in T030)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - PWA connects to Supabase, data migrated, offline-first works

---

## Phase 4: User Story 2 - Autonomous Development Workflow with MCP Integration (Priority: P2)

**Goal**: Establish autonomous development workflow using MCP servers (Serena, Context7, Sequential, Morphllm) to minimize token usage by 40-60%

**Independent Test**: Execute common development tasks (schema changes, query updates, data operations) and measure token usage before/after MCP integration

### Implementation for User Story 2

- [ ] T047 [US2] Update .specify/memory/SUPABASE_CONTEXT.md with MCP usage patterns: document when to use Serena (schema reads), Context7 (docs), Sequential (analysis), Morphllm (bulk edits)
- [ ] T048 [P] [US2] Create .claude/commands/db-query.md slash command: template for generating Supabase queries using Serena MCP (schema.sql) + Context7 (Supabase JS patterns)
- [ ] T049 [P] [US2] Create .claude/commands/db-migrate.md slash command: template for generating migration SQL from schema diff
- [ ] T050 [US2] Test Serena MCP workflow: ask Claude to "Show goals table structure" → verify Serena reads .specify/supabase/schema.sql once without repeating
- [ ] T051 [P] [US2] Test Context7 MCP workflow: ask Claude "How to use Supabase realtime subscriptions?" → verify Context7 fetches official Supabase docs
- [ ] T052 [P] [US2] Test Sequential MCP workflow: ask Claude "Optimize query for athlete performances" → verify Sequential provides hypothesis testing + recommendations
- [ ] T053 [P] [US2] Test Morphllm MCP workflow: ask Claude "Update all supabase.from('goals').select('*') to select specific fields" → verify Morphllm applies bulk edits
- [ ] T054 [US2] Test /db-query slash command: run /db-query goals select "status=completed" → verify generates correct JavaScript code
- [ ] T055 [P] [US2] Test /db-migrate slash command: run /db-migrate "add column notes text to goals" → verify generates migration SQL with rollback
- [ ] T056 [US2] Measure baseline token usage WITHOUT MCP → record token count for 5 tasks: (1) "Show goals table structure" (schema query), (2) "How to use Supabase realtime subscriptions?" (doc lookup), (3) "Update all select('*') to select specific fields" (bulk edit), (4) "Optimize athlete performances query" (query optimization), (5) "Add column notes to goals" (migration SQL generation)
- [ ] T057 [US2] Measure MCP token usage WITH MCP servers → perform same 5 tasks from T056 → record token count → calculate % reduction (target: 40-60%)
- [ ] T058 [US2] Verify success criteria SC-002: Token usage reduces by 40-60% (compare T056 vs T057)
- [ ] T059 [P] [US2] Verify success criteria SC-006: Schema changes via /db-migrate complete in <5min
- [ ] T060 [P] [US2] Verify success criteria SC-007: 90% of development tasks complete using MCP servers without manual doc lookup

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - MCP workflow established, token savings verified

---

## Phase 5: User Story 3 - Eliminate Code Duplication in Database Operations (Priority: P3)

**Goal**: Consolidate duplicate code from Google Apps Script files (import.gs + webapp.gs) into single-source Supabase Postgres functions

**Independent Test**: Review codebase for duplicate function definitions and verify all database operations use single shared Postgres function implementation

### Implementation for User Story 3

- [ ] T061 [US3] Identify duplicate functions in Google Apps Script: review import.gs and webapp.gs → list all duplicate function names
- [ ] T062 [US3] Verify Postgres functions consolidate duplicates: check that get_current_season(), calculate_season_stats(), sync_offline_changes(), save_athlete_with_validation(), get_athlete_performances() cover all duplicate logic
- [ ] T063 [US3] Update PWA to use Postgres functions: replace client-side season calculation with supabase.rpc('get_current_season') in coach-pwa-app.html
- [ ] T064 [P] [US3] Update PWA to use Postgres functions: replace client-side stats calculation with supabase.rpc('calculate_season_stats', { athlete_id }) in coach-pwa-app.html
- [ ] T065 [US3] Create CRM import script using Postgres functions: create migration/import-from-crm.js that calls supabase.rpc('save_athlete_with_validation', { athlete_data })
- [ ] T066 [US3] Test PWA uses Postgres functions: verify all database operations in coach-pwa-app.html call supabase.rpc() instead of duplicating logic
- [ ] T067 [P] [US3] Test CRM import uses Postgres functions: run migration/import-from-crm.js → verify calls save_athlete_with_validation() successfully
- [ ] T068 [US3] Test shared logic update: modify get_current_season() in .specify/supabase/functions.sql → deploy to Supabase → verify both PWA and CRM use new logic without code changes
- [ ] T069 [US3] Search codebase for duplicate function names: grep -r "function.*name" coach-pwa-app.html migration/*.js → verify zero duplicates (FR-013)
- [ ] T070 [US3] Verify success criteria SC-003: Zero duplicate function definitions exist (grep search returns 0 matches)
- [ ] T071 [US3] Update constitution.md to document Supabase Postgres functions as shared logic pattern
- [ ] T072 [P] [US3] Update ULTRATHINK_MODE.md to document MCP usage patterns for Supabase development

**Checkpoint**: All user stories should now be independently functional - code duplication eliminated, all logic consolidated in Postgres functions

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T073 [P] Generate TypeScript types from Supabase schema: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > .specify/supabase/types.ts (FR-015)
- [ ] T074 [P] Create .specify/supabase/seed.sql with comprehensive test data for development (10 athletes, 10 exercises, 30 goals, 50 performances)
- [ ] T075 [P] Document migration process in specs/004-supabase-migration/quickstart.md verification section
- [ ] T076 Code cleanup: remove commented-out Google Apps Script sync code from coach-pwa-app.html
- [ ] T077 Code cleanup: remove unused Google Sheets API references from coach-pwa-app.html
- [ ] T078 Performance optimization: add indexes verification in Supabase dashboard → Database → Indexes (verify idx_goals_athlete_id, idx_goals_status, idx_performances_athlete_id exist)
- [ ] T079 Security review: verify Supabase anon key (not service role key) is used in coach-pwa-app.html (service role key only in migration scripts)
- [ ] T080 Security review: verify RLS policies enabled on all tables in Supabase dashboard → Authentication → Policies
- [ ] T081 Final constitution compliance check: verify single-file PWA (coach-pwa-app.html unchanged except Supabase integration), zero npm dependencies, offline-first preserved, mobile-only, dark theme, Russian language
- [ ] T082 Final mobile testing: deploy coach-pwa-app.html to production → test on Safari iOS + Chrome Android → verify all CRUD operations work
- [ ] T083 Performance benchmarking: measure actual query speeds in browser DevTools → verify <2s for all queries
- [ ] T084 Run quickstart.md validation: follow specs/004-supabase-migration/quickstart.md setup steps → verify all commands work
- [ ] T085 Update CLAUDE.md Recent Changes section with Supabase migration completion date
- [ ] T086 [P] Document concurrent edits strategy: add section to .specify/memory/SUPABASE_CONTEXT.md with optimistic locking implementation (updated_at timestamps, conflict detection, last-write-wins pattern) based on spec.md edge case #4 solution
- [ ] T087 [P] Document schema migration strategy: add section to .specify/memory/SUPABASE_CONTEXT.md with backward-compatible migration patterns (zero-downtime migrations, additive-only changes, rollback scripts) based on spec.md edge case #5 solution

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T012) - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion (T013-T019)
  - User Story 1 (P1): Can start after Foundational → Must complete before US2/US3 (PWA must work first)
  - User Story 2 (P2): Depends on US1 completion (need working Supabase integration to test MCP workflow)
  - User Story 3 (P3): Depends on US1 completion (need Postgres functions deployed to consolidate code)
- **Polish (Phase 6)**: Depends on all desired user stories being complete (T020-T072)

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - BLOCKS US2 and US3
- **User Story 2 (P2)**: Can start after US1 complete (T020-T046) - Needs working Supabase integration
- **User Story 3 (P3)**: Can start after US1 complete (T020-T046) - Needs Postgres functions deployed

### Within Each User Story

**User Story 1 (Migration)**:
- CSV exports (T020-T023) can run in parallel [P]
- CSV → JSON conversion (T024-T025) must complete before import (T026-T027)
- Import (T026-T027) must complete before verification (T028-T029)
- PWA Supabase integration (T032-T037) must complete before testing (T038-T046)
- Mobile testing (T038-T040) can run in parallel [P] after PWA integration

**User Story 2 (MCP Workflow)**:
- Slash command creation (T048-T049) can run in parallel [P]
- MCP testing (T050-T053) can run in parallel [P]
- Slash command testing (T054-T055) can run in parallel [P]
- Token measurement (T056-T057) must run sequentially (baseline → MCP)

**User Story 3 (Code Consolidation)**:
- PWA updates (T063-T064) can run in parallel [P]
- CRM creation (T065) independent of PWA updates
- Testing (T066-T067) can run in parallel [P] after implementation

### Parallel Opportunities

- **Setup Phase**: T002, T003 can run in parallel with T004 (directory creation independent of schema creation)
- **Setup Phase**: T005, T006 can run in parallel (RLS and functions independent files)
- **Setup Phase**: T011, T012 can run in parallel (verification tasks independent)
- **Foundational**: T014, T015, T016 can run in parallel (copy operations independent)
- **User Story 1**: T020-T023 (CSV exports) can run in parallel
- **User Story 1**: T038-T040 (mobile testing) can run in parallel (different devices)
- **User Story 1**: T042-T046 (success criteria verification) can run in parallel
- **User Story 2**: T048-T049 (slash commands) can run in parallel
- **User Story 2**: T050-T053 (MCP testing) can run in parallel
- **User Story 2**: T054-T055 (slash command testing) can run in parallel
- **User Story 2**: T059-T060 (success criteria) can run in parallel
- **User Story 3**: T064 can run in parallel with T063
- **User Story 3**: T066-T067 (testing) can run in parallel
- **User Story 3**: T072 can run in parallel with T071
- **Polish**: T073-T075 can run in parallel
- **Polish**: T078-T080 can run in parallel (verification tasks)

---

## Parallel Example: User Story 1 (Migration)

```bash
# Launch all CSV exports together:
Task T020: "Export athletes CSV"
Task T021: "Export exercises CSV"
Task T022: "Export goals CSV"
Task T023: "Export performances CSV"

# After PWA integration complete, launch mobile testing in parallel:
Task T038: "Test on Safari iOS"
Task T039: "Test on Chrome Android"
Task T040: "Test offline mode"

# Launch success criteria verification in parallel:
Task T042: "Verify SC-001 (data integrity)"
Task T043: "Verify SC-004 (offline functionality)"
Task T044: "Verify SC-005 (migration time)"
Task T045: "Verify SC-008 (query performance)"
Task T046: "Verify SC-009 (rollback mechanism)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T012) → Supabase project ready
2. Complete Phase 2: Foundational (T013-T019) → Schema deployed, seed data loaded
3. Complete Phase 3: User Story 1 (T020-T046) → Data migrated, PWA connected
4. **STOP and VALIDATE**: Test User Story 1 independently on mobile devices
5. Deploy/demo if ready → Coach can use PWA with Supabase backend

### Incremental Delivery

1. Complete Setup + Foundational (T001-T019) → Foundation ready
2. Add User Story 1 (T020-T046) → Test independently → Deploy/Demo (MVP!)
   - Delivers: Working PWA with Supabase, all data migrated, offline-first preserved
3. Add User Story 2 (T047-T060) → Test independently → Deploy/Demo
   - Delivers: Autonomous development workflow, 40-60% token savings
4. Add User Story 3 (T061-T072) → Test independently → Deploy/Demo
   - Delivers: Zero code duplication, maintainable codebase
5. Each story adds value without breaking previous stories

### Sequential Execution (Single Developer)

Recommended order for solo developer:

1. **Week 1**: Setup + Foundational (T001-T019) → ~2-3 hours
2. **Week 1-2**: User Story 1 Migration (T020-T046) → ~8-10 hours
3. **Week 2**: User Story 2 MCP Workflow (T047-T060) → ~4-5 hours
4. **Week 3**: User Story 3 Code Consolidation (T061-T072) → ~3-4 hours
5. **Week 3**: Polish (T073-T085) → ~2-3 hours

**Total Estimated Time**: 19-27 hours

### Parallel Team Strategy

With 2-3 developers (after Foundational phase complete):

1. **Developer A**: User Story 1 (T020-T046) → Migration + PWA integration
2. **Developer B**: User Story 2 (T047-T060) → MCP workflow setup (starts after US1 T032 complete)
3. **Developer C**: User Story 3 (T061-T072) → Code consolidation (starts after US1 T032 complete)

Timeline: ~1-2 weeks for all stories in parallel

---

## Notes

- [P] tasks = different files, no dependencies, safe to parallelize
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No automated tests (per spec) - manual testing on mobile browsers required
- Migration is one-time operation (T020-T031) - keep Google Sheets backup 30 days
- MCP workflow (US2) is development workflow optimization, not runtime dependency
- Code consolidation (US3) improves maintainability but doesn't change functionality
- Commit after each logical group of tasks (e.g., after schema deployment, after PWA integration)
- Stop at any checkpoint to validate story independently before proceeding
- Total tasks: 87 tasks across 6 phases
- Estimated completion time: 19-27 hours (solo developer)
- MVP delivery: User Story 1 only (~10-13 hours) delivers working Supabase migration

---

## Success Criteria Mapping

| Success Criterion | Related Tasks | Verification Method |
|-------------------|---------------|---------------------|
| SC-001: 100% data migration with zero loss | T020-T029, T042 | Checksum verification in T029 |
| SC-002: 40-60% token usage reduction | T047-T060, T058 | Token measurement comparison T056 vs T057 |
| SC-003: Zero duplicate function definitions | T061-T072, T070 | Grep search in T069 |
| SC-004: PWA offline functionality works | T038-T040, T043 | Airplane mode testing |
| SC-005: Migration <30min | T020-T031, T044 | Time measurement during T027 |
| SC-006: Schema changes <5min via slash command | T054-T055, T059 | /db-migrate execution time |
| SC-007: 90% dev tasks use MCP | T047-T060, T060 | MCP workflow testing |
| SC-008: All queries <2s | T038-T045, T083 | Performance benchmarking T083 |
| SC-009: Rollback works | T030, T046 | Rollback testing in T030 |
| SC-010: TypeScript types auto-generate <10s | T073 | Type generation execution time |

---

**Status**: ✅ Ready for implementation
**Total Tasks**: 87 tasks
**Parallel Opportunities**: 25+ tasks can run in parallel
**Independent Test Criteria**: Each user story has clear checkpoint validation
**MVP Scope**: User Story 1 only (T001-T046) = 46 tasks
