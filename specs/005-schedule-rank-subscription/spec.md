# Feature Specification: Schedule Management, Subscription Tracking, and Athletic Rank Recording

**Feature Branch**: `005-schedule-rank-subscription`
**Created**: 2025-11-11
**Status**: Draft
**Input**: User description: "в целом вот можно частично осмотреть как на пример: [Image #1] 1) информация о расписании после сохранения отображается у клиента 2) нужно отображать всех клиентов которые хотя бы раз за сезон имели активный абонемент даже если сейчас он у них не активный уже 3) При редактировании расписания есть вот такая удобная форма [Image #2] можно выбирать ЛИБО Сам.Запись либо выставлять расписание выбирая день недели и время и добавляя этот час и время в инфу о расписании посещений клиента 4) так же нужна графа где мы можем выбирать на какой разряд клиент сдает в начале сезона 5) 2я графа где мы можем выбирать на какой разряд клиент сдает в конце сезона"

## User Scenarios & Testing

### User Story 1 - Schedule Information Display (Priority: P1)

Coach needs to see each athlete's attendance schedule immediately after viewing their profile to quickly understand when the athlete is expected to attend training sessions.

**Why this priority**: Core information visibility - coaches need this information multiple times per day to plan sessions and track attendance. Without this, the coach must check external sources or memory.

**Independent Test**: Can be fully tested by viewing any athlete's profile and verifying that saved schedule information is clearly visible in their profile card or detail view. Delivers immediate value by eliminating the need to check external schedule sources.

**Acceptance Scenarios**:

1. **Given** an athlete has a saved schedule, **When** coach views the athlete's profile, **Then** the schedule information is displayed prominently (e.g., "Пн/Ср/Пт 18:00-19:00" or "Самозапись")
2. **Given** an athlete has no schedule set, **When** coach views the athlete's profile, **Then** no schedule information is shown (no placeholder text or empty fields)
3. **Given** an athlete has multiple schedule entries, **When** coach views the athlete's profile, **Then** all schedule slots are displayed in a readable format

---

### User Story 2 - Subscription History Filtering (Priority: P2)

Coach wants to see all athletes who had an active subscription at any point during the current season, even if their subscription has expired, to maintain complete season records and contact past subscribers for renewal.

**Why this priority**: Important for retention and record-keeping but not required for daily training operations. Enables season-long tracking and re-engagement campaigns.

**Independent Test**: Can be tested independently by filtering the athlete list with "show all with subscription history this season" toggle. Verifies that athletes with expired subscriptions from current season appear in the list alongside currently active subscribers. Delivers value for season planning and subscription renewal outreach.

**Acceptance Scenarios**:

1. **Given** the current season is Sept 2024 - Aug 2025, **When** coach views athlete list, **Then** all athletes who had active subscription during any part of Sept 2024 - Aug 2025 are displayed
2. **Given** an athlete had subscription in previous season only (e.g., May 2024), **When** viewing current season list, **Then** that athlete is NOT displayed
3. **Given** an athlete's subscription expired mid-season (e.g., active Sept-Dec 2024, expired Jan 2025), **When** viewing list in Feb 2025, **Then** that athlete IS displayed with status indicator showing subscription has expired
4. **Given** filter is applied, **When** coach views athlete count, **Then** count reflects total number of athletes with season subscription history (not just currently active)

---

### User Story 3 - Schedule Editing with Flexible Input (Priority: P1)

Coach needs an intuitive form to set athlete attendance schedules with two clear options: either set specific days/times for regular weekly schedule, or mark athlete as "Self-Registration" for flexible attendance without fixed schedule.

**Why this priority**: Critical daily workflow - coaches set schedules during onboarding, subscription renewal, or schedule changes (happens multiple times per week). Flexible input reduces friction and accommodates different attendance patterns.

**Independent Test**: Can be tested independently by opening schedule edit form, selecting either regular schedule (day + time) or self-registration option, saving, and verifying the choice is reflected in athlete's profile. Delivers immediate value by simplifying schedule management workflow.

**Acceptance Scenarios**:

1. **Given** coach opens schedule edit form for an athlete, **When** viewing the form, **Then** two clear options are presented: "Fixed Schedule" and "Self-Registration"
2. **Given** coach selects "Fixed Schedule", **When** filling the form, **Then** day-of-week selector (Mon-Sun) and time picker are available to add schedule entries
3. **Given** coach selects "Self-Registration", **When** saving the form, **Then** athlete's schedule is set to "Самозапись" and no fixed schedule entries are stored
4. **Given** coach adds multiple schedule entries (e.g., Mon 18:00, Wed 18:00, Fri 18:00), **When** saving the form, **Then** all entries are saved and displayed in athlete's profile
5. **Given** athlete currently has fixed schedule, **When** coach switches to "Self-Registration", **Then** previous schedule entries are removed and replaced with self-registration status

---

