# Goals API Backend - Quick Start Guide

**Feature**: 001-goals-api-backend
**Date**: 2025-11-04
**Target**: Google Apps Script deployment

---

## Overview

This guide shows you how to deploy the Goals API backend to your test Google Sheets and integrate it with the Feature 003 frontend.

**Deployment Time**: ~10 minutes
**Prerequisites**: Google account with Sheets access

---

## Step 1: Prepare Google Sheets

### 1.1 Open Your Test Spreadsheet

You mentioned you created a copy with this deployment URL:
```
https://script.google.com/macros/s/AKfycbxTKZWnMPQZZpEm9egEEw43fXbyD_AxiYzFUxjqLmBez_BZ08fWA-IXVOnNmhzpSdYGoQ/exec
```

Open that Google Sheets file.

### 1.2 Create Goals Sheet

1. Click the **+** button at bottom-left to add new sheet
2. Rename it to exactly: `Goals`
3. Add header row (Row 1) with these columns:

```
goalId | studentId | studentName | exerciseId | exerciseName | startDate | endDate | description | targetValue | notes | status | createdAt | updatedAt
```

**Important**: Column names must match exactly (case-sensitive).

### 1.3 Create Exercises Sheet

1. Add another new sheet
2. Rename it to exactly: `Exercises`
3. Add header row (Row 1):

```
exerciseId | exerciseName | exerciseType
```

4. Add sample exercise data (Row 2+):

| exerciseId | exerciseName | exerciseType |
|-----------|--------------|--------------|
| ex-uuid-pullups | Подтягивания | pull-ups |
| ex-uuid-pushups | Отжимания | push-ups |
| ex-uuid-dips | Брусья | dips |
| ex-uuid-squats | Приседания | squats |
| ex-uuid-running | Бег | running |

**Note**: You can add more exercises later. These are just for testing.

---

## Step 2: Deploy Apps Script Code

### 2.1 Open Apps Script Editor

1. In your Google Sheets, go to: **Extensions → Apps Script**
2. You'll see Code.gs file (may have existing code)
3. **Delete all existing code** or create a new file for this deployment

### 2.2 Paste the Code

Copy the complete Google Apps Script code from `Code.gs` file in this directory and paste it into the Apps Script editor.

**File location**: `specs/001-goals-api-backend/Code.gs`

### 2.3 Save the Project

1. Click the floppy disk icon or press `Cmd+S` (Mac) / `Ctrl+S` (Windows)
2. Name the project: "WU Coach Goals API"

### 2.4 Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "Goals API v1"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone (for MVP testing)
5. Click **Deploy**
6. **Authorize the app**:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" if you see warning
   - Click "Go to WU Coach Goals API (unsafe)" - this is safe, it's your own code
   - Click "Allow"
7. Copy the **Web app URL** - it should be:
   ```
   https://script.google.com/macros/s/AKfycbxTKZWnMPQZZpEm9egEEw43fXbyD_AxiYzFUxjqLmBez_BZ08fWA-IXVOnNmhzpSdYGoQ/exec
   ```

---

## Step 3: Test the API

### 3.1 Test with curl (Terminal/Command Prompt)

**Test getExercises**:
```bash
curl -X POST \
  https://script.google.com/macros/s/AKfycbxTKZWnMPQZZpEm9egEEw43fXbyD_AxiYzFUxjqLmBez_BZ08fWA-IXVOnNmhzpSdYGoQ/exec \
  -H "Content-Type: application/json" \
  -d '{"action": "getExercises"}'
```

**Expected response**:
```json
{
  "success": true,
  "exercises": [
    {"exerciseId": "ex-uuid-pullups", "exerciseName": "Подтягивания", "exerciseType": "pull-ups"},
    ...
  ]
}
```

**Test createGoal**:
```bash
curl -X POST \
  https://script.google.com/macros/s/AKfycbxTKZWnMPQZZpEm9egEEw43fXbyD_AxiYzFUxjqLmBez_BZ08fWA-IXVOnNmhzpSdYGoQ/exec \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createGoal",
    "goalData": {
      "studentId": "test-student-123",
      "studentName": "Тестовый Атлет",
      "exerciseId": "ex-uuid-pullups",
      "exerciseName": "Подтягивания",
      "startDate": "2025-11-10",
      "endDate": "2025-12-10",
      "description": "Тестовая цель",
      "targetValue": 10,
      "notes": "",
      "status": "active",
      "createdAt": "2025-11-04T12:00:00.000Z"
    }
  }'
```

**Expected response**:
```json
{
  "success": true,
  "serverId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "message": "Цель успешно создана"
}
```

**Verify**: Check your Goals sheet - you should see a new row with the goal data!

### 3.2 Test with Postman (Alternative)

1. Open Postman
2. Create new request:
   - Method: POST
   - URL: Your Web App URL
   - Headers: `Content-Type: application/json`
   - Body: Raw JSON (same as curl examples above)
3. Send request
4. Verify response structure matches API contract

---

## Step 4: Integrate with Frontend

### 4.1 Update index.html

Open `index.html` and find line ~748:

```javascript
const WEBAPP_URL = 'https://script.google.com/macros/s/OLD_URL/exec';
```

