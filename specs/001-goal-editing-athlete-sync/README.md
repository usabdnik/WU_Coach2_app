# Feature 001: Goal Editing & Dynamic Athlete Sync

## Quick Summary

**Status**: Draft Specification Complete ✅
**Branch**: `001-goal-editing-athlete-sync`
**Created**: 2025-11-03
**Priority**: P1 (MVP - Goal Date Editing), P2 (Full Goal Editing), P3 (Dynamic Athlete Sync)

## User Request (Original)

> "Нужно что бы была возможность Добавлять редактировать цели, например дату начала или окончания. Ну и далее что бы я мог подключить таблицу с реальными даннными ФИО учеников (нужно предусмотреть что таблица будет меняться какие то люди будут добавлять а какие то убираться то список спортсменов и его порядок будет в таблице динамически меняться)"

**Translation**: Need ability to add/edit goals, for example start date or end date. And also to connect table with real student name data (need to account for table changes - people being added/removed, athlete list and order will dynamically change).

## What This Feature Delivers

### User Story 1: Редактирование дат целей (P1 - MVP) 🎯

**Problem**: Currently coach must delete and recreate entire goal just to change a date.

**Solution**: Tap goal → edit modal opens → change start/end dates → save → changes persist offline and sync.

**Value**: Immediate usability improvement for most common edit scenario.

### User Story 2: Полное редактирование целей (P2)

**Problem**: Can't update goal description, target value, or exercise type after creation.

**Solution**: Edit any goal field (description, target, exercise type) in same modal.

**Value**: Full flexibility in goal management without workarounds.

### User Story 3: Динамическая синхронизация списка спортсменов (P3)

**Problem**: When athletes are added/removed in Google Sheets, coach must manually manage app list.

**Solution**: Sync button automatically adds new athletes, removes departed athletes, updates order to match Sheets, preserves all historical data.

**Value**: Single source of truth (Sheets) for roster, automatic synchronization, zero manual maintenance.

## Key Technical Decisions

### Goal Entity Enhancements
- Add `updatedAt` timestamp (track last edit)
- Make all fields editable except `id` and `createdAt`
- Validation: endDate must be after startDate

### Athlete Entity Enhancements
- Add stable `id` field (track across syncs)
- Add `status` field ("active" | "inactive")
- Add `order` field (match Google Sheets row order)
- Add `syncedAt` timestamp
- Add `deactivatedAt` timestamp (when removed from Sheets)

### Sync Strategy
- **Athlete list**: Google Sheets is master (Sheets wins)
- **Performance data**: Local app is master (local wins)
- **Goals**: Local app is master (pendingChanges[] uploads)
- New athletes: create with empty performance data
- Removed athletes: mark inactive, preserve all data in "Архив" (Archive) view

## Constitution Compliance Check ✅

- ✅ **Single-File Architecture**: All changes within `coach-pwa-app (7).html`
- ✅ **Zero Dependencies**: No libraries needed (vanilla JS date pickers, manual sync)
- ✅ **Offline-First**: Edit goals offline → queue in pendingChanges[] → sync when online
- ✅ **Mobile-Only**: Touch-optimized modal, date pickers, 48px touch targets
- ✅ **Fixed Dark Theme**: Reuse existing modal styles, official color palette
- ✅ **Russian Language**: All UI text in Russian (dates, labels, buttons)

## Next Steps

1. **Review Spec**: Read `spec.md` - verify user stories match your needs
2. **Run /speckit.plan**: Generate implementation plan with technical design
3. **Run /speckit.tasks**: Generate actionable task list for development
4. **Implement**: Follow tasks in priority order (P1 → P2 → P3)

## Files in This Feature

- `spec.md` - Full feature specification (user stories, requirements, success criteria)
- `README.md` - This summary document
- `plan.md` - (Next: /speckit.plan) Implementation plan
- `tasks.md` - (Next: /speckit.tasks) Task breakdown

## Questions to Consider

Before proceeding to planning phase:

1. **Athlete ID Strategy**: Should Google Sheets have explicit ID column, or use row numbers?
   - Row numbers: Simple, automatic, but breaks if rows reordered
   - ID column: Stable, flexible, but requires manual maintenance

2. **Archive View Priority**: Should inactive athlete archive be part of P3 or separate feature?
   - Part of P3: More complete solution, longer dev time
   - Separate feature: Ship P3 faster, add archive later

3. **Goal Edit History**: Should system track edit history (who changed what when)?
   - Yes: Useful for debugging, but adds complexity
   - No: Simpler, sufficient for MVP (only track latest updatedAt)

**Recommendation**: Review spec.md acceptance scenarios and provide feedback before running /speckit.plan.
