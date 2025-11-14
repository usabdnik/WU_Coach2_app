# Phase 7: Manual Testing Instructions - Rank End Recording

## Status: TESTED & WORKING ✅

**Git Commits:**
- 7c8e21d: Add: Phase 7 (US5) - Season End Rank Recording
- 8ce03a1: Update: SESSION_CONTEXT.md - Phase 7 code complete

**Progress:** 53/95 tasks (56%)

---

## What Was Implemented

### Code Changes (T066-T070)
1. **rank_end dropdown** added to `recordsModal` (index.html lines 914-928)
2. **formatRankDisplay()** already supports progression arrow (line 1838-1864)
3. **Athlete profile** already shows rank progression (line 1895)
4. **editRecords()** loads rank_end into form (line 2081)
5. **recordsForm submit** persists rank_end (lines 2843-2844, 2873)
6. **syncPendingChangesToSupabase()** syncs rank_end to Supabase (lines 2380-2383)
7. **transformSupabaseAthlete()** handles rank_end from Supabase (line 2186)

### Expected Behavior
- Edit athlete → See two rank dropdowns: "Разряд (начало сезона)" and "Разряд (конец сезона)"
- Both dropdowns have same options: (Не указано), Без разряда, 9 ranks
- When both ranks set → Profile shows progression with arrow: "🥉 I юношеский ➡️ 🥈 III взрослый"
- When only start OR only end → Profile shows single rank without arrow
- When neither set → Profile shows "(Не указано)"
- Offline-first: saves to localStorage immediately, syncs to Supabase on "Синхронизировать"

---

## Testing Environment Setup

### Prerequisites
- PostgreSQL@15 installed ✅ (installed via Homebrew)
- Supabase project running (mjkssesvhowmncyctmvs)
- `index.html` file updated with Phase 7 code

### Open in Browser
```bash
# Option 1: Open directly in Safari
open index.html

# Option 2: Open in Chrome
open -a "Google Chrome" index.html

# Best: Test on real mobile device (Safari iOS or Chrome Android)
# Transfer index.html to device and open
```

---

## Test Scenarios (T071-T076)

### T071: Test Rank Progression (Different Start/End)
**Scenario:** Edit athlete, set rank_start = "I юношеский разряд", rank_end = "III взрослый разряд", save

**Expected Result:**
- Profile shows: "🥉 I юношеский разряд ➡️ 🥈 III взрослый разряд"
- Arrow (➡️) visible between ranks
- Different emoji icons for each rank
- Data persists after page refresh

**How to Test:**
1. Open index.html in browser
2. Click any athlete card
3. Click edit button (✏️) next to "Спортивный разряд"
4. Set "Разряд (начало сезона)" → "I юношеский разряд"
5. Set "Разряд (конец сезона)" → "III взрослый разряд"
6. Click "Сохранить"
7. Verify alert: "✅ Показатели сохранены локально!"
8. Close modal, re-open athlete profile
9. Check "Спортивный разряд" section shows progression with arrow
10. Refresh page (Cmd+R or F5)
11. Re-open athlete profile
12. Verify rank progression still displays correctly

**Pass Criteria:** ✅ Progression displays with arrow, persists after refresh

---

### T072: Test Rank Maintenance (Same Start/End)
**Scenario:** Edit athlete, set rank_start = rank_end = "II взрослый разряд", save

**Expected Result:**
- Profile shows: "🥈 II взрослый разряд ➡️ 🥈 II взрослый разряд"
- Arrow still visible (both ranks set)
- Same emoji icon for both ranks
- Data persists after page refresh

**How to Test:**
1. Click athlete card
2. Click edit button (✏️) next to "Спортивный разряд"
3. Set "Разряд (начало сезона)" → "II взрослый разряд"
4. Set "Разряд (конец сезона)" → "II взрослый разряд"
5. Click "Сохранить"
6. Verify rank displays with arrow (maintenance scenario)
7. Refresh page and verify persistence

**Pass Criteria:** ✅ Arrow displays even when ranks are identical, persists after refresh

---

### T073: Test Rank End Only (No Start)
**Scenario:** Edit athlete, leave rank_start empty, set rank_end = "КМС", save

**Expected Result:**
- Profile shows: "🥇 КМС"
- NO arrow (only end rank set)
- Single rank display
- Data persists after page refresh

**How to Test:**
1. Click athlete card
2. Click edit button (✏️)
3. Set "Разряд (начало сезона)" → "(Не указано)" (leave empty)
4. Set "Разряд (конец сезона)" → "КМС"
5. Click "Сохранить"
6. Verify only end rank displays, no arrow
7. Refresh page and verify persistence

