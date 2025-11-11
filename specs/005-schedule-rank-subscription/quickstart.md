# Quickstart: Schedule Management, Subscription Tracking, and Athletic Rank Recording

**Feature**: 005-schedule-rank-subscription
**Date**: 2025-11-11
**Prerequisites**: Supabase setup complete, index.html deployed, Moyklass API integration working

---

## Implementation Overview

This guide walks through implementing schedule management, subscription filtering, and rank recording in the single-file PWA architecture. Total estimated LOC: ~300-400 lines added to index.html.

**Recommended Implementation Order**: P1 stories first (schedule display + editing), then P2 (subscription filter), then P3 (ranks).

---

## Step 1: Database Migration

### 1.1 Create Migration File

```bash
# Create new migration
cd supabase/migrations
touch 20251111000002_add_schedule_rank_fields.sql
```

### 1.2 Add Schema Changes

```sql
-- File: supabase/migrations/20251111000002_add_schedule_rank_fields.sql

-- Add schedule, rank_start, rank_end columns to athletes table
ALTER TABLE public.athletes
    ADD COLUMN IF NOT EXISTS schedule TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_start TEXT NULL,
    ADD COLUMN IF NOT EXISTS rank_end TEXT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN public.athletes.schedule IS
    'Athlete attendance schedule. Format: "День ЧЧ:ММ, День ЧЧ:ММ" (e.g., "Пн 18:00, Ср 19:00") for fixed schedule, or literal "Самозапись" for self-registration. NULL if not set.';

COMMENT ON COLUMN public.athletes.rank_start IS
    'Athletic rank at season start. Values: "III юношеский разряд", "II юношеский разряд", "I юношеский разряд", "III взрослый разряд", "II взрослый разряд", "I взрослый разряд", "КМС", "МС", "МСМК", "Без разряда". NULL if not set.';

COMMENT ON COLUMN public.athletes.rank_end IS
    'Athletic rank achieved by season end. Same values as rank_start. NULL if season not complete or not yet recorded.';

-- Optional: Add validation constraints (can be added later)
-- ALTER TABLE public.athletes
--   ADD CONSTRAINT check_schedule_format
--   CHECK (
--     schedule IS NULL
--     OR schedule = 'Самозапись'
--     OR schedule ~ '^(Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2}(, (Пн|Вт|Ср|Чт|Пт|Сб|Вс) \d{2}:\d{2})*$'
--   );
```

### 1.3 Deploy Migration

```bash
# Push migration to Supabase
supabase db push

# Verify columns added
supabase db diff
```

**Verification**: Check Supabase dashboard → Database → `athletes` table should show 3 new columns.

---

## Step 2: CSS Styles (index.html Lines ~11-600)

### 2.1 Schedule Display Styles

Add these styles in the `<style>` section:

```css
/* Schedule display in athlete profile */
.schedule-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: #2a2d3a;
    border-radius: 12px;
    font-size: 13px;
    color: #ffffff;
    margin-right: 5px;
    margin-bottom: 5px;
}

.schedule-badge.self-reg {
    background: #4c9eff;
}

/* Schedule editing form */
.schedule-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.schedule-type-selector {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.schedule-type-btn {
    flex: 1;
    padding: 12px;
    background: #2a2d3a;
    border: 2px solid transparent;
    border-radius: 8px;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.schedule-type-btn.active {
    background: #4c9eff;
    border-color: #4c9eff;
}

.schedule-entry {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px;
    background: #1a1d29;
    border-radius: 8px;
}

.schedule-entry select,
.schedule-entry input[type="time"] {
    flex: 1;
    padding: 8px 12px;
    background: #2a2d3a;
    border: 1px solid #3a3d4a;
    border-radius: 6px;
    color: #ffffff;
    font-size: 14px;
}

.schedule-entry .remove-btn {
    min-width: 44px;
    height: 44px;
    background: #dc2626;
    border: none;
    border-radius: 6px;
    color: #ffffff;
    font-size: 18px;
    cursor: pointer;
}

.add-schedule-btn {
    padding: 10px;
    background: #2a2d3a;
    border: 1px dashed #4c9eff;
    border-radius: 8px;
    color: #4c9eff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.add-schedule-btn:active {
    transform: scale(0.98);
    background: #1a1d29;
}
```

