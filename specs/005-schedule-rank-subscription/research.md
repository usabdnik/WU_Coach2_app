# Research: Schedule Management, Subscription Tracking, and Athletic Rank Recording

**Feature**: 005-schedule-rank-subscription
**Date**: 2025-11-11
**Purpose**: Document technical decisions and research findings for implementation

---

## Decision 1: Schedule Storage Format

**Question**: How should fixed schedule entries be stored in the database?

### Options Evaluated

| Option | Format Example | Pros | Cons |
|--------|----------------|------|------|
| **A. Delimited String** | `"Пн 18:00, Ср 18:00, Пт 19:00"` | Simple, human-readable, compact | Harder to query, validate, or filter |
| **B. JSON Array** | `[{"day":"Пн","time":"18:00"},...]` | Structured, queryable, extensible | Requires JSON parsing, more verbose |
| **C. Separate Table** | `schedule_entries(athlete_id, day, time)` | Normalized, queryable, scalable | Overkill for MVP, adds table complexity |

### Decision: **Option A - Delimited String**

**Rationale**:
- Matches existing project simplicity (single-file PWA, minimal complexity)
- Schedule display is primarily read-only (coaches view, not query/filter)
- Easy to render in UI: split by comma, display as chips
- Sufficient for MVP scale (50-200 athletes, 1-5 schedule entries per athlete)
- "Самозапись" (self-registration) can be stored as literal string (no delimited entries)

**Alternatives Considered**:
- Option B rejected: Adds JSON parsing overhead for limited benefit (no complex queries needed)
- Option C rejected: Over-engineering for current scale; violates YAGNI principle

**Implementation Notes**:
- Format: `"День ЧЧ:ММ, День ЧЧ:ММ"` (e.g., `"Пн 18:00, Ср 19:00"`)
- Self-registration: Store literal `"Самозапись"` (no time entries)
- Validation: Max 200 characters, regex check for valid format
- Display: Split by comma, render as schedule chips with clock icon

---

## Decision 2: Subscription History Tracking

**Question**: How should subscription history be tracked for season filtering?

### Options Evaluated

| Option | Implementation | Pros | Cons |
|--------|----------------|------|------|
| **A. Moyklass CRM API** | Query subscription data from existing CRM integration | Authoritative source, no duplicate data | Requires API access, network dependency |
| **B. Supabase Subscriptions Table** | Create `subscriptions` table with start/end dates | Local queries, offline-capable | Duplicate data, sync complexity |
| **C. Athlete `subscription_history` JSONB** | Store subscription periods as JSONB array in athletes table | Denormalized, simple queries | Less normalized, harder to update |

### Decision: **Option A - Moyklass CRM API**

**Rationale**:
- Project already has Moyklass CRM integration (see `SUPABASE_MOYKLASS_INTEGRATION.md`)
- Subscription data is authoritative in Moyklass (payment tracking, active status)
- Avoids data duplication and sync issues
- Network requirement acceptable (season filtering is not offline-critical operation)
- Moyklass API supports filtering by date range and status

**Alternatives Considered**:
- Option B rejected: Adds sync complexity, duplicate data management
- Option C rejected: Less maintainable, harder to query historical data

**Implementation Notes**:
- Use existing Moyklass API integration
- Filter athletes by: `subscription_start_date <= season_end AND subscription_end_date >= season_start`
- Cache results in localStorage for offline viewing (stale data acceptable for this use case)
- Show "(Данные могут быть устаревшими)" if offline for >24 hours

---

## Decision 3: Athletic Rank Options

**Question**: What are the complete list of Russian athletic ranks for the dropdown?

### Research Findings

Based on Russian sports qualification system (Единая всероссийская спортивная классификация - ЕВСК):

**Youth Ranks** (Юношеские разряды):
1. III юношеский разряд (3rd youth rank)
2. II юношеский разряд (2nd youth rank)
3. I юношеский разряд (1st youth rank)

**Adult Ranks** (Взрослые разряды):
4. III взрослый разряд (3rd adult rank)
5. II взрослый разряд (2nd adult rank)
6. I взрослый разряд (1st adult rank)

**Elite Ranks** (Элитные звания):
7. КМС - Кандидат в мастера спорта (Candidate Master of Sport)
8. МС - Мастер спорта России (Master of Sport of Russia)
9. МСМК - Мастер спорта международного класса (International Master of Sport)

### Decision: **Support All 9 Ranks**

**Rationale**:
- Complete coverage of progression from beginner to elite
- No extra cost (dropdown implementation same regardless of option count)
- Future-proof (coaches may train athletes at any level)
- Standard Russian sports classification system

**Implementation Notes**:
- Dropdown order: Youth → Adult → Elite (progression order)
- Add "Без разряда" (No rank) option for beginners
- Store as text (e.g., "I юношеский разряд", "КМС")
- Allow empty selection (nullable field)

---

## Decision 4: Schedule Picker UI Component

**Question**: What UI component should be used for schedule entry (day + time)?

### Options Evaluated

| Option | Implementation | Pros | Cons |
|--------|----------------|------|------|
| **A. Native HTML inputs** | `<select>` for day + `<input type="time">` | Mobile-optimized, accessible, native feel | Less customizable, iOS time picker quirks |
| **B. Custom dropdown/modal** | JavaScript custom picker | Full control, custom styling | More code, accessibility challenges |
| **C. Text input** | Free-text entry like "Пн 18:00" | Flexible, fast entry | Validation needed, typo-prone |

