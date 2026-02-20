# WU Coach 2 - Claude Code Instructions

> **Progressive Web App for Gym Coaching** | Single-File Architecture | Offline-First | Mobile-Only

---

## 🧠 CRITICAL: UltraThink Mode Active

**This project operates in PERMANENT ULTRATHINK MODE.**

🔗 **Configuration**: `.specify/memory/ULTRATHINK_MODE.md`

**What this means**:
- Maximum depth analysis (~32K tokens)
- All MCP servers enabled (Sequential, Context7, Magic, Serena, Morphllm, Playwright)
- Comprehensive thinking required for ALL tasks
- Evidence-based reasoning mandatory
- Multi-step analysis with hypothesis testing

**DO NOT disable this mode without explicit user permission.**

---

## 📋 Project Constitution

**Primary reference document**: `.specify/memory/constitution.md`

### Core Architectural Principles

1. **Single-File HTML PWA** - Everything in `index.html`
2. **Zero Dependencies** - No npm packages in PWA runtime; migration/dev tooling exempt (see constitution.md)
3. **Offline-First** - localStorage primary, Supabase sync secondary
4. **Mobile-Only** - Touch-optimized, no desktop considerations
5. **Dark Theme** - Fixed color palette, no theming system
6. **Russian Language** - No internationalization needed

### Non-Negotiable Rules

- ❌ **NEVER add external dependencies** (no npm packages in PWA runtime; migration/dev tooling exempt)
- ❌ **NEVER break single-file structure**
- ❌ **NEVER add English UI text** (Russian only)
- ❌ **NEVER optimize for desktop** (mobile first and only)
- ✅ **ALWAYS maintain offline-first data flow**
- ✅ **ALWAYS use localStorage as primary storage**
- ✅ **ALWAYS follow dark theme color palette**
- ✅ **ALWAYS test on mobile browsers** (Safari iOS, Chrome Android)

---

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3
- **Backend**: Supabase PostgreSQL (primary), Moyklass CRM (data source)
- **Storage**: localStorage API (offline), Supabase (cloud)
- **State**: Plain JS objects (no state library)
- **Styling**: Inline CSS with BEM-inspired naming

### File Structure
```
index.html
├── Lines 1-15    : Meta tags (PWA, viewport, theme) + Supabase SDK
├── Lines 16-550  : CSS styles (dark theme, mobile-first)
├── Lines 551-650 : HTML markup (header, lists, modals, nav)
└── Lines 651+    : JavaScript (state, data, UI, Supabase sync)
```

**Note**: Line numbers approximate. File evolves with features.

### Data Architecture
```javascript
// Global State (in-memory)
athletesData = []      // Student records
exercisesData = []     // Exercise definitions
goalsData = []         // Student goals
pendingChanges = []    // Offline sync queue
currentSeason = {}     // Sept-Aug academic year

// Persistence (localStorage)
localStorage.athletesData
localStorage.exercisesData
localStorage.goalsData
localStorage.pendingChanges
localStorage.lastSaved
```

### Data Flow
```
User Action
  → Update in-memory state
    → Add to pendingChanges queue
      → Save to localStorage (immediate)
        → Display pending indicator (⏳)
          → Manual sync button
            → POST to Supabase (supabaseClient.from('table').upsert())
              → Clear pendingChanges on success
                → Reload fresh data from Supabase
```

**Background Sync**: GitHub Actions runs every 15min to sync Moyklass CRM → Supabase

---

## 🔌 Supabase Connection Strategy

**Updated**: 2024-11-14 | **Status**: ✅ Fully Operational

### Available Methods

#### 1. PostgreSQL Direct (node-postgres) ⚡ RECOMMENDED for DDL
**Use for**: Migrations, schema changes, functions, triggers

```javascript
import pg from 'pg';
const client = new Client({
  connectionString: 'postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
await client.query(migrationSQL);
```

**Benefits**:
- ✅ 30-40% fewer tokens (minimal JSON overhead)
- ✅ Multi-statement migrations
- ✅ Full DDL support (CREATE/ALTER TABLE, FUNCTION, TRIGGER)