### 2.2 Rank Selector Styles

```css
/* Rank dropdowns */
.rank-selector {
    width: 100%;
    padding: 12px;
    background: #2a2d3a;
    border: 1px solid #3a3d4a;
    border-radius: 8px;
    color: #ffffff;
    font-size: 14px;
}

.rank-selector option {
    background: #1a1d29;
    color: #ffffff;
}

.rank-display {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    background: #2a2d3a;
    border-radius: 12px;
    font-size: 13px;
    color: #ffffff;
}

.rank-display.youth {
    background: #fbbf24;
    color: #000000;
}

.rank-display.adult {
    background: #10b981;
    color: #ffffff;
}

.rank-display.elite {
    background: #8b5cf6;
    color: #ffffff;
}

.rank-progression {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #8b8f9f;
}

.rank-progression .arrow {
    color: #4c9eff;
}
```

### 2.3 Subscription Filter Styles

```css
/* Subscription filter chip */
.subscription-filter {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 15px;
    background: #2a2d3a;
    border: 2px solid transparent;
    border-radius: 20px;
    color: #ffffff;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

.subscription-filter.active {
    background: #4c9eff;
    border-color: #4c9eff;
}

.subscription-filter:active {
    transform: scale(0.98);
}
```

---

## Step 3: HTML Markup (index.html Lines ~601-700)

### 3.1 Schedule Edit Modal

Insert before closing `</body>` tag:

```html
<!-- Schedule Edit Modal -->
<div class="modal" id="scheduleModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Редактирование расписания</h2>
            <button class="modal-close" onclick="closeScheduleModal()">✕</button>
        </div>
        <div class="modal-body">
            <div class="schedule-form">
                <!-- Schedule type selector -->
                <div class="schedule-type-selector">
                    <button
                        class="schedule-type-btn active"
                        data-type="fixed"
                        onclick="selectScheduleType('fixed')"
                    >
                        Фиксированное расписание
                    </button>
                    <button
                        class="schedule-type-btn"
                        data-type="self-reg"
                        onclick="selectScheduleType('self-reg')"
                    >
                        Самозапись
                    </button>
                </div>

                <!-- Fixed schedule entries (shown by default) -->
                <div id="fixedScheduleContainer">
                    <div id="scheduleEntries"></div>
                    <button class="add-schedule-btn" onclick="addScheduleEntry()">
                        ＋ Добавить слот
                    </button>
                </div>

                <!-- Self-registration message (hidden by default) -->
                <div id="selfRegContainer" style="display: none;">
                    <p style="color: #8b8f9f; text-align: center; padding: 20px;">
                        Спортсмен записывается на занятия самостоятельно. Фиксированное расписание не требуется.
                    </p>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" onclick="closeScheduleModal()">Отмена</button>
            <button class="btn-primary" onclick="saveSchedule()">Сохранить</button>
        </div>
    </div>
</div>
```

### 3.2 Rank Selectors in Athlete Edit Modal

Add to existing athlete edit modal (find `#editAthleteModal`):

```html
<!-- Inside #editAthleteModal, after group/status fields -->
<div class="form-group">
    <label for="rankStart">Разряд начала сезона</label>
    <select id="rankStart" class="rank-selector">
        <option value="">Не указан</option>
        <option value="Без разряда">Без разряда</option>
        <option value="III юношеский разряд">III юношеский разряд</option>
        <option value="II юношеский разряд">II юношеский разряд</option>
        <option value="I юношеский разряд">I юношеский разряд</option>
        <option value="III взрослый разряд">III взрослый разряд</option>
        <option value="II взрослый разряд">II взрослый разряд</option>
        <option value="I взрослый разряд">I взрослый разряд</option>
        <option value="КМС">КМС</option>
        <option value="МС">МС</option>
        <option value="МСМК">МСМК</option>
    </select>
</div>

<div class="form-group">
    <label for="rankEnd">Разряд конца сезона</label>
    <select id="rankEnd" class="rank-selector">
        <option value="">Не присвоен</option>
        <option value="Без разряда">Без разряда</option>
        <option value="III юношеский разряд">III юношеский разряд</option>
        <option value="II юношеский разряд">II юношеский разряд</option>
        <option value="I юношеский разряд">I юношеский разряд</option>
        <option value="III взрослый разряд">III взрослый разряд</option>
        <option value="II взрослый разряд">II взрослый разряд</option>
        <option value="I взрослый разряд">I взрослый разряд</option>
        <option value="КМС">КМС</option>
        <option value="МС">МС</option>
        <option value="МСМК">МСМК</option>
    </select>
</div>
```

