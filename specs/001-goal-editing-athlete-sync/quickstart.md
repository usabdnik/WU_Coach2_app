# Implementation Quickstart: Goal Editing & Dynamic Athlete Sync

**Feature**: 001-goal-editing-athlete-sync
**Target File**: `coach-pwa-app (7).html`
**Estimated Addition**: ~250 lines (HTML: 50, CSS: 80, JS: 120)

---

## Implementation Locations

### HTML (Goal Edit Modal)
**Insert after existing modals** (~line 580)

```html
<!-- Goal Edit Modal -->
<div class="modal" id="goalEditModal">
  <div class="modal-content">
    <h2>Редактировать цель</h2>
    <form id="goalEditForm">
      <div class="form-group">
        <label>Дата начала</label>
        <input type="date" id="editGoalStartDate" required>
      </div>
      <!-- ... more fields ... -->
      <button type="submit" class="btn-primary">Сохранить</button>
      <button type="button" class="btn-secondary" onclick="closeGoalEditModal()">Отмена</button>
    </form>
  </div>
</div>
```

### CSS (Modal Styles)
**Insert after existing modal styles** (~line 420)

```css
#goalEditModal .form-group {
  margin-bottom: 15px;
}

.date-input {
  width: 100%;
  height: 48px;
  background: #2a2d3a;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 16px;
}
```

### JavaScript (Edit Functions)
**Insert after existing goal functions** (~line 950)

```javascript
function editGoal(goalId) {
  const goal = goalsData.find(g => g.id === goalId);
  document.getElementById('editGoalStartDate').value = goal.startDate;
  // ... populate other fields ...
  document.getElementById('goalEditModal').classList.add('show');
}

function saveGoalEdit(goalId, changes) {
  const goal = goalsData.find(g => g.id === goalId);
  Object.assign(goal, changes);
  goal.updatedAt = new Date().toISOString();

  localStorage.setItem('goalsData', JSON.stringify(goalsData));
  addGoalEditToQueue(goalId, changes);
  renderGoals();
}
```

---

## Testing Checklist

- [ ] Open goal edit modal (tap goal card)
- [ ] Edit dates (start date, end date)
- [ ] Validate end date > start date
- [ ] Edit description (text input)
- [ ] Edit target value (number input)
- [ ] Save edits (localStorage + pendingChanges)
- [ ] Verify pending indicator appears (⏳)
- [ ] Test offline editing (airplane mode)
- [ ] Sync to Google Sheets (online)
- [ ] Verify changes persist after reload

---

## Rollback Procedure

```bash
# If implementation breaks, rollback to main:
git checkout main -- "coach-pwa-app (7).html"

# Or reset specific sections:
git diff main -- "coach-pwa-app (7).html"
# Manually revert problematic sections
```

---

## Constitution Compliance Final Check

- ✅ Single HTML file (no new files created)
- ✅ Zero dependencies (vanilla JS only)
- ✅ Offline-first (localStorage + pendingChanges queue)
- ✅ Mobile-only (48px touch targets, native date picker)
- ✅ Dark theme (existing color palette)
- ✅ Russian language (all UI text)

---

##Next Steps

1. **Review** all design artifacts (research.md, data-model.md, contracts/, this file)
2. **Run** `/speckit.tasks` to generate actionable task breakdown
3. **Implement** tasks in priority order (P1 → P2 → P3)
4. **Test** manually on real mobile device
5. **Commit** to feature branch with descriptive message
6. **Merge** to main after testing complete
