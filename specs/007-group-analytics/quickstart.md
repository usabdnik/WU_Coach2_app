# Quickstart Guide: Аналитика по группам и показателям

**Feature**: 007-group-analytics  
**Date**: 2025-11-23  
**For**: Developers and testers

---

## Overview

This guide helps you understand, test, and debug the Group Analytics feature in under 10 minutes.

**What this feature does**:
- Displays statistics about training groups (М-19, М-117, etc.)
- Shows how many athletes are in each group
- Lists athletes without an assigned group
- Visualizes performance statistics by group and exercise
- Allows assigning groups to athletes from "No Group" list

---

## Quick Setup (1 minute)

### Prerequisites
- Safari iOS 15+ or Chrome Android 10+ (mobile browser)
- Project running locally: Open `index.html` in browser
- Test data: At least 5-10 athletes with performances

### First Time Setup
```bash
# 1. Open index.html in mobile browser
open index.html  # macOS
# OR drag file to Chrome DevTools device mode

# 2. Verify bottom navigation bar shows 4 buttons:
#    👤 Спортсмены | 🎯 Цели | 📊 Аналитика | ⚙️ Настройки
```

---

## Testing Scenarios (5 minutes)

### Test 1: View Group Cards (User Story 1)

**Steps**:
1. Tap **📊 Аналитика** button in bottom navigation
2. Wait for analytics page to load (should be <2 seconds)
3. Verify group cards display:
   - М-19: [count] спортсменов
   - М-117: [count] спортсменов
   - М-118: [count] спортсменов
   - А-29: [count] спортсменов
   - А-218: [count] спортсменов
   - А-219: [count] спортсменов
   - Без группы: [count] спортсменов (if any)

**Expected Result**:
- ✅ All 6 active groups displayed
- ✅ Counts match actual athlete data
- ✅ "Без группы" card shows if athletes with null group exist
- ✅ Cards are touch-optimized (44x44px minimum)

**Screenshot Location**: (Take screenshot and save to `docs/screenshots/007-group-cards.png`)

---

### Test 2: View Exercise Statistics (User Story 2)

**Steps**:
1. On analytics page, find exercise selector dropdown
2. Select exercise: **Подтягивания** (Pull-ups)
3. Wait for statistics to calculate (<2 seconds)
4. Verify table/chart displays for each group:
   - Количество спортсменов: [number with results]
   - Средний результат: [average value] раз
   - Лучший результат: [max value] раз
   - Худший результат: [min value] раз

**Expected Result**:
- ✅ Statistics calculated correctly (verify manually with 2-3 athletes)
- ✅ Groups with no data show "Нет данных"
- ✅ Only current season data included (Sept-Aug)
- ✅ Units displayed correctly (раз/кг/сек based on exercise)

**Test Data Verification**:
```javascript
// Open browser console and run:
const performances = JSON.parse(localStorage.getItem('performancesData'));
const athletes = JSON.parse(localStorage.getItem('athletesData'));

// Check М-19 group average for Подтягивания
const m19Athletes = athletes.filter(a => a.group === 'М-19').map(a => a.id);
const m19Pullups = performances.filter(p => 
  m19Athletes.includes(p.athlete_id) && 
  p.exercise_name === 'Подтягивания'
);
const average = m19Pullups.reduce((sum, p) => sum + p.value, 0) / m19Pullups.length;
console.log('Expected average:', average);
// Compare with displayed average in UI
```

---

### Test 3: Assign Group to Athlete (User Story 3)

**Steps**:
1. Tap on **Без группы** card (only if count > 0)
2. Modal opens with list of athletes without group
3. Tap on an athlete name (e.g., "Иванов Иван")
4. Group selector appears with dropdown: М-19, М-117, etc.
5. Select **М-19**
6. Tap **Сохранить**

**Expected Result**:
- ✅ Modal closes automatically
- ✅ "Без группы" count decreases by 1
- ✅ М-19 count increases by 1
- ✅ Pending indicator **⏳** appears (unsaved changes)
- ✅ localStorage updated immediately
- ✅ Change added to `pendingChanges` queue