### 3.3 Subscription Filter Chip

Add to header filter section:

```html
<!-- In header, after existing group filter chips -->
<button
    class="subscription-filter"
    id="subscriptionFilter"
    onclick="toggleSubscriptionFilter()"
>
    📋 Абонементы за сезон
</button>
```

---

## Step 4: JavaScript Logic (index.html Lines ~701-2500)

### 4.1 Extended State

Update `athletesData` loading to include new fields:

```javascript
// Already in code - just verify new fields are included
async function loadFromSupabase() {
    const { data: athletes } = await supabase
        .from('athletes')
        .select('*'); // Automatically includes schedule, rank_start, rank_end

    athletesData = athletes.map(transformSupabaseAthlete);
    localStorage.setItem('athletesData', JSON.stringify(athletesData));
}

// Update transformSupabaseAthlete to include new fields
function transformSupabaseAthlete(athlete) {
    return {
        id: athlete.id,
        name: athlete.name,
        group: athlete.group_name,
        schedule: athlete.schedule || '',        // NEW
        rank_start: athlete.rank_start || null,  // NEW
        rank_end: athlete.rank_end || null,      // NEW
        // ... existing fields
    };
}
```

### 4.2 Schedule Display Functions

```javascript
// ============================================================================
// Schedule Management
// ============================================================================

// Format schedule for display
function formatScheduleDisplay(scheduleString) {
    if (!scheduleString) {
        return '<span style="color: #6b6f82;">(Не указано)</span>';
    }

    if (scheduleString === 'Самозапись') {
        return '<span class="schedule-badge self-reg">📝 Самозапись</span>';
    }

    // Split fixed schedule: "Пн 18:00, Ср 19:00" → ["Пн 18:00", "Ср 19:00"]
    return scheduleString
        .split(', ')
        .map(entry => `<span class="schedule-badge">🕐 ${entry}</span>`)
        .join(' ');
}

// Open schedule edit modal
let currentScheduleAthleteId = null;

function openScheduleModal(athleteId) {
    currentScheduleAthleteId = athleteId;
    const athlete = athletesData.find(a => a.id === athleteId);

    // Parse existing schedule
    const isS elfReg = athlete.schedule === 'Самозапись';
    const entries = isS elfReg
        ? []
        : (athlete.schedule || '').split(', ').filter(e => e).map(entry => {
            const [day, time] = entry.split(' ');
            return { day, time };
        });

    // Set schedule type
    selectScheduleType(isSelfReg ? 'self-reg' : 'fixed');

    // Render schedule entries
    renderScheduleEntries(entries);

    // Show modal
    document.getElementById('scheduleModal').classList.add('show');
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('show');
    currentScheduleAthleteId = null;
}

// Select schedule type (fixed vs self-registration)
function selectScheduleType(type) {
    // Update button states
    document.querySelectorAll('.schedule-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    // Show/hide containers
    document.getElementById('fixedScheduleContainer').style.display =
        type === 'fixed' ? 'block' : 'none';
    document.getElementById('selfRegContainer').style.display =
        type === 'self-reg' ? 'block' : 'none';
}

// Render schedule entries
function renderScheduleEntries(entries = []) {
    const container = document.getElementById('scheduleEntries');
    container.innerHTML = '';

    if (entries.length === 0) {
        // Add one empty entry by default
        entries = [{ day: 'Пн', time: '18:00' }];
    }

    entries.forEach((entry, index) => {
        const entryHtml = `
            <div class="schedule-entry" data-index="${index}">
                <select class="day-select">
                    <option value="Пн" ${entry.day === 'Пн' ? 'selected' : ''}>Понедельник</option>
                    <option value="Вт" ${entry.day === 'Вт' ? 'selected' : ''}>Вторник</option>
                    <option value="Ср" ${entry.day === 'Ср' ? 'selected' : ''}>Среда</option>
                    <option value="Чт" ${entry.day === 'Чт' ? 'selected' : ''}>Четверг</option>
                    <option value="Пт" ${entry.day === 'Пт' ? 'selected' : ''}>Пятница</option>
                    <option value="Сб" ${entry.day === 'Сб' ? 'selected' : ''}>Суббота</option>
                    <option value="Вс" ${entry.day === 'Вс' ? 'selected' : ''}>Воскресенье</option>
                </select>
                <input type="time" class="time-input" value="${entry.time}" />
                ${entries.length > 1 ? `<button class="remove-btn" onclick="removeScheduleEntry(${index})">✕</button>` : ''}
            </div>
        `;
        container.insertAdjacentHTML('beforeend', entryHtml);
    });
}

function addScheduleEntry() {
    const entries = getScheduleEntries();
    entries.push({ day: 'Пн', time: '18:00' });
    renderScheduleEntries(entries);
}

function removeScheduleEntry(index) {
    const entries = getScheduleEntries();
    entries.splice(index, 1);
    renderScheduleEntries(entries);
}

function getScheduleEntries() {
    const entries = [];
    document.querySelectorAll('.schedule-entry').forEach(entry => {
        const day = entry.querySelector('.day-select').value;
        const time = entry.querySelector('.time-input').value;
        entries.push({ day, time });
    });
    return entries;
}

// Save schedule
async function saveSchedule() {
    const isSelfReg = document.querySelector('.schedule-type-btn[data-type="self-reg"]').classList.contains('active');

    let scheduleString;
    if (isSelfReg) {
        scheduleString = 'Самозапись';
    } else {
        const entries = getScheduleEntries();
        scheduleString = entries.map(e => `${e.day} ${e.time}`).join(', ');
    }

    // Update Supabase
    const { error } = await supabase
        .from('athletes')
        .update({ schedule: scheduleString })
        .eq('id', currentScheduleAthleteId);

    if (error) {
        console.error('❌ Ошибка сохранения расписания:', error);
        alert('Ошибка сохранения расписания');
        return;
    }

    // Update local state
    const athlete = athletesData.find(a => a.id === currentScheduleAthleteId);
    athlete.schedule = scheduleString;
    localStorage.setItem('athletesData', JSON.stringify(athletesData));

    console.log('✅ Расписание сохранено:', scheduleString);
    closeScheduleModal();
    renderAthletes(); // Refresh display
}
```

