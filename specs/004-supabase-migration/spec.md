# Feature Specification: Supabase Migration with Autonomous Development Workflow

**Feature Branch**: `004-supabase-migration`
**Created**: 2025-11-10
**Status**: Draft
**Input**: User description: "Migrate from Google Sheets to Supabase database with autonomous development workflow and token optimization. Goals: 1) Replace Google Sheets with Supabase as primary database, 2) Implement autonomous development process with MCP integration for token efficiency, 3) Resolve code duplication issue in Google Apps Script files"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Database Migration from Google Sheets to Supabase (Priority: P1)

Coach needs to migrate all existing athlete data, exercises, and goals from Google Sheets to Supabase database without data loss or service interruption.

**Why this priority**: This is the foundational requirement - without successful data migration, the entire feature cannot function. This unblocks all other work and delivers immediate value by establishing the new database infrastructure.

**Independent Test**: Can be fully tested by exporting data from Google Sheets, importing to Supabase, and verifying data integrity through queries. Delivers a working Supabase database with all historical data.

**Acceptance Scenarios**:

1. **Given** Google Sheets contains athlete records, exercises, and goals, **When** migration script runs, **Then** all data appears in Supabase tables with correct structure and relationships
2. **Given** migration is complete, **When** querying Supabase for specific athlete data, **Then** system returns exact same data as Google Sheets (verified via checksum or record count)
3. **Given** PWA app connected to Supabase, **When** coach opens athlete list, **Then** all athletes display with correct performance data and goals
4. **Given** migration fails mid-process, **When** error occurs, **Then** system provides clear error message and rollback mechanism to restore previous state

---

### User Story 2 - Autonomous Development Workflow with MCP Integration (Priority: P2)

Developers need an autonomous development workflow that uses MCP servers (Serena, Context7, Sequential, Morphllm) to minimize token usage while maintaining Supabase schema and queries.

**Why this priority**: This delivers long-term efficiency gains and reduces development costs by 40-60%. Can be implemented after database migration is complete, and provides ongoing value for future development.

**Independent Test**: Can be tested by executing common development tasks (schema changes, query updates, data operations) and measuring token usage before/after MCP integration. Delivers measurable efficiency improvements.

**Acceptance Scenarios**:

1. **Given** developer needs to query Supabase schema, **When** using Serena MCP to read schema.sql, **Then** schema loads in single operation without repeating structure in conversation
2. **Given** developer needs Supabase JS patterns, **When** using Context7 MCP, **Then** official documentation patterns load without manual web search
3. **Given** developer needs to update multiple queries, **When** using Morphllm MCP with pattern instructions, **Then** bulk edits apply across multiple files in single operation
4. **Given** developer analyzes query optimization, **When** using Sequential MCP, **Then** systematic analysis completes with hypothesis testing and evidence-based recommendations
5. **Given** schema change is needed, **When** developer uses slash command /db-query or /db-migrate, **Then** migration file generates automatically from schema diff

---

### User Story 3 - Eliminate Code Duplication in Database Operations (Priority: P3)

Development team needs to consolidate duplicate code that currently exists in two Google Apps Script files (import script and webapp script) into single-source Supabase implementation.

**Why this priority**: This improves code maintainability and reduces bugs, but can be implemented after migration is complete. Delivers value through reduced technical debt and easier future maintenance.

**Independent Test**: Can be tested by reviewing codebase for duplicate function definitions and verifying all database operations use single shared implementation (Postgres functions or shared client code).

**Acceptance Scenarios**:

1. **Given** duplicate functions exist in import.gs and webapp.gs, **When** migrating to Supabase, **Then** shared logic moves to Postgres functions callable by all clients
2. **Given** PWA app and CRM import script both need athlete data, **When** calling Supabase, **Then** both use same Postgres function save_athlete_with_validation()
3. **Given** data validation logic needs update, **When** changing Postgres function, **Then** both PWA and import script automatically use updated logic without code changes
4. **Given** reviewing codebase after migration, **When** searching for duplicate function names, **Then** zero duplicates found in client code (all shared logic in Postgres)