**Example**: `migration/run-migration.js`

---

#### 2. Supabase JS SDK (@supabase/supabase-js) 🎯 RECOMMENDED for CRUD
**Use for**: Data operations, RPC calls, import/export scripts

```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const { data, error } = await supabase
  .from('athletes')
  .select('*')
  .eq('moyklass_id', '12345');
```

**Benefits**:
- ✅ Type-safe API
- ✅ Built-in error handling
- ✅ Convenient filters & pagination
- ✅ RPC function calls

**Examples**: `migration/import-from-moyklass.js`, `migration/verify-subscriptions.js`

---

#### 3. Supabase CLI ❌ NOT CONFIGURED (not critical)
**Status**: Installed but not linked to project

**Alternative**: Use PostgreSQL Direct for migrations instead of `supabase db push`

---

### Token Efficiency Comparison

| Operation | PostgreSQL Direct | Supabase JS SDK | Token Savings |
|-----------|-------------------|-----------------|---------------|
| Simple SELECT | ~150-200 tokens | ~200-300 tokens | 30-40% |
| CREATE TABLE | ~100 tokens | N/A | 100% (SDK can't do DDL) |
| Complex queries | ~300 tokens | ~350 tokens | ~15% |

**Recommendation**: Use PostgreSQL for migrations (saves tokens), JS SDK for data operations (better DX)

---

### Supabase Account
- **Email**: dolanmike419@gmail.com
- **Dashboard**: https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs

### Credentials Location
- **File**: `migration/.env`
- **Memory**: `mcp__serena__read_memory("SUPABASE_CREDENTIALS")`
- **Connection methods doc**: `mcp__serena__read_memory("SUPABASE_CONNECTION_METHODS")`

---

## 🎯 Feature 005: Schedule Management & Athletic Ranks

**Status**: Phase 8 (Polish & Documentation) ✅ Core Implementation Complete

**Branch**: `005-schedule-rank-subscription`

### Implemented Features (Phases 1-7 ✅)

#### 📅 **Schedule Management** (US1 + US3 - COMPLETE)
- **Display**: Athletes' training schedules visible in profile view (line ~1801-1815: formatScheduleDisplay)
- **Two Schedule Types**:
  - **Fixed Schedule**: "Пн 18:00, Ср 19:00" format with day + time entries
  - **Self-Registration**: "Самозапись" literal for flexible scheduling
- **Editing Modal**: Full CRUD interface with type selector (line ~2910-3123: schedule functions)
- **Validation**: Format validation for day (Пн-Вс) and time (HH:MM) before saving (line ~3077-3090)
- **Offline-First**: Saves to localStorage, syncs to Supabase when online
- **Functions**:
  - `openScheduleModal(athleteId)` - line ~2910
  - `closeScheduleModal()` - line ~2936
  - `selectScheduleType(type)` - line ~2944
  - `renderScheduleEntries(entries)` - line ~2964
  - `addScheduleEntry()` - line ~2991
  - `removeScheduleEntry(index)` - line ~2999
  - `saveSchedule(event)` - line ~3055 (with validation + error handling)
  - `formatScheduleDisplay(scheduleString)` - line ~1801

#### 🏆 **Athletic Rank Tracking** (US4 + US5 - COMPLETE)
- **Season Start Rank** (`rank_start`): Record initial athletic rank at season beginning
- **Season End Rank** (`rank_end`): Record final rank for outcome tracking
- **11 Rank Levels**: Youth (III, II, I) → Adult (III, II, I) → Elite (КМС, МС, МСМК) + "Без разряда" + empty
- **Progression Display**: Shows rank advancement with arrow (🥉 → 🥇) when both set
- **Visual Icons**: Emoji mapping based on rank level (🔰 🥉 🥈 🥇 🏆)
- **Validation**: Ensures rank values match allowed list before saving (line ~2862-2872)
- **Offline-First**: Integrated into athlete data sync workflow
- **Functions**:
  - `formatRankDisplay(rankStart, rankEnd)` - line ~1838 (with progression logic)
  - `getRankIcon(rank)` - line ~1818 (emoji mapping)
  - `editRecords(id)` - line ~2070 (loads rank data with logging)
  - `recordsForm submit` - line ~2851+ (saves + validates rank data)

#### 🔄 **Subscription Filter** (US2 - PENDING Phase 5)
- **Status**: Not yet implemented (T037-T053 pending)
- **Purpose**: Filter athletes by active subscription during current season
- **Data Source**: TBD (Moyklass API OR Supabase subscriptions table)

### Database Schema (Supabase)

**Migration**: `supabase/migrations/20251111000002_add_schedule_rank_fields.sql`

```sql
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS schedule TEXT DEFAULT NULL;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS rank_start TEXT DEFAULT NULL;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS rank_end TEXT DEFAULT NULL;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS rank_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN athletes.schedule IS 'Training schedule: "Пн 18:00, Ср 19:00" OR "Самозапись"';
COMMENT ON COLUMN athletes.rank_start IS 'Athletic rank at season start';
COMMENT ON COLUMN athletes.rank_end IS 'Athletic rank at season end';
COMMENT ON COLUMN athletes.rank_history IS 'Historical rank progression data (JSONB array)';
```

### Phase 8 Improvements (Current) ✅

**Completed**:
- ✅ T077-T078: Console logging with emoji for schedule + rank operations
- ✅ T079-T080: Error handling for Supabase failures (schedule + rank)
- ✅ T081: Moyklass API error handling (N/A - Phase 5 not implemented)
- ✅ T082: Schedule format validation (day: Пн-Вс, time: HH:MM regex)
- ✅ T083: Rank value validation (against 11 allowed ranks)
- ✅ T084-T087: Manual testing tasks (requires mobile devices - deferred)

**Remaining**:
- ⏳ T089: Update CLAUDE.md (this section)
- ⏳ T090: Run update-agent-context.sh
- ⏳ T091-T093: Code cleanup (BEM naming, Russian language, dark theme)
- ⏳ T094-T095: Performance testing + final verification

### Key Line References (index.html)

| Feature | Function/Section | Line Range | Status |
|---------|-----------------|------------|--------|
| Schedule Display | `formatScheduleDisplay()` | ~1801-1815 | ✅ |
| Schedule Modal | `openScheduleModal()` | ~2910-2932 | ✅ |
| Schedule Save | `saveSchedule()` | ~3055-3142 | ✅ + Validation + Error Handling |
| Schedule Validation | Format check | ~3077-3090 | ✅ T082 |
| Rank Display | `formatRankDisplay()` | ~1838-1870 | ✅ |
| Rank Icons | `getRankIcon()` | ~1818-1835 | ✅ |
| Rank Edit | `editRecords()` | ~2070-2116 | ✅ + Logging |
| Rank Save | recordsForm submit | ~2851-2920 | ✅ + Validation |
| Rank Validation | Value check | ~2862-2872 | ✅ T083 |
| Supabase Sync | `syncPendingChangesToSupabase()` | ~2352-2554 | ✅ + Error Logging |

### Testing Notes

**Manual Testing Completed** (Phases 3, 4, 6, 7):
- ✅ Schedule display with fixed schedule format
- ✅ Schedule display with self-registration mode
- ✅ Schedule editing (add/remove/save entries)
- ✅ Rank progression display (start → end)
- ✅ Rank persistence across refresh
- ✅ Offline localStorage persistence
- ✅ Online Supabase sync

**Pending Mobile Testing** (T086-T087):
- Safari iOS: Touch interactions (44x44px targets)
- Chrome Android: Touch interactions + performance

### Future Enhancements (Phase 7.5 - Deferred)

**Historical Rank Tracking** (T076a-T076i):
- Multi-season rank progression history
- `rank_history` JSONB field (already in schema ✅)
- Season-end automatic archival (Sept 1 trigger)
- Historical view modal with progression table
- Not yet implemented (low priority)

---

## 🎨 Design System

### Color Palette (Dark Theme)
| Element | Color | Usage |
|---------|-------|-------|
| Background | `#0f1117` | Body base |
| Card | `#1a1d29` | Athlete cards, modals |
| Input | `#2a2d3a` | Form fields, chips |
| Primary | `#4c9eff` | Actions, links |
| Success | `#4ade80` | Active status, completed |
| Warning | `#fbbf24` | Pending, schedule |
| Danger | `#dc2626` | Delete actions |
| Text Primary | `#ffffff` | Main content |
| Text Secondary | `#8b8f9f` | Labels, meta |
| Text Tertiary | `#6b6f82` | Placeholders, disabled |

### Typography
- **Font**: System stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial`)
- **Scale**: 11px → 13px → 14px → 15px → 17px → 20px → 24px
- **Weights**: 400 (regular), 600 (semi-bold), 700 (bold)

### Spacing
- **Base unit**: 5px
- **Common gaps**: 8px, 10px, 15px, 20px
- **Padding scale**: 10px → 12px → 15px → 20px
- **Margin scale**: 8px → 10px → 15px → 20px

### Touch Targets
- **Minimum**: 44x44px (Apple HIG standard)
- **Preferred**: 48x48px or larger
- **Active feedback**: `transform: scale(0.98)` + background change

---

## 🔧 Development Workflow

### Before Making Changes

1. **Read Constitution**: `.specify/memory/constitution.md`
2. **Read UltraThink Config**: `.specify/memory/ULTRATHINK_MODE.md`
3. **Activate Sequential MCP**: Use for analysis phase
4. **Check Git Status**: `git status && git branch`

### Adding New Features

1. **Plan with UltraThink**:
   - Use Sequential MCP for analysis
   - Document architecture impact
   - Assess security implications
   - Consider mobile UX
   - Plan offline-first data flow

2. **Locate Insertion Point**:
   - HTML: Find section in `<body>` (lines 526-619)
   - CSS: Find logical place in `<style>` (lines 11-524)
   - JS: Find function group in `<script>` (lines 621-1350)

3. **Implement**:
   - Maintain single-file structure
   - Follow BEM naming for CSS
   - Use dark theme colors
   - Add emoji logging (`console.log('✅ ...')`)
   - Test on mobile browser

4. **Validate**:
   - Check offline functionality
   - Verify touch interactions
   - Test pendingChanges queue
   - Confirm Russian language
   - Review constitution compliance

### Modifying Existing Code

1. **Understand First**:
   - Read HTML markup (visual structure)
   - Read CSS styles (visual design)
   - Read JavaScript (behavior logic)
   - Trace data flow (state → localStorage → sync)

2. **Change Systematically**:
   - Update HTML if structure changes
   - Update CSS if visuals change
   - Update JS if behavior changes
   - Update all three if major feature

3. **Test Thoroughly**:
   - Open in mobile browser (Safari iOS preferred)
   - Test offline mode (airplane mode)
   - Test sync after reconnect
   - Verify localStorage persistence

### Git Commit Pattern

```bash
# Feature branches (if complex)
git checkout -b feature/exercise-type-filter

# Descriptive commits
git commit -m "Add: Exercise type filter chips in header
- New chip filter for exercise types
- Extends existing filter pattern
- Touch-optimized for mobile
- Preserves offline-first data flow"

# Push to GitHub
git push origin feature/exercise-type-filter
```

---

## 🚀 Deployment Process

**Current**: Manual upload to web server

1. Edit `coach-pwa-app (7).html` locally
2. Test by opening file in browser
3. Commit to git: `git add . && git commit -m "..."`
4. Push to GitHub: `git push origin main`
5. Upload HTML file to web hosting

**No build step required** - file is deployment-ready as-is.

**Future**: GitHub Pages or Netlify auto-deployment

---

## 🔒 Security Considerations

### Current State (MVP Phase)
- ❌ No authentication
- ❌ No API authorization
- ❌ No input sanitization
- ❌ No XSS protection
- ❌ No CSRF tokens

**Acceptable because**:
- Internal tool (single coach)
- No sensitive data (just exercise records)
- Limited user base (trusted users)

### Future Roadmap (Production Phase)
- ✅ Google OAuth authentication
- ✅ API key/token authorization
- ✅ Client + server input validation
- ✅ Content Security Policy headers
- ✅ HTTPS enforcement

**When to harden**: Before opening to public or multiple coaches

---

## 📊 Performance Standards

### Mobile Targets
- **Page load**: <2s on 3G
- **Touch response**: <100ms
- **Sync operation**: <5s (normal network)
- **Battery drain**: Minimal (no background tasks)

### Optimization Techniques
- ✅ Single file = Single HTTP request
- ✅ No external assets = No extra requests
- ✅ localStorage = Fast local reads
- ✅ Minimal animations = Low CPU usage
- ❌ Service Worker = Not yet (future PWA feature)
- ❌ Asset minification = Not needed (single file)

---

## 🧪 Testing Strategy

### Manual Testing Protocol
1. **Desktop preview**: Open file in Chrome
2. **Mobile preview**: Chrome DevTools device mode
3. **Real device**: Safari iOS + Chrome Android
4. **Offline mode**: Airplane mode testing
5. **Sync testing**: Edit offline → reconnect → sync

### Test Scenarios
- [ ] Search filter works (Russian input)
- [ ] Group chips filter correctly
- [ ] Athlete details modal opens
- [ ] Performance edit saves locally
- [ ] Pending indicator shows (⏳)
- [ ] Sync button uploads changes
- [ ] Goal completion toggles
- [ ] Goal deletion works
- [ ] Season indicator calculates correctly
- [ ] All-time records display

### No Automated Tests
- **Rationale**: Small single-file app, manual testing sufficient
- **Future**: Consider Playwright tests when codebase grows

---

## 🎯 Common Tasks Quick Reference

### Add New Filter Chip
```
HTML: <button class="chip" data-group="value">Label</button>
CSS:  .chip { ... } .chip.active { ... }
JS:   document.querySelectorAll('.chip').forEach(chip => ...)
```

### Add New Modal
```
HTML: <div class="modal" id="myModal">...</div>
CSS:  .modal { ... } .modal.show { ... }
JS:   document.getElementById('myModal').classList.add('show')
```

### Add New Data Field
```
State:  athletesData[i].newField = value
Local:  localStorage.setItem('athletesData', JSON.stringify(athletesData))
Sync:   pendingChanges.push({ type: 'athlete', ... })
```

### Update Dark Theme Color
```
Find all instances in CSS: Cmd+F "#oldcolor"
Replace with new color: "#newcolor"
Verify contrast: https://webaim.org/resources/contrastchecker/
```

---

## 📚 Key Files Reference

| File/Directory | Purpose |
|----------------|---------|
| `index.html` | Complete PWA application (HTML+CSS+JS) |
| `.specify/memory/constitution.md` | Technical architecture rules (v1.0.0) |
| `.specify/memory/ULTRATHINK_MODE.md` | Permanent ultrathink configuration |
| `CLAUDE.md` | This file - AI development guide |
| `docs/SUPABASE.md` | Supabase integration complete guide |
| `docs/TESTING.md` | Testing instructions and protocols |
| `docs/archive/` | Historical logs (Supabase migration, etc.) |
| `specs/000-006/` | Feature specifications (SpecKit framework) |
| `migration/` | Database migration scripts (Node.js) |
| `supabase/migrations/` | SQL schema migrations |
| `.git/` | Version control history |

---

## ⚙️ MCP Servers Available

| Server | Tool Prefix | Use For |
|--------|-------------|---------|
| Sequential | `mcp__sequential-thinking__*` | Complex analysis, multi-step reasoning |
| Context7 | `mcp__context7__*` | Official documentation lookup |
| Magic | `mcp__magic__*` | UI component generation (21st.dev) |
| Serena | `mcp__serena__*` | Semantic code ops, project memory |
| Morphllm | `mcp__morphllm__*` | Pattern-based bulk edits |
| Playwright | `mcp__playwright__*` | Browser automation, E2E testing |

**All servers enabled in ultrathink mode.**

---

## 🆘 When Things Break

### App Won't Load
1. Check browser console for errors
2. Verify file integrity (no corrupted HTML)
3. Check Google Apps Script URL is accessible
4. Clear localStorage and reload

### Sync Not Working
1. Check internet connection
2. Verify WEBAPP_URL in code (line 624)
3. Check Google Apps Script is deployed
4. Inspect Network tab for failed requests

### Data Lost
1. Check localStorage in DevTools Application tab
2. Look for `athletesData`, `exercisesData`, `goalsData`
3. If empty, re-sync from Google Sheets
4. Check browser didn't clear storage

### Layout Broken
1. Check for CSS typo (missing `;` or `}`)
2. Verify no duplicate IDs in HTML
3. Test in Chrome first (better error messages)
4. Check viewport meta tag is present

---

## 📞 Contact & Support

**Project Owner**: Nikita Izboldin
**Repository**: https://github.com/usabdnik/WU_Coach2_app
**Claude Configuration**: Uses SuperClaude Framework with ultrathink mode

**For Questions**:
1. Read constitution.md first
2. Read ULTRATHINK_MODE.md for analysis standards
3. Use Sequential MCP for complex debugging
4. Reference this CLAUDE.md for workflow

---

## ✅ Pre-Commit Checklist

Before committing code changes:

- [ ] Constitution compliance verified
- [ ] Single-file structure maintained
- [ ] Dark theme colors used
- [ ] Russian language preserved
- [ ] Mobile-first design confirmed
- [ ] Offline-first data flow intact
- [ ] No external dependencies added
- [ ] Console logging with emoji added
- [ ] Touch interactions tested
- [ ] Manual testing completed
- [ ] Git message is descriptive

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Framework**: SuperClaude + UltraThink Mode
**Status**: 🟢 Active Development

## Active Technologies
- Vanilla JavaScript ES6+ (arrow functions, async/await, destructuring, template literals) + None (zero dependencies per constitution - no npm packages, frameworks, or libraries) (001-goal-editing-athlete-sync)
- localStorage API (primary, 5-10MB limit) + Google Apps Script Web App (secondary sync) (001-goal-editing-athlete-sync)
- Vanilla JavaScript ES6+ (in-browser), HTML5, CSS3 + None (zero npm dependencies by constitution) (003-goal-fixes-and-creation)
- localStorage (primary) + Google Apps Script Web App (secondary sync) (003-goal-fixes-and-creation)
- JavaScript ES6+ (in-browser PWA), PostgreSQL 15+ (Supabase), SQL (schema/functions) + Supabase JS SDK v2.x (via CDN), localStorage API (browser native) (004-supabase-migration)
- Supabase PostgreSQL (cloud-hosted), localStorage (primary offline storage) (004-supabase-migration)
- JavaScript ES6+ (in-browser runtime, no Node.js/build step) + Supabase JS SDK v2.x (via CDN), localStorage API (native browser API) (005-schedule-rank-subscription)
- Supabase PostgreSQL 15+ (remote primary), localStorage (offline cache) (005-schedule-rank-subscription)
- Vanilla JavaScript ES6+ (arrow functions, async/await, destructuring, template literals) + NONE (zero runtime dependencies, Supabase JS SDK via CDN already present) (007-group-analytics)
- localStorage API (primary, 5-10MB quota) + Supabase PostgreSQL (secondary sync) (007-group-analytics)
- Vanilla JavaScript ES6+ (in-browser), HTML5, CSS3 + None (Supabase JS SDK via CDN already loaded) (008-training-journal)
- localStorage (primary, offline), Supabase PostgreSQL (secondary, sync) (008-training-journal)

## Recent Changes

### 2026-02-20: Feature 008 — Training Journal (Тренерский журнал)
- ✅ Full-screen journal view with group selection (nav tab 📓)
- ✅ Table display: name + 3 exercises (Подт/Отж/Бр) + all-time records
- ✅ Inline cell editing: tap → numeric input → Enter/blur saves
- ✅ Exercise filter: has/missing toggle per exercise (3-state cycle)
- ✅ Multi-group selection with group subheaders
- ✅ Progress counter "Принято: X/Y"
- ✅ Offline-first: localStorage + pendingChanges (same format as recordsForm)
- ✅ All code in index.html (~640 lines added: CSS ~225, HTML ~18, JS ~395)

**Key Line References (index.html)**:

| Feature | Function/Section | Line Range |
|---------|-----------------|------------|
| Journal CSS | `.journal-view`, `.journal-table`, `.journal-cell` | ~1359-1582 |
| Journal HTML | `#journal-view` container | ~1640-1657 |
| Nav button | `data-nav="journal"` | ~1630 |
| Journal state | `journalSelectedGroups`, `JOURNAL_EXERCISES` | ~5570-5579 |
| `getCurrentMonthIndex()` | Maps JS month to MONTHS index | ~5582 |
| `openJournalView()` | Show overlay, calc records, render | ~5589 |
| `closeJournalView()` | Hide overlay, restore main view | ~5614 |
| `renderJournalGroupChips()` | Group filter chips from AVAILABLE_GROUPS | ~5635 |
| `toggleJournalGroup()` | Multi-select group toggle | ~5645 |
| `renderJournalExerciseFilter()` | Exercise has/missing filter chips | ~5659 |
| `toggleJournalExerciseFilter()` | 3-state cycle: off → has → missing → off | ~5679 |
| `getJournalFilteredAthletes()` | Apply group + exercise filters, sort by lastName | ~5696 |
| `renderJournalTable()` | Main table render with multi-group headers | ~5729 |
| `renderJournalRow()` | Single athlete row: name + 3 cells + records | ~5783 |
| `updateJournalCounter()` | "Принято: X/Y" badge | ~5808 |
| `startJournalCellEdit()` | Replace cell with input on tap | ~5817 |
| `saveJournalCellValue()` | Parse, validate, save to memory + localStorage + pendingChanges | ~5889 |
| `cancelJournalCellEdit()` | Revert cell to display mode | ~5952 |