### User Story 4 - Season Start Athletic Rank Recording (Priority: P3)

Coach wants to record which athletic rank/qualification each athlete is targeting at the beginning of the season to track skill progression goals and plan training programs accordingly.

**Why this priority**: Important for goal setting and progress tracking but not critical for daily operations. Primarily used during season start (once per year per athlete) and for progress reports.

**Independent Test**: Can be tested independently by editing an athlete's profile, selecting a rank from predefined options (e.g., "Юношеский разряд", "3 взрослый разряд"), saving, and verifying the rank appears in athlete's profile. Delivers value for long-term tracking and structured training planning.

**Acceptance Scenarios**:

1. **Given** coach edits athlete profile, **When** viewing rank section, **Then** a dropdown/selector for "Season Start Rank" is available with standard athletic rank options
2. **Given** coach selects a rank from dropdown (e.g., "Юношеский разряд"), **When** saving, **Then** the rank is saved and displayed in athlete's profile summary
3. **Given** an athlete has no rank set, **When** viewing profile, **Then** rank field shows as empty or "Not set" (not a default placeholder rank)
4. **Given** season changes (e.g., Sept 1), **When** coach views athlete profiles, **Then** previous season's end rank can be referenced when setting new season's start rank

---

### User Story 5 - Season End Athletic Rank Recording (Priority: P3)

Coach wants to record which athletic rank each athlete achieved by the end of the season to track skill development outcomes, measure training effectiveness, and prepare certification documentation.

**Why this priority**: Important for progress documentation and annual reviews but not needed during active season. Primarily used at season end (once per year per athlete) and for performance reports.

**Independent Test**: Can be tested independently by editing an athlete's profile at any time, selecting an end-of-season rank, saving, and verifying it appears in profile. Delivers value for outcome tracking and certification preparation at season conclusion.

**Acceptance Scenarios**:

1. **Given** coach edits athlete profile, **When** viewing rank section, **Then** a dropdown/selector for "Season End Rank" is available with same rank options as start rank
2. **Given** coach selects end rank (e.g., "3 взрослый разряд") higher than start rank, **When** saving, **Then** the rank is saved showing progression
3. **Given** end rank equals start rank, **When** saving, **Then** system accepts this (athlete maintained rank without progression)
4. **Given** both start and end ranks are set, **When** viewing athlete profile, **Then** both ranks are displayed together showing progression (e.g., "Юношеский → 3 взрослый")
5. **Given** season ends and new season begins, **When** coach sets new season ranks, **Then** previous season's ranks are preserved for historical records

---

### Edge Cases

**Note**: All edge cases have been converted to functional requirements FR-023 through FR-028 with explicit handling logic.

## Requirements

### Functional Requirements

- **FR-001**: System MUST display athlete's schedule information prominently in their profile view after schedule has been saved
- **FR-002**: System MUST support storing schedule information in two formats: (1) fixed schedule with specific days and times, or (2) self-registration indicator
- **FR-003**: System MUST include all athletes in list view who had an active subscription at any point during the current season, regardless of current subscription status
- **FR-004**: System MUST calculate current season based on September-to-August academic year boundary
- **FR-005**: System MUST provide a schedule editing form with two mutually exclusive options: fixed schedule input and self-registration toggle
- **FR-006**: System MUST allow adding multiple schedule entries for fixed schedule (e.g., different days and times)
- **FR-007**: System MUST provide day-of-week selector (Monday through Sunday) for fixed schedule entries
- **FR-008**: System MUST provide time input field for each fixed schedule entry
- **FR-009**: System MUST replace all fixed schedule entries with self-registration indicator when coach switches to self-registration mode
- **FR-010**: System MUST provide a dropdown selector for recording season start athletic rank in athlete profile
- **FR-011**: System MUST provide a separate dropdown selector for recording season end athletic rank in athlete profile
- **FR-012**: System MUST include standard Russian athletic rank options in rank selectors (e.g., "Юношеский разряд", "3 взрослый разряд", "2 взрослый разряд", "1 взрослый разряд", "КМС", "МС")
- **FR-013**: System MUST allow rank fields to remain empty (optional data entry)
- **FR-014**: System MUST preserve historical rank data when new season begins
- **FR-015**: System MUST display both start and end ranks together in athlete profile when both are set
- **FR-019**: System MUST store historical rank data for each athlete across multiple seasons in JSONB format with structure: `[{season: "2024-2025", rank_start: "I юношеский", rank_end: "III взрослый", recorded_at: "2025-08-31"}]`
- **FR-020**: System MUST append new season rank data to history without overwriting previous seasons when new season begins (September 1)
- **FR-021**: System MUST provide UI to view historical rank progression across past seasons in athlete profile
- **FR-016**: System MUST persist schedule data to Supabase database and sync bidirectionally to survive browser refresh, cross-device access, and offline-online transitions. Schedule data syncs as part of athlete record update operation.
- **FR-017**: System MUST track subscription status history per athlete per season for filtering purposes
- **FR-022**: System MUST validate schedule field format with regex: `^(Самозапись|(Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2}(, (Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2})*)$` before saving to database
- **FR-023**: System MUST allow overlapping schedule time slots for same athlete (e.g., "Пн 18:00" and "Пн 18:30" both valid) - no conflict validation required per coach flexibility needs
- **FR-024**: System MUST preserve schedule type switch history in console logs for debugging (log entry format: "🔄 Schedule mode switched: Fixed → Self-Registration, athlete_id: 123, timestamp: ISO8601")
- **FR-025**: System MUST display athletes with season-boundary subscriptions correctly: if subscription spans Sept 1 (e.g., Aug 25 - Sept 5), athlete included in BOTH seasons' filtered lists
- **FR-026**: System MUST display "(Не указано)" for rank fields when NULL, differentiating from "Без разряда" option (which is explicit choice)
- **FR-027**: System MUST allow setting rank_end before season officially ends (no date validation) - coaches may record ranks during final competitions in July-August
- **FR-028**: System MUST treat empty rank fields as "not yet recorded" and "Без разряда" selection as "athlete has no rank" - both valid but semantically different states