Replace with your new test URL:

```javascript
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxTKZWnMPQZZpEm9egEEw43fXbyD_AxiYzFUxjqLmBez_BZ08fWA-IXVOnNmhzpSdYGoQ/exec';
```

### 4.2 Test Frontend Integration

1. Open `index.html` in mobile browser (Safari iOS or Chrome Android)
2. Click "Добавить цель" button (⊕ icon in goals section)
3. Fill out the form:
   - Student: Select athlete
   - Exercise: Select exercise (dropdown should populate from Exercises sheet)
   - Start date: Pick date
   - End date: Pick later date
   - Description: "Первая цель через API"
   - Target: 15
4. Click "Создать цель"
5. **Observe**:
   - Goal appears in list with ⏳ pending indicator
   - Sync button shows orange dot (has pending changes)
6. Click sync button
7. **Verify**:
   - Sync completes successfully
   - ⏳ indicator disappears
   - Check Goals sheet - new row with server UUID

### 4.3 Test Goal Editing

1. Click on a goal in the list
2. Edit modal opens
3. Change dates or description
4. Click "Сохранить"
5. Sync changes
6. Verify in Goals sheet - row updated with new values

### 4.4 Test Goal Deletion

1. Click on a goal
2. Click "Удалить цель" button
3. Confirm deletion
4. Sync changes
5. Verify in Goals sheet - row removed

---

## Step 5: Troubleshooting

### API Not Responding

**Symptom**: Fetch errors, timeout errors

**Solutions**:
1. Check Web App URL is correct (no typos)
2. Verify deployment is active: Apps Script → Deploy → Manage deployments
3. Check execution logs: Apps Script → Executions (view errors)
4. Ensure "Who has access" is set to "Anyone"

### Validation Errors

**Symptom**: "Validation failed" responses

**Solutions**:
1. Check required fields are present (studentId, exerciseId, dates)
2. Verify date format is YYYY-MM-DD (not MM/DD/YYYY)
3. Ensure endDate >= startDate
4. Check description length ≤ 200 chars

### Goal Not Found Errors

**Symptom**: 404 errors on editGoal/deleteGoal

**Solutions**:
1. Verify goalId exists in Goals sheet (column A)
2. Check for typos in goalId
3. Ensure goal wasn't already deleted

### Sheet Structure Errors

**Symptom**: "Sheet not found" or data not appearing

**Solutions**:
1. Verify sheet names: `Goals` and `Exercises` (case-sensitive, no spaces)
2. Check header row is Row 1 (not Row 2)
3. Ensure column names match exactly (see Step 1.2, 1.3)
4. Try refreshing spreadsheet

### Authorization Issues

**Symptom**: "Authorization required" or "Access denied"

**Solutions**:
1. Re-authorize: Apps Script → Deploy → Manage deployments → Edit → Authorize
2. Check "Execute as" is set to "Me"
3. Try incognito/private window to clear auth cache

---

## Step 6: Monitoring & Logs

### View Execution Logs

1. Apps Script editor → Left sidebar → Executions (clock icon)
2. See all API requests with timestamps
3. Click on execution to see detailed logs
4. Look for `console.log()` outputs and error stack traces

### Check Quota Usage

1. Apps Script editor → Services → Drive API (or any service)
2. View quotas dashboard
3. Monitor:
   - URL Fetch calls: 20,000/day limit
   - Execution time: 6 minutes/execution limit
   - Concurrent executions: 30 limit

**Note**: For single coach usage, quotas are not a concern.

---

## Step 7: Next Steps

### Production Deployment

When ready for production (not now):

1. **Add Authentication**:
   - Deploy as "Anyone with Google account"
   - Implement email whitelist in doPost
   - Verify coach role

2. **Update Frontend**:
   - Change WEBAPP_URL to production deployment
   - Remove test data from localStorage

3. **Data Migration**:
   - Export test data from test Sheets
   - Import to production Sheets
   - Verify all goals and exercises

4. **Testing**:
   - Full regression testing
   - Mobile device testing (iOS + Android)
   - Offline mode testing

### Future Enhancements

- Soft delete (status: 'cancelled') instead of hard delete
- Batch operations for sync optimization
- Webhook notifications for goal completions
- Data export endpoints (CSV, PDF reports)

---

## API Reference

For complete API specification, see:
- **API Contract**: `specs/003-goal-fixes-and-creation/contracts/google-apps-script-api.md`
- **Feature Spec**: `specs/001-goals-api-backend/spec.md`

### Available Endpoints

| Action | Purpose | Priority |
|--------|---------|----------|
| `getExercises` | Fetch exercise definitions | P2 |
| `getGoals` | Fetch all goals | P1 |
| `createGoal` | Create new goal with server UUID | P1 |
| `editGoal` | Update existing goal fields | P2 |
| `deleteGoal` | Hard delete goal from sheet | P3 |

---

## Support

**Issue Tracker**: Check Apps Script execution logs first
**Documentation**: See API contract and feature spec
**Testing**: Use Postman or curl for isolated endpoint testing

---

**Deployment Status**: ⏳ Ready for deployment
**Last Updated**: 2025-11-04
**Version**: 1.0.0