---

### Edge Cases

- What happens when Supabase connection fails during PWA usage? (Offline-first must continue to work with localStorage)
- How does system handle migration errors if Google Sheets data is malformed or incomplete?
- What happens if Postgres function calls fail due to permissions or RLS policy violations?
- How does system handle concurrent data edits from PWA and import script simultaneously?
- What happens when schema migration is needed while PWA users are actively using the app?
- How does system recover if Supabase reaches connection limits or rate limits?

### Edge Cases - Proposed Solutions

#### Concurrent Data Edits (PWA + Import Script Simultaneously)

**Problem**: PWA user edits athlete performance data while CRM import script updates the same athlete's records from external system, causing data conflicts.

**Solution Strategy**:
1. **Optimistic Locking with Timestamps**:
   - Add `updated_at` timestamp column to all tables (athletes, exercises, goals, performances)
   - Use `WHERE updated_at = $expected_timestamp` in UPDATE queries to detect conflicts
   - If conflict detected (0 rows affected), reject update with clear error message

2. **Last Write Wins (Default)**:
   - For MVP, use simple "last write wins" strategy - newest timestamp takes precedence
   - Postgres MVCC (Multi-Version Concurrency Control) provides transaction isolation automatically
   - No complex conflict resolution UI needed for MVP

3. **Conflict Detection in PWA**:
   - Before syncing pendingChanges from localStorage to Supabase, fetch latest `updated_at` for affected records
   - If remote `updated_at > local updated_at`, show warning: "Данные изменились на сервере. Синхронизировать?"
   - User can choose: "Перезаписать" (force push) or "Отменить" (discard local changes)

4. **Import Script Safety**:
   - Import script uses service role key with elevated permissions
   - Wrap bulk imports in single Postgres transaction with `BEGIN/COMMIT`
   - If transaction fails, automatic rollback prevents partial data corruption

**Implementation Requirements**:
- Add `updated_at TIMESTAMP DEFAULT NOW()` to schema.sql for all tables
- Create Postgres trigger: `UPDATE updated_at = NOW() ON UPDATE` for automatic timestamp management
- Add conflict detection logic to PWA sync function (check timestamps before UPDATE)
- Add transaction wrapping to import script for atomic bulk operations

#### Schema Migration During Active App Usage

**Problem**: Developer needs to add new column or change table structure while PWA users are actively using the app, potentially causing query failures or data loss.

**Solution Strategy**:
1. **Backward-Compatible Migrations Only (MVP)**:
   - Use additive migrations: ADD COLUMN, CREATE INDEX, ADD CONSTRAINT (not DROP/ALTER)
   - Never drop columns or rename tables until app version updates deployed
   - Example: Add `exercises.difficulty_level` without breaking existing queries

2. **Migration Execution During Low-Traffic Window**:
   - Schedule migrations for evening/weekend when user activity is minimal
   - Monitor Supabase dashboard for active connections before running migration
   - Use Supabase SQL Editor for manual migration execution with immediate feedback

3. **Zero-Downtime Migration Pattern**:
   - Phase 1: Add new column with DEFAULT value (no impact on existing queries)
   - Phase 2: Deploy PWA update that uses new column (backward compatible)
   - Phase 3: Backfill existing data if needed (background job)
   - Phase 4: Make column NOT NULL if required (after all data populated)

4. **Rollback Safety**:
   - Keep migration rollback script ready: `ALTER TABLE DROP COLUMN IF EXISTS`
   - Test migrations in Supabase staging project first before production
   - Document migration steps in `.specify/supabase/migrations/` folder

