# Feature Specification: Goals API Backend

**Feature Branch**: `001-goals-api-backend`
**Created**: 2025-11-04
**Status**: Draft
**Input**: Implement Google Apps Script backend for goal management (createGoal, editGoal, deleteGoal, getGoals, getExercises) based on API contract from Feature 003. Deploy to test Google Sheets instance.

**Related Features**:
- Feature 003 (goal-fixes-and-creation) - Frontend implementation
- API Contract: `specs/003-goal-fixes-and-creation/contracts/google-apps-script-api.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Goal Creation via API (Priority: P1)

Coach creates a new goal in the PWA app (offline or online). When sync button is pressed, the app sends goal data to Google Apps Script, which generates a server UUID and stores the goal in Google Sheets.

**Why this priority**: Core functionality - without goal creation, Feature 003 frontend is non-functional. This is the most critical endpoint for MVP.

**Independent Test**: Can be fully tested by sending POST request with `action: "createGoal"` to deployed Web App. Success means new row appears in Goals sheet with server-generated UUID.

**Acceptance Scenarios**:

1. **Given** Goals sheet exists with headers, **When** valid createGoal request received, **Then** new row added with server UUID, success response returned
2. **Given** createGoal request with missing required fields, **When** request processed, **Then** 400 error returned with validation message
3. **Given** createGoal request with endDate before startDate, **When** validation runs, **Then** 400 error returned with descriptive message
4. **Given** offline goal created with client UUID, **When** sync succeeds, **Then** client receives server UUID to replace client UUID

---

### User Story 2 - Goal Editing via API (Priority: P2)

Coach edits an existing goal's dates, description, or status in the PWA app. When sync button is pressed, the app sends changed fields to Google Apps Script, which updates the corresponding row in Google Sheets.

**Why this priority**: Important for data maintenance, but app can function with only creation. Users can work around by deleting and recreating goals.

**Independent Test**: Can be fully tested by creating a goal first (US1), then sending POST request with `action: "editGoal"` and goalId. Success means row updated in Goals sheet with new values.

**Acceptance Scenarios**:

1. **Given** goal exists in Goals sheet, **When** valid editGoal request received, **Then** row updated with new field values, success response returned
2. **Given** editGoal request for non-existent goalId, **When** request processed, **Then** 404 error returned with message "Goal not found"
3. **Given** editGoal request with only updatedAt field, **When** validation runs, **Then** 400 error returned (requires at least one data field change)
4. **Given** editGoal request with invalid date logic, **When** validation runs, **Then** 400 error returned with validation details

---

### User Story 3 - Goal Deletion via API (Priority: P3)

Coach deletes a goal in the PWA app. When sync button is pressed, the app sends goalId to Google Apps Script, which hard-deletes the row from Google Sheets.

**Why this priority**: Nice to have, but least critical. Users can ignore unwanted goals or manually delete from spreadsheet.

**Independent Test**: Can be fully tested by creating a goal (US1), then sending POST request with `action: "deleteGoal"` and goalId. Success means row removed from Goals sheet.

**Acceptance Scenarios**:

1. **Given** goal exists in Goals sheet, **When** valid deleteGoal request received, **Then** row deleted from sheet, success response returned
2. **Given** deleteGoal request for non-existent goalId, **When** request processed, **Then** 404 error returned
3. **Given** goal already deleted, **When** duplicate deleteGoal request received, **Then** 404 error returned (idempotent behavior)

---

### User Story 4 - Fetch All Goals (Priority: P1)

When PWA app loads or after successful sync, it fetches all goals from Google Apps Script to update local state. Goals data includes studentId, exerciseId, dates, status, and descriptive fields.

**Why this priority**: Critical for initial load and post-sync refresh. Without this, app has no data to display after sync.

**Independent Test**: Can be fully tested by sending POST request with `action: "getGoals"`. Success means JSON array of all goals returned with correct schema.

**Acceptance Scenarios**:

1. **Given** Goals sheet has data, **When** getGoals request received, **Then** array of goal objects returned with all fields
2. **Given** Goals sheet is empty, **When** getGoals request received, **Then** empty array returned (not error)
3. **Given** Goals sheet has rows with missing optional fields, **When** getGoals processes data, **Then** null/empty values handled gracefully

---

### User Story 5 - Fetch All Exercises (Priority: P2)

When PWA app opens goal creation modal, it needs exercise definitions to populate the dropdown. App fetches exercises from Google Apps Script, which returns exercise types from Exercises sheet.

**Why this priority**: Important for goal creation UX, but can work around with hardcoded exercise list in frontend temporarily.

**Independent Test**: Can be fully tested by sending POST request with `action: "getExercises"`. Success means JSON array of exercise objects returned.

**Acceptance Scenarios**:

1. **Given** Exercises sheet has data, **When** getExercises request received, **Then** array of exercise objects returned with id, name, type
2. **Given** Exercises sheet is empty, **When** getExercises request received, **Then** empty array returned (not error)

---

### Edge Cases

- **What happens when Google Sheets quota exceeded?** → Return 503 error with message about quota limits
- **What happens with concurrent writes to same goal?** → Last write wins (Google Sheets doesn't support transactions)
- **What happens when UUID collision occurs?** → Extremely unlikely with UUID v4, but should check for duplicates before insert
- **What happens if Goals sheet is missing?** → Create sheet automatically or return 500 error with setup instructions
- **What happens if request has malformed JSON?** → Return 400 error with "Invalid JSON" message
- **What happens if action field is missing/unknown?** → Return 400 error with "Unknown action" message
- **What happens with very long description field?** → Validate max 200 chars, return 400 if exceeded
- **What happens if client sends createGoal twice (network retry)?** → Check if serverId exists, return existing ID (idempotent)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept HTTP POST requests at Web App deployment URL
- **FR-002**: System MUST parse JSON request body and extract `action` field for routing
- **FR-003**: System MUST implement 5 action handlers: createGoal, editGoal, deleteGoal, getGoals, getExercises
- **FR-004**: System MUST validate all input data before performing Google Sheets operations
- **FR-005**: System MUST generate server UUIDs for new goals using `Utilities.getUuid()`
- **FR-006**: System MUST return structured JSON responses with `success` boolean and appropriate data/error fields
- **FR-007**: System MUST store goals in Google Sheets with columns: goalId, studentId, studentName, exerciseId, exerciseName, startDate, endDate, description, targetValue, notes, status, createdAt, updatedAt
- **FR-008**: System MUST store exercises in Google Sheets with columns: exerciseId, exerciseName, exerciseType
- **FR-009**: System MUST handle missing optional fields (description, targetValue, notes) with null/empty values
- **FR-010**: System MUST validate date logic (endDate must be >= startDate)
- **FR-011**: System MUST validate description max length (200 chars)
- **FR-012**: System MUST return HTTP 400 for validation errors with descriptive error messages
- **FR-013**: System MUST return HTTP 404 for operations on non-existent goalIds
- **FR-014**: System MUST return HTTP 500 for internal server errors (e.g., Sheets API failures)
- **FR-015**: System MUST support idempotent createGoal (check if serverId exists before creating)
- **FR-016**: System MUST perform hard delete for deleteGoal action (remove row from sheet)
- **FR-017**: System MUST support partial updates for editGoal (only modify specified fields)
- **FR-018**: System MUST log errors to Apps Script execution logs for debugging
- **FR-019**: System MUST handle CORS automatically (Google Apps Script default behavior)
- **FR-020**: System MUST enforce HTTPS (Google Apps Script default behavior)

### Key Entities *(include if feature involves data)*

- **Goal**: Represents a student's training goal with start/end dates, target performance, and status tracking. Stored in Goals sheet. Key attributes: goalId (server UUID), studentId, exerciseId, startDate, endDate, description, targetValue, status (active/completed/cancelled), timestamps.

- **Exercise**: Represents an exercise type available for goal creation. Stored in Exercises sheet. Key attributes: exerciseId (UUID), exerciseName (e.g., "Подтягивания"), exerciseType (e.g., "pull-ups", "push-ups").

- **PendingChange** (client-side only): Frontend queue for offline operations. Not stored in backend. Backend only processes individual actions, unaware of pending queue.

### Non-Functional Requirements

- **NFR-001**: API response time MUST be <3 seconds for normal Google Sheets operations
- **NFR-002**: System MUST handle up to 50 concurrent requests (Google Apps Script limit: 30)
- **NFR-003**: Code MUST include Russian error messages for consistency with frontend
- **NFR-004**: Code MUST use clear function names and comments for maintainability
- **NFR-005**: System SHOULD validate against Google Apps Script quotas (20,000 URL Fetch calls/day)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 endpoints (createGoal, editGoal, deleteGoal, getGoals, getExercises) respond with correct JSON structure as per API contract
- **SC-002**: Frontend sync operation completes end-to-end: create goal offline → sync → serverId returned → goal appears in Google Sheets
- **SC-003**: Validation errors return structured 400 responses with Russian error messages
- **SC-004**: Goals sheet correctly stores all required fields with server UUIDs
- **SC-005**: Exercises sheet correctly stores exercise definitions for dropdown population
- **SC-006**: Manual testing with Postman/curl shows all endpoints working correctly
- **SC-007**: Integration with Feature 003 frontend works: goal creation modal → sync → data persists
- **SC-008**: Error scenarios handled gracefully (missing goal, validation failures, malformed JSON)

### Definition of Done

- [ ] Google Apps Script code written with all 5 action handlers
- [ ] Goals sheet structure created with correct column headers
- [ ] Exercises sheet structure created with sample exercise data
- [ ] Code deployed to test Web App URL: `https://script.google.com/macros/s/AKfycbxTKZWnMPQZZpEm9egEEw43fXbyD_AxiYzFUxjqLmBez_BZ08fWA-IXVOnNmhzpSdYGoQ/exec`
- [ ] Manual testing completed for all 5 endpoints with Postman/curl
- [ ] Integration testing with Feature 003 frontend completed
- [ ] Error handling tested (validation errors, missing goals, malformed requests)
- [ ] Frontend WEBAPP_URL updated to point to new test deployment
- [ ] Documentation provided for Google Sheets setup (sheet names, column structure)

