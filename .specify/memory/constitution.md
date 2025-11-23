# WU Coach 2 - Project Constitution

**Purpose**: Progressive Web App for Gym Coaching (Single-File, Offline-First, Mobile-Only)

---

## Core Principles

### I. Single-File Architecture (NON-NEGOTIABLE)

**Everything in one HTML file** - `index.html` contains HTML, CSS, and JavaScript.

**Rationale**:
- Single HTTP request = fastest load time
- No build step required
- Deployment = copy one file
- Easy debugging and maintenance

**Rules**:
- ✅ All application code in `index.html`
- ✅ PWA runtime files allowed: `manifest.json`, `sw.js`
- ❌ NO code splitting or modules
- ❌ NO separate CSS/JS files (except Service Worker)

**Verification**:
```bash
# Should return ONLY index.html (excluding manifest/sw)
find . -name "*.html" -o -name "*.css" -o -name "*.js" | grep -v manifest | grep -v sw.js | grep -v node_modules
```

---

### II. Zero Runtime Dependencies (NON-NEGOTIABLE)

**Pure vanilla JavaScript** - No frameworks, no npm packages in browser.

**RUNTIME (PWA in browser)**:
- ❌ NO external dependencies
- ✅ Pure vanilla JavaScript ES6+
- ✅ Browser APIs only (localStorage, Service Worker, Fetch API)
- ✅ CDN libraries ONLY for essential functionality (e.g., Supabase JS SDK)

**DEVELOPMENT/MIGRATION (Node.js tooling)**:
- ✅ npm packages allowed for:
  - Database migrations (`pg`, `@supabase/supabase-js`)
  - Data import/export scripts
  - One-time development utilities
- ❌ NOT bundled into PWA runtime
- ❌ NOT required for app to run

**Rationale**:
- No build step
- No dependency vulnerabilities
- No framework lock-in
- Minimal attack surface
- Works forever (no breaking updates)

**Verification**:
```bash
# index.html should NOT import from node_modules
grep -i "node_modules" index.html && echo "❌ VIOLATION" || echo "✅ OK"

# package.json is allowed for dev tools
test -f package.json && echo "✅ Dev tools OK"
```

---

### III. Offline-First Data Flow (NON-NEGOTIABLE)

**localStorage as primary storage**, cloud sync as secondary.

**Data Flow**:
```
User Action
  → Update in-memory state
    → Add to pendingChanges queue
      → Save to localStorage (IMMEDIATE)
        → Display pending indicator (⏳)
          → Manual sync button
            → POST to Supabase
              → Clear pendingChanges on success
                → Reload fresh data
```

**Rules**:
- ✅ Every data mutation goes to localStorage FIRST
- ✅ Pending changes queued for background sync
- ✅ App works 100% offline
- ✅ Sync is manual (button click)
- ❌ NO optimistic cloud writes
- ❌ NO auto-sync (prevents data loss)

**Verification**:
```javascript
// Every data change should follow this pattern:
athletesData.push(newAthlete);  // 1. Update in-memory
pendingChanges.push({...});     // 2. Queue for sync
localStorage.setItem('athletesData', JSON.stringify(athletesData)); // 3. Persist
```

---

### IV. Mobile-First Design (NON-NEGOTIABLE)

**Mobile-only** - No desktop considerations.

**Target Devices**:
- ✅ Safari iOS (primary)
- ✅ Chrome Android (secondary)
- ❌ Desktop browsers (not optimized)

**Design Standards**:
- Touch targets: Minimum 44x44px (Apple HIG)
- Font size: Minimum 14px body text
- Viewport: `width=device-width, initial-scale=1, maximum-scale=1`
- Orientation: Portrait only
- Gestures: Tap, scroll, swipe (no hover states)

**Performance Targets**:
- Page load: <2s on 3G
- Touch response: <100ms
- Sync operation: <5s on normal network
- Battery drain: Minimal (no background tasks)

**Verification**:
```bash
# Check viewport meta tag
grep 'width=device-width' index.html

# Check touch target sizes in CSS
grep -E 'min-(width|height):\s*44px' index.html
```

---

### V. Dark Theme Only (NON-NEGOTIABLE)

**Fixed dark color palette** - No theming system.

**Color Palette**:
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

**Rules**:
- ✅ Use only these colors
- ❌ NO light theme
- ❌ NO dynamic theming
- ❌ NO CSS variables for colors (inline values only)

**Verification**:
```bash
# Check for light theme code
grep -i "light.*theme\|theme.*light" index.html && echo "❌ VIOLATION" || echo "✅ OK"
```

---

### VI. Russian Language Only (NON-NEGOTIABLE)

**No internationalization** - All UI text in Russian.

**Rules**:
- ✅ All buttons, labels, messages in Russian
- ✅ Error messages in Russian ("Нет интернета")
- ✅ Console logs can be English (developer-facing)
- ❌ NO English UI text
- ❌ NO i18n system