**Verification**:
```javascript
// Check localStorage was updated
const athletes = JSON.parse(localStorage.getItem('athletesData'));
const athlete = athletes.find(a => a.name === 'Иван' && a.surname === 'Иванов');
console.log(athlete.group); // Should be 'М-19'

// Check pendingChanges queue
const pending = JSON.parse(localStorage.getItem('pendingChanges'));
console.log(pending); // Should contain athlete update
```

---

### Test 4: Offline Mode (Success Criteria SC-005)

**Steps**:
1. Open analytics page with internet ON
2. Enable **Airplane Mode** on device
3. Navigate back to Спортсмены view
4. Navigate back to Аналитика view
5. Select different exercise
6. View statistics

**Expected Result**:
- ✅ Page loads from localStorage (no network errors)
- ✅ All data displays correctly
- ✅ Statistics calculate properly
- ✅ No "No internet" errors
- ✅ Pending indicator **⏳** visible for unsaved changes

---

### Test 5: Sync to Supabase (FR-010)

**Steps**:
1. Assign group to athlete (from Test 3)
2. Verify **⏳** pending indicator shows
3. Tap **Синхронизация** button (or wait for auto-sync if enabled)
4. Verify network request succeeds
5. Verify pending indicator disappears

**Expected Result**:
- ✅ POST request to Supabase succeeds (check Network tab)
- ✅ `pendingChanges` queue cleared
- ✅ **⏳** indicator removed
- ✅ Data persists after page refresh

**Debug Commands**:
```javascript
// Manually trigger sync (open console)
await syncPendingChangesToSupabase();

// Check Supabase directly
const { data, error } = await supabaseClient
  .from('athletes')
  .select('group')
  .eq('id', 'ATHLETE_ID');
console.log(data); // Should show updated group
```

---

## Common Issues & Debugging

### Issue 1: Group cards not showing

**Symptoms**: Analytics page blank or only header visible

**Debug Steps**:
```javascript
// 1. Check localStorage has data
const athletes = JSON.parse(localStorage.getItem('athletesData'));
console.log('Total athletes:', athletes?.length);

// 2. Check group field values
const groups = athletes.map(a => a.group);
console.log('Unique groups:', [...new Set(groups)]);

// 3. Check AVAILABLE_GROUPS constant in code
console.log(AVAILABLE_GROUPS); // Should be ['М-19', 'М-117', ...]
```

**Solution**: 
- Ensure `athletesData` exists in localStorage
- Verify `group` field is populated (not all null)
- Check `renderGroupCards()` function called on page load

---

### Issue 2: Statistics show "Нет данных" for all groups

**Symptoms**: All groups display "No data" message despite having athletes

**Debug Steps**:
```javascript
// 1. Check performances data exists
const performances = JSON.parse(localStorage.getItem('performancesData'));
console.log('Total performances:', performances?.length);

// 2. Check season range
const season = getCurrentSeason();
console.log('Current season:', season); // Should be {start: '2024-09', end: '2025-08'}

// 3. Check performances have correct month format
const months = performances.map(p => p.month);
console.log('Performance months:', months.slice(0, 5)); // Should be 'YYYY-MM'
```

**Solution**:
- Ensure `performancesData` populated with current season data
- Verify `month` field format is 'YYYY-MM'
- Check `getCurrentSeason()` returns correct date range

---

### Issue 3: Touch targets too small on mobile

**Symptoms**: Hard to tap buttons on actual device

**Debug Steps**:
```css
/* Add temporary debug styles in browser DevTools */
.group-card, .exercise-selector button {
  outline: 2px solid red !important;
}
/* Verify minimum 44x44px size */
```

**Solution**:
- Increase button `min-width` and `min-height` to 44px
- Add `padding: 12px 20px` for comfortable touch area
- Test on real device, not just DevTools emulator

---

### Issue 4: Statistics calculation slow (>2 seconds)

**Symptoms**: Noticeable lag when selecting exercise

