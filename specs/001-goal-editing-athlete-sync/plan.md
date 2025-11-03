# Implementation Plan: Goal Editing & Dynamic Athlete Sync

**Branch**: `001-goal-editing-athlete-sync` | **Date**: 2025-11-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-goal-editing-athlete-sync/spec.md`

## Summary

This feature adds goal editing capabilities (dates, description, target, exercise type) and dynamic athlete roster synchronization with Google Sheets. Primary requirement: coaches can update goals without deleting/recreating and roster changes in Sheets automatically sync to app while preserving all historical data.

**Technical Approach**: Extend existing goal and athlete data structures with new fields (updatedAt, id, status, order), implement edit modal UI reusing existing modal patterns, add ID-based athlete tracking for sync consistency, preserve offline-first data flow with pendingChanges queue.

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+ (arrow functions, async/await, destructuring, template literals)
**Primary Dependencies**: None (zero dependencies per constitution - no npm packages, frameworks, or libraries)
**Storage**: localStorage API (primary, 5-10MB limit) + Google Apps Script Web App (secondary sync)
**Testing**: Manual testing only (no automated test framework per constitution)
**Target Platform**: Mobile browsers (Safari iOS 14+, Chrome Android 90+)
**Project Type**: Single-file PWA (coach-pwa-app (7).html - unique architecture)
**Performance Goals**: <100ms touch response, <2s page load on 3G, <5s sync operation
**Constraints**: Offline-capable, single HTML file, dark theme only, Russian language UI, touch-first (44px+ targets)
**Scale/Scope**: ~50 students, ~100 goals, ~20 exercises, 1350 lines total code (single file), manual sync only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Development Gates ✅

- [x] **Single-file architecture confirmed**: All changes within `coach-pwa-app (7).html` (no new files)
- [x] **Zero dependencies confirmed**: No npm packages, libraries, or frameworks (vanilla JS only)
- [x] **Offline-first data flow designed**: Edit goals → save to localStorage immediately → queue in pendingChanges[] → manual sync
- [x] **Mobile-only interactions designed**: Edit modal with touch-optimized inputs, date pickers, 48px touch targets
- [x] **Dark theme colors selected**: Reuse existing modal styles (`#1a1d29` card, `#4c9eff` primary, `#4ade80` success)
- [x] **Russian language text written**: All UI labels in Russian ("Редактировать цель", "Сохранить", "Дата начала", etc.)

### Constitution Principle Compliance

#### I. Single-File Architecture (NON-NEGOTIABLE) ✅
- **Compliance**: All HTML, CSS, and JavaScript changes remain within `coach-pwa-app (7).html`
- **Implementation**: Add edit modal HTML to `<body>` section (~lines 526-619), CSS to `<style>` block (~lines 11-524), JS functions to `<script>` block (~lines 621-1350)
- **No Violations**: No new .js, .css, or .html files created

#### II. Zero Dependencies (NON-NEGOTIABLE) ✅
- **Compliance**: No external libraries used
- **Implementation**: Native HTML5 date inputs (`<input type="date">`), vanilla JS DOM manipulation, native fetch API for sync
- **No Violations**: No npm packages, no React/Vue/jQuery

#### III. Offline-First Data Flow (CRITICAL) ✅
- **Compliance**: Edit goals offline → localStorage immediately → pendingChanges[] queue → manual sync
- **Implementation**:
  1. User edits goal → update in-memory `goalsData[]`
  2. Add to `pendingChanges[]` with type "goal_edit"
  3. Save both arrays to localStorage
  4. Display pending indicator (⏳)
  5. Manual sync uploads `pendingChanges[]` to Google Apps Script
  6. On success: clear `pendingChanges[]`, reload fresh data
- **No Violations**: Maintains existing offline pattern, no automatic background sync

#### IV. Mobile-Only Design (NON-NEGOTIABLE) ✅
- **Compliance**: Edit modal optimized for touch
- **Implementation**:
  - Touch targets: All buttons 48x48px minimum
  - Date inputs: Native `<input type="date">` (mobile-friendly picker)
  - Text inputs: 16px font size (prevents iOS zoom)
  - Modal: Full-screen on mobile (<768px width)
  - Backdrop tap: Dismiss modal (touch-friendly)
- **No Violations**: No desktop-specific features (hover states, right-click)

#### V. Fixed Dark Theme (IMMUTABLE) ✅
- **Compliance**: Reuse existing modal styles and color palette
- **Implementation**:
  - Modal background: `#1a1d29` (card color)
  - Input fields: `#2a2d3a` (input color)
  - Primary button: `#4c9eff` (primary color)
  - Text: `#ffffff` (text primary), `#8b8f9f` (labels)
  - Validation errors: `#dc2626` (danger color)
- **No Violations**: No new colors, no theme switching