**Verification**:
```bash
# Check for English UI text patterns (allow console.log)
grep -E '<button|<label|alert\(|innerHTML.*=.*["\']' index.html | \
  grep -v 'console.log' | \
  grep -E '[A-Za-z]{3,}' && echo "⚠️ Check for English text" || echo "✅ OK"
```

---

## Technical Standards

### Data Persistence

**localStorage API** (5-10MB quota):
```javascript
// Required keys
localStorage.athletesData     // Array of athletes
localStorage.exercisesData    // Array of exercises
localStorage.goalsData        // Array of goals
localStorage.pendingChanges   // Queue for sync
localStorage.lastSaved        // Timestamp
```

**Supabase PostgreSQL** (cloud backup):
```sql
-- Tables
athletes       -- Student records
exercises      -- Exercise definitions
goals          -- Student goals
performances   -- Workout records
```

**Rules**:
- ✅ localStorage = source of truth during offline
- ✅ Supabase = source of truth after sync
- ✅ Last-write-wins conflict resolution
- ❌ NO complex CRDT or operational transforms

---

### State Management

**Plain JavaScript objects** - No state library.

**Global State**:
```javascript
let athletesData = [];      // Loaded from localStorage/Supabase
let exercisesData = [];     // Exercise catalog
let goalsData = [];         // Active goals
let pendingChanges = [];    // Offline mutations
let currentSeason = {};     // Sept-Aug academic year
```

**Rules**:
- ✅ Mutable state (performance over purity)
- ✅ Direct array/object manipulation
- ❌ NO Redux, MobX, or state frameworks
- ❌ NO immutability helpers

---

### Code Style

**BEM-inspired naming** for CSS:
```css
.athlete-card { }
.athlete-card__header { }
.athlete-card__header--active { }
```

**ES6+ JavaScript**:
- Arrow functions: `() => {}`
- Template literals: `` `Hello ${name}` ``
- Destructuring: `const { id, name } = athlete`
- Async/await: `async function syncData() { await fetch(...) }`

**No semicolons** (consistent omission):
```javascript
const foo = 'bar'
console.log(foo)
```

**Inline styles** (no external CSS):
```html
<style>
  /* All CSS here */
</style>
```

---

## Security Standards

### Current State (MVP)

**⚠️ ACCEPTABLE FOR MVP** (internal tool, single coach, non-sensitive data):
- ❌ No authentication
- ❌ No API authorization
- ❌ No input sanitization
- ❌ No XSS protection
- ❌ No CSRF tokens

### Production Requirements

**BEFORE PUBLIC RELEASE**:
- ✅ Google OAuth authentication
- ✅ API key/token authorization
- ✅ Client + server input validation
- ✅ Content Security Policy headers
- ✅ HTTPS enforcement
- ✅ Supabase RLS hardening (coach-only writes)

**Migration Path**:
```sql
-- Example RLS policy for production
FOR SELECT USING (true)                    -- Anyone can read
FOR INSERT WITH CHECK (auth.uid() = coach_id)  -- Only coach can create
FOR UPDATE USING (auth.uid() = coach_id)       -- Only coach can update
FOR DELETE USING (auth.uid() = coach_id)       -- Only coach can delete
```

---

## Development Workflow

### File Organization

**Root Files**:
```
index.html          # Main PWA application
manifest.json       # PWA manifest
sw.js               # Service Worker
CLAUDE.md           # AI development instructions
README.md           # User documentation
```

**Directories**:
```
docs/               # Documentation
  ├── SUPABASE.md      # Supabase integration guide
  ├── TESTING.md       # Testing instructions
  └── archive/         # Historical logs
specs/              # Feature specifications (SpecKit)
  ├── 000-*            # Feature folders (spec.md, plan.md, tasks.md)
  ├── 001-*
  └── 006-*
migration/          # Database migration scripts (Node.js)
  ├── import-from-moyklass.js
  ├── package.json
  └── *.js
supabase/           # Database schema
  └── migrations/
.specify/           # SpecKit framework
  ├── memory/
  ├── scripts/
  └── templates/
```

**Rules**:
- ✅ Single-file PWA in root (`index.html`)
- ✅ Migration scripts in `migration/` (not bundled)
- ✅ Documentation in `docs/`
- ✅ Feature specs in `specs/NNN-name/`
- ❌ NO scattered test files (`test_*.py` in random places)
- ❌ NO debug scripts in root (`debug.sh`, `script.py`)

---

### Git Workflow

**Branching Strategy**:
- `main` - Production-ready code
- `feature/name` - Feature branches (if complex)
- Direct commits to `main` allowed (small project)

**Commit Pattern**:
```bash
# Feature
git commit -m "Add: Exercise type filter in header
- New chip filter for exercise types
- Touch-optimized for mobile
- Preserves offline-first data flow

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Fix
git commit -m "Fix: Performance sync to Supabase
- Corrected data format mapping
- Fixed Russian → English key transformation
- Resolves issue #42"

# Docs
git commit -m "Docs: Update CLAUDE.md with Feature 005 status"
```

**Rules**:
- ✅ Descriptive commit messages (not "fix", "update")
- ✅ Co-Authored-By for AI contributions
- ✅ Link to issues when fixing bugs
- ❌ NO force push to main
- ❌ NO committing secrets (.env files)

