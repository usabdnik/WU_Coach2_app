/**
 * WU Coach 2 - Goals API Backend
 * Google Apps Script Web App for Goal Management
 *
 * Feature: 001-goals-api-backend
 * API Contract: specs/003-goal-fixes-and-creation/contracts/google-apps-script-api.md
 *
 * Endpoints:
 * - getExercises: Return all exercises for dropdown
 * - getGoals: Return all goals for app state
 * - createGoal: Create new goal with server UUID
 * - editGoal: Update existing goal fields
 * - deleteGoal: Hard delete goal from sheet
 */

/**
 * Main HTTP POST handler
 * Routes requests based on action field
 */
function doPost(e) {
  try {
    // Parse JSON request body
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    console.log(`📥 Request received: action=${action}`);

    // Route to appropriate handler
    let result;
    switch (action) {
      case 'getExercises':
        result = handleGetExercises();
        break;
      case 'getGoals':
        result = handleGetGoals();
        break;
      case 'createGoal':
        result = handleCreateGoal(requestData.goalData);
        break;
      case 'editGoal':
        result = handleEditGoal(requestData.goalId, requestData.changes);
        break;
      case 'deleteGoal':
        result = handleDeleteGoal(requestData.goalId);
        break;
      default:
        throw new Error(`Неизвестное действие: ${action}`);
    }

    console.log(`✅ Success: action=${action}`);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    const errorResponse = {
      success: false,
      error: error.message,
      details: error.stack
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// HANDLER: Get All Exercises
// ============================================================================

/**
 * Fetch all exercises from Exercises sheet
 * Returns array of exercise objects for dropdown population
 */
function handleGetExercises() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Exercises');

  if (!sheet) {
    throw new Error('Лист Exercises не найден. Создайте лист с названием "Exercises".');
  }

  const data = sheet.getDataRange().getValues();

  // Empty sheet (only header row) - return empty array
  if (data.length <= 1) {
    return {
      success: true,
      exercises: []
    };
  }

  // Parse rows into exercise objects
  const exercises = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    exercises.push({
      exerciseId: row[0],
      exerciseName: row[1],
      exerciseType: row[2]
    });
  }

  console.log(`✅ Fetched ${exercises.length} exercises`);
  return {
    success: true,
    exercises: exercises
  };
}

// ============================================================================
// HANDLER: Get All Goals
// ============================================================================

/**
 * Fetch all goals from Goals sheet
 * Returns array of goal objects for app state refresh
 */
function handleGetGoals() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Goals');

  if (!sheet) {
    throw new Error('Лист Goals не найден. Создайте лист с названием "Goals".');
  }

  const data = sheet.getDataRange().getValues();

  // Empty sheet (only header row) - return empty array
  if (data.length <= 1) {
    return {
      success: true,
      goals: []
    };
  }

  // Parse rows into goal objects
  const goals = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    goals.push({
      goalId: row[0],
      studentId: row[1],
      studentName: row[2],
      exerciseId: row[3],
      exerciseName: row[4],
      startDate: row[5],
      endDate: row[6],
      description: row[7] || '',
      targetValue: row[8] || null,
      notes: row[9] || '',
      status: row[10] || 'active',
      createdAt: row[11],
      updatedAt: row[12] || null
    });
  }

  console.log(`✅ Fetched ${goals.length} goals`);
  return {
    success: true,
    goals: goals
  };
}

// ============================================================================
// HANDLER: Create Goal
// ============================================================================

/**
 * Create new goal with server-generated UUID
 * Validates input, checks for duplicates, appends to Goals sheet
 */
function handleCreateGoal(goalData) {
  // Validation
  validateGoalData(goalData);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Goals');

  if (!sheet) {
    throw new Error('Лист Goals не найден. Создайте лист с названием "Goals".');
  }

  // Generate server UUID
  const serverId = Utilities.getUuid();

  // Check for duplicate (idempotent operation)
  // If client retries, check if this exact goal already exists
  const existingGoalId = findGoalByClientData(sheet, goalData);
  if (existingGoalId) {
    console.log(`⚠️ Duplicate createGoal request detected, returning existing ID: ${existingGoalId}`);
    return {
      success: true,
      serverId: existingGoalId,
      message: 'Цель успешно создана'
    };
  }

  // Append new row
  sheet.appendRow([
    serverId,                          // goalId
    goalData.studentId,                // studentId
    goalData.studentName,              // studentName
    goalData.exerciseId,               // exerciseId
    goalData.exerciseName,             // exerciseName
    goalData.startDate,                // startDate
    goalData.endDate,                  // endDate
    goalData.description || '',        // description (optional)
    goalData.targetValue || null,      // targetValue (optional)
    goalData.notes || '',              // notes (optional)
    goalData.status || 'active',       // status
    goalData.createdAt,                // createdAt
    null                               // updatedAt (null on creation)
  ]);

  console.log(`✅ Goal created: ${serverId}`);
  return {
    success: true,
    serverId: serverId,
    message: 'Цель успешно создана'
  };
}