## Technical Notes

### Google Sheets Structure

**Goals Sheet** (name: `Goals`):
| Column | Type | Required | Example |
|--------|------|----------|---------|
| goalId | String (UUID) | Yes | `"f47ac10b-58cc-4372-a567-0e02b2c3d479"` |
| studentId | String (UUID) | Yes | `"a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"` |
| studentName | String | Yes | `"Иванов Пётр"` |
| exerciseId | String (UUID) | Yes | `"ex-uuid-pullups"` |
| exerciseName | String | Yes | `"Подтягивания"` |
| startDate | String (YYYY-MM-DD) | Yes | `"2025-11-10"` |
| endDate | String (YYYY-MM-DD) | Yes | `"2025-12-10"` |
| description | String | No | `"12 подтягиваний к концу месяца"` |
| targetValue | Number | No | `12` |
| notes | String | No | `""` |
| status | String | Yes | `"active"` (active/completed/cancelled) |
| createdAt | String (ISO 8601) | Yes | `"2025-11-03T10:30:00.000Z"` |
| updatedAt | String (ISO 8601) | No | `"2025-11-03T14:30:00.000Z"` |

**Exercises Sheet** (name: `Exercises`):
| Column | Type | Required | Example |
|--------|------|----------|---------|
| exerciseId | String (UUID) | Yes | `"ex-uuid-pullups"` |
| exerciseName | String | Yes | `"Подтягивания"` |
| exerciseType | String | Yes | `"pull-ups"` |