**Pass Criteria:** ✅ Only end rank displays without arrow, persists after refresh

---

### T074: Test Progression Arrow Display
**Scenario:** Verify visual formatting of progression arrow

**Expected Result:**
- Arrow is ➡️ emoji character
- Proper spacing: "rank_start ➡️ rank_end"
- Icons match rank level (🔰 🥉 🥈 🥇 🏆)
- Readable on dark theme (#fff text on #1a1d29 background)

**How to Test:**
1. Set rank_start = "III юношеский разряд" and rank_end = "МС"
2. Verify display: "🥉 III юношеский разряд ➡️ 🏆 МС"
3. Check visual spacing and readability
4. Verify color contrast (white text on dark background)

**Pass Criteria:** ✅ Arrow displays correctly, icons match ranks, readable contrast

---

### T075: Test Single Rank Display (No Arrow)
**Scenario:** Verify that only start OR only end rank displays without arrow

**Expected Result (Start Only):**
- Profile shows: "🥇 I взрослый разряд"
- NO arrow

**Expected Result (End Only):**
- Profile shows: "🏆 МСМК"
- NO arrow

**How to Test:**
1. **Test Start Only:**
   - Set rank_start = "I взрослый разряд"
   - Set rank_end = "(Не указано)" (leave empty)
   - Save and verify no arrow displays

2. **Test End Only:**
   - Set rank_start = "(Не указано)" (leave empty)
   - Set rank_end = "МСМК"
   - Save and verify no arrow displays

**Pass Criteria:** ✅ Single rank displays without arrow in both scenarios

---

### T076: Test NULL/Empty Selection
**Scenario:** Verify both rank fields allow empty selection (NULL)

**Expected Result:**
- Can select "(Не указано)" in both dropdowns
- Profile shows: "(Не указано)" (grey text)
- No crash or error
- Data persists as NULL in database

**How to Test:**
1. Edit athlete with existing ranks
2. Set both "Разряд (начало сезона)" and "Разряд (конец сезона)" to "(Не указано)"
3. Click "Сохранить"
4. Verify profile shows "(Не указано)" in grey text
5. Re-open edit modal
6. Verify both dropdowns show "(Не указано)" selected
7. Refresh page and verify persistence

**Pass Criteria:** ✅ Both fields accept NULL, display correctly, persist after refresh

---

## Supabase Sync Testing

### Online Sync Test
1. Complete all above tests in **offline mode** (disconnect internet)
2. Verify all changes saved to localStorage (check browser DevTools → Application → Local Storage)
3. Reconnect internet
4. Click "Синхронизировать" button in PWA
5. Wait for sync to complete (success message)
6. Check Supabase Studio → athletes table
7. Verify rank_start and rank_end columns updated correctly

**Pass Criteria:** ✅ All rank changes sync to Supabase successfully

---

## Verification Checklist

After completing all tests, verify:

- [ ] **T071:** Rank progression with arrow works ✅
- [ ] **T072:** Rank maintenance (same ranks) works ✅
- [ ] **T073:** End rank only (no start) works ✅
- [ ] **T074:** Progression arrow displays correctly ✅
- [ ] **T075:** Single rank displays without arrow ✅
- [ ] **T076:** NULL/empty selection works ✅
- [ ] **Offline:** Changes save to localStorage immediately ✅
- [ ] **Online:** Changes sync to Supabase successfully ✅
- [ ] **Persistence:** All data survives page refresh ✅
- [ ] **Visual:** Rank icons match levels (🔰 🥉 🥈 🥇 🏆) ✅
- [ ] **UX:** No crashes, errors, or broken functionality ✅

---

## Known Issues

✅ **No issues found** - All test scenarios passed successfully!

---

## After Testing Complete

1. Update SESSION_CONTEXT.md:
   - Change Phase 7 status from "CODE COMPLETE, NEEDS TESTING" to "TESTED & WORKING ✅"
   - Update progress: 53/95 → 59/95 tasks (62%)

2. Git commit test results:
   ```bash
   git add .
   git commit -m "Test: Phase 7 manual testing complete - all scenarios pass"
   ```

3. Proceed to **Phase 5** (Subscription Filter) OR **Phase 8** (Polish & Documentation)

---

## Contact

If issues found during testing, document in this file and notify project owner.

**Last Updated:** 2025-11-12
**Tester:** Project Owner
**Test Date:** 2025-11-12
**Test Result:** ✅ PASS - All scenarios working correctly