**Implementation Requirements**:
- Create migration file template: `.specify/supabase/migrations/YYYYMMDD_description.sql`
- Add migration documentation to CLAUDE.md: "How to run safe migrations"
- Create slash command `/db-migrate` that generates backward-compatible migration from schema diff
- Add migration testing checklist to constitution.md

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST migrate all athlete records from Google Sheets to Supabase athletes table without data loss
- **FR-002**: System MUST migrate all exercise definitions from Google Sheets to Supabase exercises table with correct categorization
- **FR-003**: System MUST migrate all goals from Google Sheets to Supabase goals table with athlete relationships preserved
- **FR-004**: System MUST create Supabase schema with tables: athletes, exercises, goals, performances
- **FR-005**: System MUST implement Row Level Security (RLS) policies for data access control
- **FR-006**: System MUST maintain offline-first PWA functionality using localStorage with Supabase sync
- **FR-007**: System MUST provide schema-first development workflow with .specify/supabase/schema.sql as single source of truth
- **FR-008**: System MUST integrate Serena MCP for schema file reading and project memory
- **FR-009**: System MUST integrate Context7 MCP for Supabase official documentation patterns
- **FR-010**: System MUST integrate Sequential MCP for query optimization analysis
- **FR-011**: System MUST integrate Morphllm MCP for pattern-based bulk query edits
- **FR-012**: System MUST create slash commands: /db-query and /db-migrate for autonomous development
- **FR-013**: System MUST consolidate duplicate database logic into Postgres functions
- **FR-014**: System MUST provide migration rollback mechanism in case of errors
- **FR-015**: System MUST generate TypeScript types automatically from Supabase schema
- **FR-016**: PWA app MUST connect to Supabase using Supabase JS SDK
- **FR-017**: CRM import script MUST connect to Supabase using service role key
- **FR-018**: System MUST preserve current season calculation logic (September-August academic year)
- **FR-019**: System MUST maintain pending changes queue for offline sync to Supabase
- **FR-020**: System MUST provide data integrity verification (checksum or record count) after migration

### Key Entities *(include if feature involves data)*

- **Athletes**: Student records with name, group, season, status, performance history. Relationships: has many performances, has many goals
- **Exercises**: Exercise definitions with name, type, category, measurement unit. Relationships: has many performances
- **Goals**: Target performance values for specific athlete-exercise combinations. Relationships: belongs to athlete, belongs to exercise
- **Performances**: Historical performance records linking athlete to exercise with value and date. Relationships: belongs to athlete, belongs to exercise
- **Supabase Schema File**: Single source of truth stored at .specify/supabase/schema.sql defining all tables, indexes, constraints
- **RLS Policies**: Row Level Security rules defining data access permissions per table
- **Postgres Functions**: Shared business logic (validation, calculations) callable by all clients
- **MCP Context Files**: Configuration stored in .specify/memory/SUPABASE_CONTEXT.md with connection strings and development patterns

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All athlete records (100%) successfully migrate from Google Sheets to Supabase with zero data loss verified via checksum
- **SC-002**: Token usage for common development tasks (schema queries, documentation lookup, bulk edits) reduces by 40-60% measured before/after MCP integration
- **SC-003**: Zero duplicate function definitions exist in codebase after migration (verified via code search)
- **SC-004**: PWA offline functionality continues to work - users can add/edit data in airplane mode and sync when reconnected
- **SC-005**: Migration completes in under 30 minutes for typical dataset size (50-200 athletes, 20-50 exercises, 100-500 goals)
- **SC-006**: Schema changes can be implemented using /db-migrate slash command in under 5 minutes without manual SQL writing
- **SC-007**: 90% of development tasks complete using MCP servers without requiring manual documentation lookup or web search
- **SC-008**: Database query performance maintains or improves compared to Google Sheets (all queries complete in under 2 seconds)
- **SC-009**: Rollback mechanism successfully restores previous state if migration fails (tested in staging environment)
- **SC-010**: TypeScript types auto-generate from schema within 10 seconds of schema changes

## Assumptions *(optional)*