### Implementation Approach

1. **Single doPost Handler**: All requests route through `doPost(e)` function
2. **Action-Based Routing**: Extract `action` field from JSON, switch/case to appropriate handler
3. **Validation Layer**: Each handler validates inputs before Sheets operations
4. **Error Handling**: Try-catch blocks with structured error responses
5. **UUID Generation**: Use `Utilities.getUuid()` for server-side ID generation
6. **Sheet Access**: Use `SpreadsheetApp.getActiveSpreadsheet().getSheetByName()`
7. **Row Operations**: Use `appendRow()` for create, `getDataRange()` + loop for read/update/delete

### Dependencies

- Google Apps Script (built-in)
- SpreadsheetApp service (built-in)
- Utilities service (built-in)
- No external libraries required

### Deployment

1. Open test Google Sheets: (user has created copy)
2. Extensions → Apps Script
3. Paste generated code into Code.gs
4. Deploy → New deployment → Web app
5. Execute as: Me
6. Who has access: Anyone (MVP phase - no auth)
7. Copy deployment URL to frontend WEBAPP_URL (index.html line 748)

### Testing Plan

**Phase 1: Postman/Curl Testing**
- Test each endpoint individually
- Verify request/response structure matches API contract
- Test validation errors (missing fields, invalid dates)
- Test edge cases (non-existent IDs, empty sheets)

**Phase 2: Integration Testing**
- Update frontend WEBAPP_URL
- Test goal creation: offline → sync → verify in Sheets
- Test goal editing: edit goal → sync → verify changes
- Test goal deletion: delete → sync → verify row removed
- Test initial load: refresh app → verify goals fetched
- Test exercise dropdown: open create modal → verify exercises loaded

**Phase 3: Error Scenarios**
- Disconnect internet → create goal → reconnect → sync (should succeed)
- Edit non-existent goal → sync (should show error)
- Create duplicate goal → sync twice (should be idempotent)

## References

- **API Contract**: `specs/003-goal-fixes-and-creation/contracts/google-apps-script-api.md`
- **Frontend Implementation**: `index.html` (Feature 003)
- **Project Constitution**: `CLAUDE.md`
- **Test Deployment**: https://script.google.com/macros/s/AKfycbxTKZWnMPQZZpEm9egEEw43fXbyD_AxiYzFUxjqLmBez_BZ08fWA-IXVOnNmhzpSdYGoQ/exec