#### VI. Russian Language Only (IMMUTABLE) ✅
- **Compliance**: All UI text in Russian
- **Implementation**:
  - Modal title: "Редактировать цель" (Edit Goal)
  - Fields: "Дата начала" (Start Date), "Дата окончания" (End Date), "Описание" (Description), "Целевое значение" (Target Value), "Тип упражнения" (Exercise Type)
  - Buttons: "Сохранить" (Save), "Отмена" (Cancel)
  - Validation: "Дата окончания должна быть после даты начала" (End date must be after start date)
  - Sync notification: "Добавлено: X, Удалено: Y" (Added: X, Removed: Y)
- **No Violations**: Code comments may be English, UI is Russian

### Post-Development Gates (Will verify after Phase 1)

- [ ] Single HTML file (no .js, .css, or .html files created)
- [ ] No package.json or node_modules/ directory
- [ ] localStorage pattern followed (immediate save, queue for sync)
- [ ] Touch interactions tested on real mobile device
- [ ] Dark theme colors match official palette (no new colors)
- [ ] Russian text in UI (code comments may be English)

## Project Structure

### Documentation (this feature)

```text
specs/001-goal-editing-athlete-sync/
├── plan.md              # This file (/speckit.plan output)
├── spec.md              # Feature specification (✅ complete)
├── README.md            # Feature summary (✅ complete)
├── research.md          # Phase 0 output (pending)
├── data-model.md        # Phase 1 output (pending)
├── quickstart.md        # Phase 1 output (pending)
├── contracts/           # Phase 1 output (pending)
│   └── sync-api.md      # Google Apps Script API contract
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

**❗ CRITICAL DEVIATION FROM STANDARD TEMPLATES**

This project uses a **single-file architecture** that does NOT follow standard `src/` conventions. All code resides in one HTML file.

```text
coach-pwa-app (7).html  (1350 lines total, will grow to ~1600 lines)
├── Lines 1-10          : Meta tags (PWA manifest, viewport, theme-color)
├── Lines 11-524        : <style> block (CSS - dark theme, mobile-first)
│   ├── Global styles   : body, container, typography
│   ├── Header styles   : search, filters, chips
│   ├── Card styles     : athlete cards, goal cards
│   ├── Modal styles    : athlete details, performance edit, goal edit (NEW)
│   └── Navigation      : bottom nav bar
├── Lines 526-619       : <body> markup (HTML structure)
│   ├── Header          : search bar, group filter chips
│   ├── Athlete list    : cards with records, goals
│   ├── Goals list      : goal cards with completion status
│   ├── Modals          : athlete detail, performance edit, goal edit (NEW)
│   └── Navigation      : bottom tabs (Students, Goals, Settings)
└── Lines 621-1350      : <script> block (JavaScript - app logic)
    ├── State variables : athletesData[], goalsData[], exercisesData[], pendingChanges[]
    ├── Data functions  : loadData(), saveData(), syncData()
    ├── UI functions    : renderAthletes(), renderGoals(), openModal(), closeModal()
    ├── Edit functions  : editGoal() (NEW), saveGoalEdit() (NEW), validateGoalDates() (NEW)
    ├── Sync functions  : syncAthletes() (NEW), detectAthleteChanges() (NEW)
    └── Init function   : DOMContentLoaded event listener