---

### Testing Strategy

**Manual Testing Protocol**:
1. Desktop preview: Chrome DevTools device mode
2. Real device: Safari iOS (primary) + Chrome Android (secondary)
3. Offline mode: Airplane mode testing
4. Sync testing: Edit offline → reconnect → sync

**Test Scenarios**:
- [ ] Search filter (Russian input)
- [ ] Group chips filter
- [ ] Athlete details modal
- [ ] Performance edit saves locally
- [ ] Pending indicator (⏳)
- [ ] Sync button uploads changes
- [ ] Goal completion toggles
- [ ] Season indicator calculates correctly

**No Automated Tests** (rationale: small single-file app, manual sufficient)

---

## Dependency Policy

### Runtime Dependencies

**FORBIDDEN** in PWA runtime:
- ❌ npm packages
- ❌ JavaScript frameworks (React, Vue, Angular)
- ❌ CSS frameworks (Bootstrap, Tailwind)
- ❌ Build tools (Webpack, Vite, Rollup)

**ALLOWED** via CDN (essential only):
- ✅ Supabase JS SDK (`@supabase/supabase-js@2`) - Database client
- ⚠️ Must be loaded from CDN, not bundled
- ⚠️ Must be critical functionality (not convenience)

**Verification**:
```html
<!-- ALLOWED: CDN import for essential service -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- FORBIDDEN: npm import or bundled code -->
<script src="/node_modules/..."></script>
```

### Development Dependencies

**ALLOWED** in `migration/` and dev tooling:
- ✅ `@supabase/supabase-js` - Data import scripts
- ✅ `pg` - PostgreSQL direct connection
- ✅ `dotenv` - Environment variables
- ✅ Database migration tools
- ✅ Testing utilities (if needed)

**NOT bundled into PWA**:
```bash
# These run separately, not in browser
node migration/import-from-moyklass.js   # ✅ OK
npm run migrate                          # ✅ OK

# index.html does NOT require npm install
open index.html  # ✅ Works without npm
```

**package.json Purpose**: Development tooling only
```json
{
  "name": "wu-coach2-dev-tools",
  "description": "Development and migration scripts (NOT runtime dependencies)",
  "scripts": {
    "import": "node migration/import-from-moyklass.js",
    "migrate": "psql -f supabase/migrations/*.sql"
  },
  "devDependencies": {
    "@supabase/supabase-js": "^2.x",
    "pg": "^8.x"
  }
}
```

---

## Performance Standards

### Mobile Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load | <2s on 3G | Lighthouse |
| Touch response | <100ms | Manual testing |
| Sync operation | <5s | Network tab |
| Battery drain | Minimal | iOS Battery settings |

### Optimization Techniques

**Applied**:
- ✅ Single file = Single HTTP request
- ✅ No external assets = No extra requests
- ✅ localStorage = Fast local reads
- ✅ Minimal animations = Low CPU usage

**Not yet applied** (future):
- ⏭️ Service Worker offline caching
- ⏭️ Asset minification
- ⏭️ Image optimization
- ⏭️ Code splitting (ONLY if file becomes >1MB)

---

## Governance

### Constitution Authority

**This document supersedes all other practices**:
- CLAUDE.md provides operational guidance
- Constitution provides non-negotiable rules
- In case of conflict, Constitution wins

### Amendment Process

**To change this constitution**:
1. Document proposed change with rationale
2. Assess impact on existing code
3. Create migration plan if needed
4. Update constitution version
5. Update all affected documentation

### Compliance Verification

**Every PR/commit must verify**:
- [ ] Single-file architecture maintained
- [ ] No runtime dependencies added
- [ ] Offline-first data flow preserved
- [ ] Mobile-first design maintained
- [ ] Dark theme only
- [ ] Russian language only

**Auto-verification** (optional GitHub Action):
```bash
#!/bin/bash
# verify-constitution.sh

# Check single-file
test $(find . -name "*.html" | grep -v node_modules | wc -l) -eq 1 || exit 1

# Check no runtime deps
! grep -q "node_modules" index.html || exit 1

# Check dark theme
! grep -qi "light.*theme" index.html || exit 1

echo "✅ Constitution compliance verified"
```

---

## Migration from Google Sheets

**Historical Context** (for reference):

The project originally used Google Apps Script and Google Sheets as backend:
- Athletes, exercises, goals stored in Google Sheets
- `syncWithGoogleSheets()` function for data sync
- Service account credentials for API access

**Current State** (Supabase):
- Migrated to Supabase PostgreSQL (November 2025)
- `syncWithSupabase()` function replaces Google Sheets sync
- Moyklass CRM integration via GitHub Actions
- 50-60% faster sync performance

**Old code preserved** (commented out, not deleted):
- Allows rollback if Supabase migration fails
- Reference for data transformation logic
- Historical documentation

---

**Version**: 1.0.0
**Ratified**: 2025-11-23
**Last Amended**: 2025-11-23
**Status**: ✅ Active