/**
 * Find goal by matching client data (for idempotency check)
 */
function findGoalByClientData(sheet, goalData) {
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Match by studentId + exerciseId + startDate + endDate
    // This combination is unique enough to detect duplicates
    if (row[1] === goalData.studentId &&
        row[3] === goalData.exerciseId &&
        row[5] === goalData.startDate &&
        row[6] === goalData.endDate) {
      return row[0]; // Return existing goalId
    }
  }

  return null; // No duplicate found
}

// ============================================================================
// HANDLER: Edit Goal
// ============================================================================

/**
 * Update existing goal fields (partial update)
 * Only modifies fields present in changes object
 */
function handleEditGoal(goalId, changes) {
  // Validation
  if (!goalId) {
    throw new Error('goalId обязателен для редактирования');
  }

  if (!changes || Object.keys(changes).length === 0) {
    throw new Error('changes объект не может быть пустым');
  }

  // Require at least one field besides updatedAt
  const dataFields = Object.keys(changes).filter(key => key !== 'updatedAt');
  if (dataFields.length === 0) {
    throw new Error('Необходимо указать хотя бы одно поле для изменения (кроме updatedAt)');
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Goals');

  if (!sheet) {
    throw new Error('Лист Goals не найден');
  }

  // Find goal row by goalId
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === goalId) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Цель с ID "${goalId}" не найдена`);
  }

  // Validate date logic if dates are being changed
  const currentRow = data[rowIndex - 1];
  const newStartDate = changes.startDate || currentRow[5];
  const newEndDate = changes.endDate || currentRow[6];

  if (newEndDate < newStartDate) {
    throw new Error('Дата окончания не может быть раньше даты начала');
  }

  // Update fields
  const columnMap = {
    startDate: 6,      // Column F
    endDate: 7,        // Column G
    description: 8,    // Column H
    targetValue: 9,    // Column I
    notes: 10,         // Column J
    status: 11,        // Column K
    updatedAt: 13      // Column M
  };

  for (const field in changes) {
    if (columnMap[field]) {
      sheet.getRange(rowIndex, columnMap[field]).setValue(changes[field]);
    }
  }

  console.log(`✅ Goal edited: ${goalId}`);
  return {
    success: true,
    goalId: goalId,
    message: 'Цель обновлена'
  };
}

// ============================================================================
// HANDLER: Delete Goal
// ============================================================================

/**
 * Hard delete goal from Goals sheet
 * Removes row entirely (not soft delete)
 */
function handleDeleteGoal(goalId) {
  // Validation
  if (!goalId) {
    throw new Error('goalId обязателен для удаления');
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Goals');

  if (!sheet) {
    throw new Error('Лист Goals не найден');
  }

  // Find goal row by goalId
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === goalId) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Цель с ID "${goalId}" не найдена или уже удалена`);
  }

  // Delete row
  sheet.deleteRow(rowIndex);

  console.log(`✅ Goal deleted: ${goalId}`);
  return {
    success: true,
    goalId: goalId,
    message: 'Цель удалена'
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate goal data for creation
 * Checks required fields, date logic, description length
 */
function validateGoalData(goalData) {
  const requiredFields = [
    'studentId',
    'studentName',
    'exerciseId',
    'exerciseName',
    'startDate',
    'endDate',
    'createdAt'
  ];

  // Check required fields
  for (const field of requiredFields) {
    if (!goalData[field]) {
      throw new Error(`Поле "${field}" обязательно`);
    }
  }

  // Validate date logic
  if (goalData.endDate < goalData.startDate) {
    throw new Error('Дата окончания не может быть раньше даты начала');
  }

  // Validate description length
  if (goalData.description && goalData.description.length > 200) {
    throw new Error('Описание не может быть длиннее 200 символов');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(goalData.startDate)) {
    throw new Error('startDate должна быть в формате YYYY-MM-DD');
  }
  if (!dateRegex.test(goalData.endDate)) {
    throw new Error('endDate должна быть в формате YYYY-MM-DD');
  }
}

// ============================================================================
// HELPER: Test Function (for manual testing in Apps Script editor)
// ============================================================================

/**
 * Test function - call this from Apps Script editor to verify setup
 * Run > testGetExercises to see if Exercises sheet is readable
 */
function testGetExercises() {
  const result = handleGetExercises();
  console.log('Test result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test function - verify Goals sheet structure
 */
function testGetGoals() {
  const result = handleGetGoals();
  console.log('Test result:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test function - create sample goal
 */
function testCreateGoal() {
  const sampleGoalData = {
    studentId: 'test-student-123',
    studentName: 'Тестовый Атлет',
    exerciseId: 'ex-uuid-pullups',
    exerciseName: 'Подтягивания',
    startDate: '2025-11-10',
    endDate: '2025-12-10',
    description: 'Тестовая цель из Apps Script',
    targetValue: 15,
    notes: 'Создано через testCreateGoal()',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const result = handleCreateGoal(sampleGoalData);
  console.log('Test result:', JSON.stringify(result, null, 2));
  return result;
}