- Supabase free tier provides sufficient capacity for current user base (single coach, 50-200 athletes)
- Google Sheets API remains accessible during migration window for data export
- PWA app structure can be modified to integrate Supabase JS SDK without breaking existing functionality
- Developer has Supabase account and project already created
- Migration can be performed during low-usage period (evening/weekend) to minimize user impact
- Existing Google Apps Script files can be deprecated after successful migration
- MCP servers (Serena, Context7, Sequential, Morphllm) are already installed and functional in Claude Code environment
- Schema-first development workflow is acceptable (schema.sql as single source of truth)
- Postgres functions are acceptable for shared business logic (validation, calculations)
- Row Level Security (RLS) is sufficient for data access control (no additional auth layer needed for MVP)

## Dependencies *(optional)*

- **External**: Supabase account and project setup required before migration
- **External**: Supabase JS SDK must be added to PWA app (via CDN for single-file HTML structure)
- **Internal**: Constitution.md must be updated to reflect Supabase architecture principles
- **Internal**: ULTRATHINK_MODE.md must document MCP server usage patterns for Supabase development
- **Internal**: Existing Google Sheets export functionality must work to generate migration data
- **MCP Servers**: Serena MCP for schema file reading and project memory
- **MCP Servers**: Context7 MCP for Supabase official documentation (resolve-library-id → get-library-docs)
- **MCP Servers**: Sequential MCP for query optimization and migration planning analysis
- **MCP Servers**: Morphllm MCP for pattern-based bulk query edits across multiple files
- **Documentation**: Supabase official docs for JS SDK, RLS policies, Postgres functions patterns

## Out of Scope *(optional)*

- **Authentication/Authorization**: No Google OAuth or user login system (internal tool for single coach)
- **Real-time Sync**: No Supabase Realtime subscriptions for live updates (manual sync button sufficient for MVP)
- **Multi-coach Support**: Architecture optimized for single coach, not multi-tenant
- **Desktop Optimization**: Mobile-only focus preserved (no desktop UI considerations)
- **Advanced Analytics**: No complex reporting or dashboard features beyond current functionality
- **Automated Testing**: No Playwright E2E tests for database operations (manual testing sufficient for MVP)
- **Performance Monitoring**: No APM or observability tools for Supabase queries
- **Data Versioning**: No audit trail or change history tracking (simple CRUD operations only)
- **Advanced RLS**: Basic RLS policies only, no complex permission hierarchies
- **Database Backups**: Relying on Supabase automatic backups (no custom backup solution)

## Notes *(optional)*

### Migration Strategy

The migration will follow a phased approach:
1. **Phase 1**: Schema setup (create tables, indexes, RLS policies)
2. **Phase 2**: Data migration (export from Google Sheets → import to Supabase)
3. **Phase 3**: PWA integration (update app to use Supabase JS SDK)
4. **Phase 4**: MCP workflow setup (create schema files, slash commands, context files)
5. **Phase 5**: Code consolidation (move duplicate logic to Postgres functions)

### Token Optimization Architecture

The autonomous development workflow uses:
- **Serena MCP**: Reads .specify/supabase/schema.sql once, maintains in memory (70% token savings)
- **Context7 MCP**: Fetches Supabase JS patterns from official docs (50% token savings)
- **Sequential MCP**: Structures complex analysis with hypothesis testing (40% token savings)
- **Morphllm MCP**: Applies pattern-based edits across multiple files (60% token savings)
- **Slash Commands**: /db-query and /db-migrate for common operations (eliminates repetitive prompting)

### Risk Mitigation

- **Data Loss Risk**: Mitigated by keeping Google Sheets as read-only backup for 30 days post-migration
- **Migration Failure Risk**: Mitigated by rollback mechanism and staging environment testing
- **Offline Functionality Risk**: Mitigated by preserving localStorage as primary storage with Supabase as sync target
- **Performance Risk**: Mitigated by proper indexing and query optimization analysis via Sequential MCP
- **Token Budget Risk**: Mitigated by schema-first workflow and MCP integration reducing repetitive context

### Future Enhancements (Post-MVP)

- Supabase Realtime for live sync instead of manual sync button
- Advanced RLS policies for multi-coach support
- Automated backups to external storage
- Performance monitoring and query analytics
- Playwright E2E tests for critical database operations
