# API Contract: Google Apps Script Sync Endpoint

**Feature**: 001-goal-editing-athlete-sync
**Endpoint**: `https://script.google.com/macros/s/{SCRIPT_ID}/exec`
**Method**: POST
**Content-Type**: application/json

---

## New Operation: `goal_edit`

### Request Format
```json
{
  "pendingChanges": [
    {
      "type": "goal_edit",
      "goalId": "550e8400-e29b-41d4-a716-446655440000",
      "changes": {
        "startDate": "2025-11-10",
        "endDate": "2025-12-10",
        "description": "12 подтягиваний",
        "targetValue": 12,
        "exerciseType": "pull-ups",
        "updatedAt": "2025-11-03T10:30:00Z"
      }
    }
  ]
}
```

### Response Format (Enhanced)
```json
{
  "success": true,
  "syncSummary": {
    "athletesAdded": 2,
    "athletesRemoved": 1,
    "goalsSynced": 5
  },
  "athletesData": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Иванов Иван",
      "group": "Средняя",
      "order": 1,
      "status": "active",
      "syncedAt": "2025-11-03T10:35:00Z"
    }
  ],
  "exercisesData": [...],
  "goalsData": [...]
}
```

### Google Sheets Schema Updates

**Athletes Sheet** (add ID column):
```
Column A: ID (UUID, auto-generated if empty by Apps Script)
Column B: Name
Column C: Group
```

**Goals Sheet** (NEW):
```
Column A: ID
Column B: Athlete ID
Column C: Start Date
Column D: End Date
Column E: Description
Column F: Target Value
Column G: Exercise Type
Column H: Status
Column I: Created At
Column J: Updated At
Column K: Completed At
```

### Apps Script Implementation Snippet
```javascript
function handleGoalEdit(operation) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Goals');
  const goalId = operation.goalId;
  const changes = operation.changes;

  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[0] === goalId);

  if (rowIndex === -1) {
    return handleGoalCreate(operation); // Goal not found, re-create
  }

  // Update changed fields
  if (changes.startDate) sheet.getRange(rowIndex + 1, 3).setValue(changes.startDate);
  if (changes.endDate) sheet.getRange(rowIndex + 1, 4).setValue(changes.endDate);
  if (changes.description) sheet.getRange(rowIndex + 1, 5).setValue(changes.description);
  sheet.getRange(rowIndex + 1, 10).setValue(changes.updatedAt);

  return { success: true, goalId };
}
```