### 4.3 Rank Management Functions

```javascript
// ============================================================================
// Rank Management
// ============================================================================

// Format rank display
function formatRankDisplay(rankStart, rankEnd) {
    if (!rankStart && !rankEnd) {
        return '<span style="color: #6b6f82;">(Не указано)</span>';
    }

    if (rankStart && rankEnd) {
        return `
            <div class="rank-progression">
                <span class="rank-display">${getRankIcon(rankStart)} ${rankStart}</span>
                <span class="arrow">➡️</span>
                <span class="rank-display">${getRankIcon(rankEnd)} ${rankEnd}</span>
            </div>
        `;
    }

    return `<span class="rank-display">${getRankIcon(rankStart || rankEnd)} ${rankStart || rankEnd}</span>`;
}

function getRankIcon(rank) {
    if (rank.includes('юношеский')) return '🥉';
    if (rank.includes('взрослый')) return '🥈';
    if (['КМС', 'МС', 'МСМК'].includes(rank)) return '🥇';
    return '📋';
}

// Save ranks (called from existing saveAthlete function)
async function saveAthleteWithRanks(athleteId) {
    const rankStart = document.getElementById('rankStart').value || null;
    const rankEnd = document.getElementById('rankEnd').value || null;

    const { error } = await supabase
        .from('athletes')
        .update({
            rank_start: rankStart,
            rank_end: rankEnd
        })
        .eq('id', athleteId);

    if (error) {
        console.error('❌ Ошибка сохранения разрядов:', error);
        return false;
    }

    // Update local state
    const athlete = athletesData.find(a => a.id === athleteId);
    athlete.rank_start = rankStart;
    athlete.rank_end = rankEnd;

    console.log('✅ Разряды сохранены:', { rankStart, rankEnd });
    return true;
}
```