**Debug Steps**:
```javascript
// Measure calculation time
console.time('stats');
const stats = calculateGroupStatistics('М-19', 'Подтягивания');
console.timeEnd('stats'); // Should be <50ms

// Check data size
const performances = JSON.parse(localStorage.getItem('performancesData'));
console.log('Performance count:', performances.length); // Should be <10,000
```

**Solution**:
- Add debouncing to exercise selector (wait 300ms after selection)
- Optimize filter logic (reduce multiple passes through data)
- Consider memoization if recalculating same exercise repeatedly

---

## Manual Testing Checklist

Use this checklist for comprehensive testing:

### Visual Design (Mobile)
- [ ] Dark theme colors applied (#0f1117, #1a1d29, #4c9eff)
- [ ] All text in Russian (no English UI text)
- [ ] Touch targets minimum 44x44px
- [ ] Scrollable containers have smooth scroll
- [ ] Loading indicators show during calculations

### Functionality
- [ ] Group cards display correct counts
- [ ] "Без группы" card shows if applicable
- [ ] Exercise dropdown populated with all exercises
- [ ] Statistics calculate correctly (spot check 2-3 groups)
- [ ] Group assignment saves to localStorage
- [ ] Pending changes indicator (⏳) displays
- [ ] Sync button uploads to Supabase

### Offline Mode
- [ ] Page loads in airplane mode
- [ ] Statistics work offline
- [ ] Group assignments save locally
- [ ] No network errors in console

### Edge Cases
- [ ] Empty group (0 athletes) displays "0 спортсменов"
- [ ] Exercise with no performances shows "Нет данных"
- [ ] Null group field handled (shows in "Без группы")
- [ ] Empty string group field treated as null

### Performance
- [ ] Page load <2 seconds on 3G
- [ ] Statistics calculation <2 seconds
- [ ] Touch response <100ms
- [ ] No browser freezing/lag

---

## Development Tips

### Adding Test Data Quickly
```javascript
// Run in browser console to add test athletes
const testAthletes = [
  {id: 'test1', name: 'Тест', surname: 'Один', group: 'М-19'},
  {id: 'test2', name: 'Тест', surname: 'Два', group: 'М-19'},
  {id: 'test3', name: 'Тест', surname: 'Три', group: 'М-117'},
  {id: 'test4', name: 'Тест', surname: 'Четыре', group: null}, // No group
];

const athletes = JSON.parse(localStorage.getItem('athletesData')) || [];
athletes.push(...testAthletes);
localStorage.setItem('athletesData', JSON.stringify(athletes));
location.reload();
```

### Viewing Calculated Statistics
```javascript
// Get statistics for all groups for one exercise
function debugExerciseStats(exerciseName) {
  const groups = ['М-19', 'М-117', 'М-118', 'А-29', 'А-218', 'А-219'];
  const stats = groups.map(g => calculateGroupStatistics(g, exerciseName));
  console.table(stats);
}

debugExerciseStats('Подтягивания');
```

### Resetting Test State
```javascript
// Clear all pending changes
localStorage.removeItem('pendingChanges');

// Reset an athlete's group
const athletes = JSON.parse(localStorage.getItem('athletesData'));
athletes[0].group = null; // Set first athlete to no group
localStorage.setItem('athletesData', JSON.stringify(athletes));
location.reload();
```

---

## Next Steps

After quickstart testing:

1. **Review implementation**: Read `specs/007-group-analytics/plan.md`
2. **Generate tasks**: Run `/speckit.tasks` command
3. **Start development**: Follow tasks.md step-by-step
4. **Iterative testing**: Test after each major task completion
5. **Final validation**: Complete all checklist items above

---

## Support

**Stuck?** Check these resources:
- `CLAUDE.md` - Project development guide
- `.specify/memory/constitution.md` - Architecture rules
- `specs/007-group-analytics/research.md` - Technical decisions
- `specs/007-group-analytics/data-model.md` - Data structures

**Found a bug?** Document in GitHub issues with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/device details
- Console errors (if any)

---

**Quickstart Complete** - You're ready to test or develop Feature 007! 🚀