### 2025-11-23: Project Structure Optimization
- ✅ Consolidated Supabase documentation → `docs/SUPABASE.md`
- ✅ Moved historical logs → `docs/archive/` (6 files with dates)
- ✅ Moved `TESTING.md` → `docs/TESTING.md`
- ✅ Renamed `specs/001-goals-api-backend` → `specs/000-goals-api-backend` (fixed duplicate prefix)
- ✅ Updated `constitution.md` with Dependency Policy (runtime vs dev dependencies)
- ✅ Verified `migration/` scripts (all preserved for future debugging)
- ✅ Updated `CLAUDE.md` with new file structure

### Previous Features
- 006-dynamic-groups: Dynamic group system (М-19, М-117, etc.) ✅ Complete
- 005-schedule-rank-subscription: Schedule & athletic ranks ✅ Complete
- 004-supabase-migration: Migrated from Google Sheets to Supabase ✅ Complete

---

## SpecKit Methodology

Следуй методологии SpecKit при разработке проекта, используя команды в правильной последовательности:

ПОРЯДОК РАБОТЫ:
1. /constitution - Создай конституцию проекта с принципами разработки
2. /specify - Преобразуй описание функционала в spec.md
3. /plan - Сгенерируй план реализации и дизайн-артефакты
4. /tasks - Создай упорядоченный список задач в tasks.md
5. /analyze - Проверь консистентность spec.md, plan.md и tasks.md
6. /implement - Выполни все задачи из tasks.md

АКТИВНО ПОДСКАЗЫВАЙ переходы между этапами:
- После обсуждения идеи: "Начнем с /constitution для установки принципов проекта"
- После принципов: "Используйте /specify для формализации требований"
- После спецификации: "Перейдем к /plan для создания архитектуры"
- После плана: "Выполните /tasks для генерации списка задач"
- После генерации задач: "Запустите /analyze для проверки артефактов"
- После анализа: "Готовы к /implement для реализации"

При любых изменениях требований возвращайся к /specify и проходи цикл заново.