### 4.4 Subscription Filter Functions

```javascript
// ============================================================================
// Subscription Filtering
// ============================================================================

let subscriptionFilterActive = false;

function toggleSubscriptionFilter() {
    subscriptionFilterActive = !subscriptionFilterActive;

    const btn = document.getElementById('subscriptionFilter');
    btn.classList.toggle('active', subscriptionFilterActive);

    filterAthletes();
}

async function filterAthletes() {
    let filtered = athletesData;

    // Apply existing filters (group, search)
    // ... existing filter logic ...

    // Apply subscription filter
    if (subscriptionFilterActive) {
        filtered = await filterBySubscriptionHistory(filtered);
    }

    renderAthletes(filtered);
}

async function filterBySubscriptionHistory(athletes) {
    // Get current season dates
    const now = new Date();
    const currentYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const seasonStart = `${currentYear}-09-01`;
    const seasonEnd = `${currentYear + 1}-08-31`;

    // Fetch subscription history from cache or Moyklass API
    let subscriptionData = getSubscriptionCache();

    if (!subscriptionData || isCacheStale(subscriptionData)) {
        if (navigator.onLine) {
            console.log('🔄 Загрузка истории абонементов из Moyklass...');
            subscriptionData = await fetchSubscriptionHistory(seasonStart, seasonEnd);
            setSubscriptionCache(subscriptionData);
        } else {
            console.log('⚠️ Офлайн - используем кэш (может быть устаревшим)');
        }
    }

    // Get athlete IDs with subscription history this season
    const athleteIdsWithSub = new Set(subscriptionData.map(sub => sub.athlete_id));

    // Filter athletes
    return athletes.filter(a => athleteIdsWithSub.has(a.id));
}

function getSubscriptionCache() {
    const cached = localStorage.getItem('subscription_cache');
    return cached ? JSON.parse(cached) : null;
}

function setSubscriptionCache(data) {
    localStorage.setItem('subscription_cache', JSON.stringify({
        data: data,
        timestamp: Date.now()
    }));
}

function isCacheStale(cacheObj) {
    const age = Date.now() - cacheObj.timestamp;
    return age > 24 * 60 * 60 * 1000; // 24 hours
}

async function fetchSubscriptionHistory(seasonStart, seasonEnd) {
    // TODO: Replace with actual Moyklass API call
    // See SUPABASE_MOYKLASS_INTEGRATION.md for API details
    const response = await fetch('https://api.moyklass.com/v1/subscriptions', {
        headers: {
            'Authorization': `Bearer ${MOYKLASS_API_KEY}`
        }
    });

    const allSubs = await response.json();

    // Filter by season dates
    return allSubs.filter(sub =>
        sub.start_date <= seasonEnd && sub.end_date >= seasonStart
    );
}
```

---

## Step 5: Update Athlete Display

Modify `renderAthleteProfile()` to show schedule and ranks:

```javascript
function renderAthleteProfile(athlete) {
    return `
        <div class="athlete-card">
            <h3>${athlete.name}</h3>
            <div class="athlete-info">
                <div class="info-row">
                    <span class="label">Группа:</span>
                    <span>${athlete.group}</span>
                </div>
                <!-- NEW: Schedule display -->
                <div class="info-row">
                    <span class="label">Расписание:</span>
                    <span>${formatScheduleDisplay(athlete.schedule)}</span>
                    <button class="btn-icon" onclick="openScheduleModal('${athlete.id}')">✏️</button>
                </div>
                <!-- NEW: Rank display -->
                <div class="info-row">
                    <span class="label">Разряд:</span>
                    <span>${formatRankDisplay(athlete.rank_start, athlete.rank_end)}</span>
                </div>
                <!-- Existing fields... -->
            </div>
        </div>
    `;
}
```

---