```

**Structure Decision**: Single-file architecture per Constitution Principle I. No `src/`, `tests/`, or multi-file structure. All code changes are insertions/modifications within the single HTML file at specific line ranges. Line numbers are approximate and will shift as code grows.

**Implementation Location Strategy**:
- **HTML**: Insert goal edit modal markup after existing modals (~line 580)
- **CSS**: Insert goal edit modal styles after existing modal styles (~line 420)
- **JavaScript**: Insert goal edit functions after existing goal functions (~line 950)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified.** All gates passed. Feature fully complies with 6 core principles:

- ✅ Single-file architecture maintained
- ✅ Zero dependencies (vanilla JS)
- ✅ Offline-first pattern preserved
- ✅ Mobile-only touch design
- ✅ Dark theme colors reused
- ✅ Russian language UI

**No complexity justification required.**

---

## Phase 0: Research & Decision Documentation

**Status**: Ready to generate `research.md`

### Research Tasks Identified

Based on Technical Context analysis, the following research tasks are required:

1. **HTML5 Date Input Best Practices (Mobile)**
   - Question: How to implement mobile-friendly date pickers without external libraries?
   - Decision needed: Native `<input type="date">` vs custom JavaScript calendar
   - Platform concerns: iOS Safari date picker UX, Android Chrome compatibility
   - Validation: Date range validation (end > start), Russian locale formatting

2. **LocalStorage ID Generation Strategy**
   - Question: How to generate stable unique IDs for athletes without server-side UUID generation?
   - Decision needed: UUID v4 client-side generation vs timestamp-based IDs vs row numbers
   - Sync concerns: ID collision risks, offline ID generation, Google Sheets ID mapping
   - Alternatives: crypto.randomUUID() browser API vs custom implementation

3. **Athlete Sync Conflict Resolution Patterns**
   - Question: How to handle conflicts when both Sheets and local app have changes?
   - Decision needed: Last-write-wins vs merge strategy vs manual conflict resolution
   - Edge cases: Athlete removed in Sheets but edited locally, name changes, order changes
   - Performance: Efficient diff algorithm for 50+ athlete roster

4. **Google Apps Script API Update Requirements**
   - Question: What API changes needed to support goal editing and athlete sync?
   - Current API: Accepts pendingChanges[] array with mixed operations
   - New operations: "goal_edit" type (update existing goal), "athlete_sync" request (return full roster with IDs)
   - Response format: Need athlete ID assignments, sync summary (added/removed counts)

5. **Offline Edit Queue Management**
   - Question: How to handle multiple edits to same goal while offline?
   - Decision needed: Queue each edit separately vs coalesce into single final state
   - Edge case: Edit goal → mark completed → edit again → sync (what order?)
   - Data integrity: Ensure pendingChanges[] doesn't corrupt on multiple edits

### Unknowns to Resolve

- **NEEDS CLARIFICATION**: Date input localization - does `<input type="date">` display in Russian format on Russian-locale mobile browsers?
- **NEEDS CLARIFICATION**: crypto.randomUUID() browser support on iOS Safari 14+ and Chrome Android 90+ (target browsers)
- **NEEDS CLARIFICATION**: Google Sheets row number stability - do row numbers change when rows deleted above target row?
- **NEEDS CLARIFICATION**: localStorage write performance with 50+ athletes and 100+ goals (JSON serialize + write latency)

**Next Step**: Generate `research.md` with decisions, rationale, and alternatives for each research task.

---

## Phase 1: Design Artifacts

**Status**: Pending (requires Phase 0 completion)

### Data Model (data-model.md)

Will document enhanced Goal and Athlete entities from spec.md with implementation details:

- Goal entity fields, types, validation rules, indexes
- Athlete entity fields, types, status lifecycle, sync behavior
- localStorage schema design (JSON structure)
- Relationship mappings (athleteId foreign key)
- State transitions (goal status, athlete status)

### API Contracts (contracts/sync-api.md)

Will document Google Apps Script endpoint changes:

- **Existing**: POST /sync with pendingChanges[] (operations: goal_create, goal_complete, performance_update)
- **New operations**:
  - `goal_edit`: Update existing goal fields
  - `athlete_sync_request`: Request full athlete roster with IDs
- **Response format**: Sync summary (athletesAdded, athletesRemoved, goalsSynced)
- **Error handling**: Conflict resolution, validation errors

### Quickstart Guide (quickstart.md)

Will provide implementation guidance:

- Where to insert HTML (line numbers, section markers)
- Where to insert CSS (style grouping, naming conventions)
- Where to insert JavaScript (function organization, call order)
- Testing checklist (manual scenarios, offline testing)
- Rollback procedure (git branch, single-file revert)

### Agent Context Update

Will run `.specify/scripts/bash/update-agent-context.sh claude` to add:

- Feature-specific patterns (goal editing, athlete sync)
- Line number references for edit locations
- Constitution compliance reminders

---

## Phase 2: Task Generation

**Out of scope for /speckit.plan command.**

User will run `/speckit.tasks` after approving this plan to generate actionable task breakdown organized by user story priority (P1 → P2 → P3).

---

## Notes

### Key Architectural Decisions (Preliminary)

1. **Date Input**: Use native `<input type="date">` for mobile-friendly UX (research will validate)
2. **ID Generation**: Use crypto.randomUUID() or polyfill for client-side UUID generation (research will validate browser support)
3. **Sync Strategy**: Sheets wins for roster, local wins for performance/goals (documented in spec.md edge cases)
4. **Edit Queue**: Coalesce multiple edits to same goal into single final state in pendingChanges[] (research will validate approach)

### Implementation Risks

- **Risk**: localStorage quota exceeded with large roster (mitigate: monitor usage, warn at 80% capacity)
- **Risk**: Google Apps Script timeout with large sync payloads (mitigate: batch sync operations if >100 changes)
- **Risk**: Date input browser compatibility (mitigate: research phase will validate, fallback to text input if needed)
- **Risk**: UUID collision in offline mode (mitigate: use crypto-secure generation, collision probability negligible)

### Rollback Strategy

- **Single-file advantage**: Easy rollback with `git checkout main -- coach-pwa-app\ \(7\).html`
- **Feature branch**: All changes isolated in `001-goal-editing-athlete-sync` branch
- **Testing**: Manual testing before merge to main ensures no regressions

### Next Steps

1. ✅ **Phase 0 Complete**: Review this plan.md
2. 🔄 **Generate research.md**: Resolve NEEDS CLARIFICATION items, document decisions
3. ⏳ **Generate data-model.md**: Detail entity schemas, validation, relationships
4. ⏳ **Generate contracts/sync-api.md**: Document API changes for Google Apps Script
5. ⏳ **Generate quickstart.md**: Implementation guide with line numbers and patterns
6. ⏳ **Update agent context**: Run update script to enhance Claude context
7. ⏳ **Re-check Constitution**: Validate post-design compliance
8. ⏳ **Run /speckit.tasks**: Generate prioritized task breakdown for implementation