### Key Entities

- **Athlete Schedule**: Stored as single TEXT field `schedule` containing formatted string. Two formats: (1) Fixed schedule: "Пн ЧЧ:ММ, Ср ЧЧ:ММ, Пт ЧЧ:ММ" (comma-separated day+time pairs), (2) Self-registration: literal string "Самозапись". Example: `schedule = "Пн 18:00, Ср 19:00"` or `schedule = "Самозапись"`
- **Athlete Subscription History**: Represents subscription status over time, with fields for athlete reference, subscription start date, subscription end date, season identifier, and current active status
- **Athletic Rank Record**: Represents rank achievement tracking with fields: `rank_start TEXT` (current season start rank), `rank_end TEXT` (current season end rank), `rank_history JSONB` (array of historical season records with structure `[{season, rank_start, rank_end, recorded_at}]`)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Coaches can view athlete schedules in under 2 seconds from opening athlete profile
- **SC-002**: Schedule editing form supports both fixed schedule and self-registration input with clear visual distinction between the two modes
- **SC-003**: Athlete list filtering includes all athletes with subscription history during current season within 3 seconds
- **SC-004**: 100% of schedule data persists across browser sessions and device switches (no data loss)
- **SC-005**: Coaches can record both season start and end ranks for any athlete with ranks visible in profile summary
- **SC-006**: Historical rank data from previous seasons remains accessible for comparison and reporting purposes

## Assumptions

- **Assumption 1**: Standard Russian athletic rank system applies (Юношеский → 3й → 2й → 1й → КМС → МС)
- **Assumption 2**: Season boundaries are fixed as September 1 to August 31
- **Assumption 3**: Schedule information needs to be stored in database schema alongside existing athlete data (requires schema extension)
- **Assumption 4**: Self-registration athletes do not need attendance time tracking (schedule-less model)
- **Assumption 5**: Subscription history is available from existing subscription/payment data or CRM integration
- **Assumption 6**: Overlapping schedule entries are allowed (athlete attends multiple sessions on same day)
- **Assumption 7**: Time format follows 24-hour format (e.g., 18:00 rather than 6:00 PM)
- **Assumption 8**: Rank recording is manual coach input (not automated based on competition results)
- **Assumption 9**: Previous implementation stored schedule in localStorage only; new implementation requires Supabase database schema extension
- **Assumption 10**: Application already has Supabase integration for athlete data sync (extending existing data model)

## Dependencies

- **Dependency 1**: Supabase database schema must be extended to add `schedule` field to `athletes` table
- **Dependency 2**: Supabase database schema must be extended to add `rank_start` and `rank_end` fields to `athletes` table (or separate `athletic_ranks` table)
- **Dependency 3**: Moyklass CRM API must be accessible with valid credentials for subscription data retrieval. API endpoint format: `https://api.moyklass.com/v1/...`. If Moyklass unavailable, alternative: query Supabase `subscriptions` table with columns `athlete_id, start_date, end_date, status, season` (requires migration if not exists)
- **Dependency 4**: Schedule editing UI form requires integration with existing athlete profile edit modal
- **Dependency 5**: Rank dropdown options must be defined (either hardcoded list or configurable reference data)

## Out of Scope

- Automated schedule conflict detection across multiple athletes
- Schedule change notifications to athletes (email/SMS alerts)
- Attendance tracking based on schedule (marking present/absent)
- Schedule template creation (saving common schedules for reuse)
- Bulk schedule editing (changing multiple athletes at once)
- Schedule export to calendar applications (iCal, Google Calendar)
- Automated rank progression recommendations based on performance data
- Rank certification document generation
- Historical trend analysis for rank progression across multiple seasons
- Integration with external competition/certification databases