## Step 6: Testing Checklist

### Manual Testing (Mobile Browser)

**P1: Schedule Display & Editing**
- [ ] Open athlete profile → schedule displays correctly (fixed OR self-reg OR empty)
- [ ] Click edit schedule → modal opens with current schedule
- [ ] Add multiple schedule entries → all save correctly
- [ ] Switch to self-registration → saves as "Самозапись"
- [ ] Verify offline: schedule persists in localStorage

**P2: Subscription Filtering**
- [ ] Click "Абонементы за сезон" chip → list filters to athletes with subscriptions
- [ ] Verify correct season calculation (Sept-Aug)
- [ ] Test offline: cached data used, staleness indicator shown

**P3: Rank Recording**
- [ ] Edit athlete → rank dropdowns appear with all 9 ranks + "Без разряда"
- [ ] Select rank_start → saves and displays in profile
- [ ] Select rank_end → saves and displays with progression arrow
- [ ] Verify nullable: empty ranks show "(Не указано)"

### Edge Cases

- [ ] Athlete with no schedule → displays "(Не указано)"
- [ ] Athlete switches fixed schedule → self-reg → back to fixed (data persists correctly)
- [ ] Subscription filter offline with stale cache (>24h) → shows warning
- [ ] Rank progression: same rank start/end → displays without arrow

### Performance

- [ ] Schedule modal opens in <100ms
- [ ] Subscription filter applies in <3s (with network)
- [ ] No UI freeze when rendering 200 athletes with schedules

---

## Step 7: Deployment

### 7.1 Pre-Deployment Checklist

- [ ] Database migration deployed and verified
- [ ] All code added to index.html (no separate files)
- [ ] Manual testing complete (all scenarios passed)
- [ ] Git commit with descriptive message

### 7.2 Deployment Steps

```bash
# Commit changes
git add index.html supabase/migrations/
git commit -m "Add: Schedule management, subscription filtering, and rank recording

- Extend athletes table with schedule, rank_start, rank_end columns
- Add schedule edit modal with fixed/self-reg options
- Add subscription history filter (Moyklass API integration)
- Add rank dropdowns in athlete edit form
- Update athlete profile display with new fields

Closes #005-schedule-rank-subscription"

# Push to remote
git push origin 005-schedule-rank-subscription

# Deploy to production (method depends on hosting)
# Option 1: Manual upload to web server
# Option 2: GitHub Pages auto-deploy
# Option 3: Netlify auto-deploy from git push
```

### 7.3 Post-Deployment Verification

- [ ] Open production URL on Safari iOS
- [ ] Test schedule editing on real mobile device
- [ ] Verify Supabase sync works (online)
- [ ] Verify localStorage works (offline mode)
- [ ] Check subscription filter connects to Moyklass API

---

## Step 8: Update Agent Context

```bash
# Run agent context update script
.specify/scripts/bash/update-agent-context.sh claude
```

This adds the new technology/patterns to CLAUDE.md automatically.

---

## Troubleshooting

### Schedule not saving
- Check Supabase connection in browser console
- Verify migration ran successfully (`supabase db diff`)
- Check for JavaScript errors in console

### Subscription filter not working
- Verify Moyklass API key is set
- Check network tab for API response
- Verify season date calculation (Sept-Aug)

### Ranks not displaying
- Check rank values match exact strings (case-sensitive)
- Verify dropdown options include selected rank
- Check for typos in rank names

---

## Next Steps

After deployment:
1. Create `/speckit.tasks` for detailed implementation tasks
2. Monitor user feedback on schedule editing UX
3. Consider future enhancements:
   - Schedule conflict detection
   - Automated rank progression recommendations
   - Schedule export to calendar apps

---

## References

- [Feature Spec](./spec.md) - User requirements and acceptance criteria
- [Data Model](./data-model.md) - Database schema and validation rules
- [Research](./research.md) - Technical decisions and rationale
- [CLAUDE.md](../../CLAUDE.md) - Project constitution and architecture
- [SUPABASE_MOYKLASS_INTEGRATION.md](../../SUPABASE_MOYKLASS_INTEGRATION.md) - Moyklass API integration details