### Decision: **Option A - Native HTML Inputs**

**Rationale**:
- Mobile browsers provide excellent native time pickers (iOS wheel, Android material)
- Accessibility built-in (screen readers, keyboard navigation)
- Touch-optimized UX out of the box
- Aligns with project simplicity (no custom component complexity)
- Consistent with mobile-first design philosophy

**Alternatives Considered**:
- Option B rejected: Over-engineering, increases LOC significantly
- Option C rejected: Poor UX, high error rate, needs complex validation

**Implementation Notes**:
- Day selector: `<select>` with 7 options (Пн-Вс)
- Time input: `<input type="time">` (24-hour format per constitution)
- Add button: "＋ Добавить слот" to add multiple schedule entries
- Remove button: "✕" icon next to each entry

---

## Decision 5: Data Migration Strategy

**Question**: How should existing athletes without schedule/rank data be handled?

### Options Evaluated

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A. Nullable fields** | All new fields nullable, show empty when not set | No migration needed, clean | May show "empty" state in UI |
| **B. Default values** | Set defaults (e.g., schedule="", rank_start=NULL) | Explicit handling | Meaningless defaults clutter data |
| **C. Migration script** | Prompt coach to fill in data for existing athletes | Complete data | High friction, time-consuming |

### Decision: **Option A - Nullable Fields**

**Rationale**:
- Zero migration friction (feature deploys immediately)
- Aligns with feature spec assumption that fields are optional
- UI can elegantly handle missing data (show empty sections)
- Coaches can fill data gradually as needed (progressive data entry)

**Alternatives Considered**:
- Option B rejected: Empty strings vs NULL adds confusion, no real benefit
- Option C rejected: High friction, blocks feature adoption, unnecessary for optional fields

**Implementation Notes**:
- Database: `ALTER TABLE athletes ADD COLUMN schedule TEXT NULL`
- Database: `ALTER TABLE athletes ADD COLUMN rank_start TEXT NULL`
- Database: `ALTER TABLE athletes ADD COLUMN rank_end TEXT NULL`
- UI: Show "(Не указано)" placeholder for empty schedule/rank fields
- Form: Pre-fill with empty values, not placeholder text

---

## Best Practices Research

### Mobile Schedule Pickers

**Research**: Mobile UX patterns for schedule/time entry

**Findings**:
- Native `<input type="time">` provides best mobile UX:
  - iOS: Native wheel picker (hours/minutes)
  - Android: Material Design time picker dialog
  - Accessibility: Full screen reader support
- Avoid custom JavaScript pickers unless absolutely necessary
- Use 24-hour format (per Russian conventions and constitution)

**Reference**: Apple HIG (Mobile Inputs), Material Design (Time Pickers)

---

### Offline-First Subscription Filtering

**Research**: Patterns for offline filtering with remote data source

**Findings**:
- Cache remote API responses in localStorage with timestamp
- Show cached data with staleness indicator if offline
- Acceptable staleness threshold: 24 hours for subscription data (low change frequency)
- Provide manual refresh button for on-demand sync

**Pattern**:
```javascript
async function filterBySubscription() {
  const cached = localStorage.getItem('subscription_cache');
  const cacheAge = Date.now() - (cached?.timestamp || 0);

  if (navigator.onLine && cacheAge > 24 * 60 * 60 * 1000) {
    // Fetch fresh data from Moyklass API
    const fresh = await fetchSubscriptionHistory();
    localStorage.setItem('subscription_cache', JSON.stringify({
      data: fresh,
      timestamp: Date.now()
    }));
    return fresh;
  }

  return cached?.data || [];
}
```

---

## Technology Patterns

### Supabase Schema Migrations

**Pattern**: Adding nullable columns to existing tables

```sql
-- Migration: 20251111_add_schedule_rank_fields.sql
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS schedule TEXT NULL,
  ADD COLUMN IF NOT EXISTS rank_start TEXT NULL,
  ADD COLUMN IF NOT EXISTS rank_end TEXT NULL;

-- Update trigger (already exists, no change needed)
-- Existing update_updated_at_column() trigger handles all columns
```

**Best Practice**: Use `IF NOT EXISTS` for idempotency (safe to re-run)

---

### Single-File PWA Code Organization

**Pattern**: Grouping related functionality in single-file architecture

**Best Practice**:
- CSS: Group by feature (schedule styles together)
- HTML: Group modals/forms by feature
- JavaScript: Group functions by feature with comment headers

**Example Structure**:
```javascript
// ============================================================================
// Schedule Management
// ============================================================================

function openScheduleModal(athleteId) { ... }
function saveSchedule(athleteId, entries) { ... }
function formatScheduleDisplay(scheduleString) { ... }

// ============================================================================
// Rank Management
// ============================================================================

function getRankOptions() { ... }
function saveRanks(athleteId, start, end) { ... }
```

---

## Summary

All technical decisions resolved. No blocking unknowns remain. Ready for Phase 1: Design & Contracts.

**Key Takeaways**:
1. Schedule stored as delimited string (simple, sufficient for MVP)
2. Subscription history from Moyklass API (authoritative source)
3. Support all 9 Russian athletic ranks (complete system)
4. Use native HTML time inputs (mobile-optimized UX)
5. Nullable fields (zero-friction migration)
