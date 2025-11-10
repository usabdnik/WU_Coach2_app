# Developer Quickstart: Supabase Migration & MCP Workflow

**Feature**: 004-supabase-migration
**Target Audience**: Developers working on WU Coach 2 PWA
**Estimated Setup Time**: 30 minutes
**Date**: 2025-11-10

---

## Prerequisites

**Required**:
- [x] Supabase account (free tier: https://supabase.com/dashboard)
- [x] Git repository access
- [x] Claude Code with MCP servers enabled (Serena, Context7, Sequential, Morphllm)
- [x] Mobile browser for testing (Safari iOS or Chrome Android)

**Optional**:
- [ ] Supabase CLI (for local development): `npm install -g supabase`
- [ ] PostgreSQL client (psql) for direct database access

---

## Part 1: Supabase Project Setup (15 min)

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name**: `wu-coach-2-pwa`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your location
   - **Plan**: Free tier (sufficient for MVP)
4. Click "Create new project"
5. Wait ~2 min for provisioning

### Step 2: Get Project Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy these values:

```bash
# Save to .specify/memory/SUPABASE_CONTEXT.md
PROJECT_URL=https://YOUR_PROJECT_ID.supabase.co
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Keep secret!
```

**Security Note**:
- ✅ `ANON_KEY`: Safe for client-side (PWA app)
- ❌ `SERVICE_ROLE_KEY`: Never expose in PWA (server-side only for CRM import)

### Step 3: Deploy PostgreSQL Schema

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to **SQL Editor** in Supabase dashboard
2. Create new query
3. Copy contents of `.specify/supabase/schema.sql` (see Part 2 below)
4. Click "Run"
5. Verify tables created: **Database → Tables**

**Option B: Via psql (Advanced)**

```bash
# Connect to Supabase database
psql "postgresql://postgres:[YOUR_PASSWORD]@db.YOUR_PROJECT_ID.supabase.co:5432/postgres"

# Run schema file
\i .specify/supabase/schema.sql
\i .specify/supabase/rls_policies.sql
\i .specify/supabase/functions.sql

# Verify
\dt  # List tables
\df  # List functions
```

---

## Part 2: Schema Files Setup (10 min)

### Create Schema Directory Structure

```bash
mkdir -p .specify/supabase
mkdir -p .specify/memory
mkdir -p migration
```

### Create schema.sql

**File**: `.specify/supabase/schema.sql`

```sql
-- WU Coach 2 PostgreSQL Schema
-- Generated from: specs/004-supabase-migration/data-model.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Athletes table
CREATE TABLE IF NOT EXISTS athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (LENGTH(name) > 0),
  group_name text NOT NULL,
  season text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('strength', 'cardio', 'flexibility', 'skill')),
  category text NOT NULL CHECK (category IN ('upper-body', 'lower-body', 'core', 'full-body')),
  unit text NOT NULL CHECK (unit IN ('reps', 'kg', 'seconds', 'meters')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  target_value numeric(10,2) NOT NULL CHECK (target_value > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_goals_completed_at_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  )
);

-- Performances table
CREATE TABLE IF NOT EXISTS performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  value numeric(10,2) NOT NULL CHECK (value > 0),
  date date NOT NULL DEFAULT CURRENT_DATE CHECK (date <= CURRENT_DATE),
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (athlete_id, exercise_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_athletes_status ON athletes(status);
CREATE INDEX IF NOT EXISTS idx_athletes_season ON athletes(season);
CREATE INDEX IF NOT EXISTS idx_goals_athlete_id ON goals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_goals_exercise_id ON goals(exercise_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at);
CREATE INDEX IF NOT EXISTS idx_performances_athlete_id ON performances(athlete_id);
CREATE INDEX IF NOT EXISTS idx_performances_exercise_id ON performances(exercise_id);
CREATE INDEX IF NOT EXISTS idx_performances_date ON performances(date);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_athletes_updated_at
  BEFORE UPDATE ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
```

**Deploy**: Run this file in Supabase SQL Editor

### Create functions.sql

**File**: `.specify/supabase/functions.sql`

Copy all function definitions from `specs/004-supabase-migration/contracts/rpc-functions.md`

**Deploy**: Run this file in Supabase SQL Editor after schema.sql

### Create rls_policies.sql

**File**: `.specify/supabase/rls_policies.sql`

Copy policy definitions from `specs/004-supabase-migration/contracts/rls-policies.md`

**Deploy**: Run this file in Supabase SQL Editor after functions.sql

---

## Part 3: PWA Integration (5 min)

### Update coach-pwa-app.html

**Add Supabase SDK** (before closing `</head>`):

```html
<!-- Supabase JS SDK via CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Initialize Supabase Client** (in `<script>` section):

```javascript
// Supabase configuration
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'

// Initialize client
const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('✅ Supabase client initialized')
```

**Update Sync Function**:

```javascript
// Replace Google Apps Script sync with Supabase sync
async function syncToSupabase() {
  if (pendingChanges.length === 0) {
    console.log('✅ No pending changes')
    return { success: true }
  }

  try {
    const { data, error } = await supabaseClient.rpc('sync_offline_changes', {
      changes: pendingChanges
    })

    if (error) throw error

    console.log(`✅ Synced ${data.total_processed} changes`)

    // Clear queue
    pendingChanges = []
    localStorage.setItem('pendingChanges', '[]')

    // Reload fresh data
    await loadDataFromSupabase()

    return { success: true, synced: data.total_processed }

  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Load data from Supabase
async function loadDataFromSupabase() {
  try {
    const [goalsResult, athletesResult] = await Promise.all([
      supabaseClient.from('goals').select('*'),
      supabaseClient.from('athletes').select('*')
    ])

    if (goalsResult.error) throw goalsResult.error
    if (athletesResult.error) throw athletesResult.error

    goalsData = goalsResult.data || []
    athletesData = athletesResult.data || []

    // Save to localStorage as backup
    localStorage.setItem('goalsData', JSON.stringify(goalsData))
    localStorage.setItem('athletesData', JSON.stringify(athletesData))

    console.log(`✅ Loaded ${goalsData.length} goals, ${athletesData.length} athletes`)

    renderGoalsList()
    renderAthletesList()

  } catch (error) {
    console.error('❌ Load failed:', error.message)
    // Fallback to localStorage
    loadDataFromLocalStorage()
  }
}
```

---

## Part 4: MCP Workflow for Autonomous Development

### Serena MCP: Schema Reading

**Use Case**: Read schema once, maintain in memory

```markdown
<!-- In Claude Code conversation -->
User: "Show me the goals table structure"

Claude: *Uses Serena MCP*
```

**Command**:
```bash
# Serena reads file and caches in memory
serena.read_file(".specify/supabase/schema.sql")
```

**Token Savings**: ~70% (no repeated schema pasting)

### Context7 MCP: Supabase Documentation

**Use Case**: Fetch official Supabase patterns

```markdown
User: "How do I use Supabase realtime subscriptions?"

Claude:
  1. resolve-library-id("supabase") → /supabase/supabase
  2. get-library-docs("/supabase/supabase", topic: "realtime")

Returns: Official realtime subscription patterns
```

**Token Savings**: ~50% (cached docs vs web scraping)

### Sequential MCP: Query Optimization

**Use Case**: Systematic query analysis

```markdown
User: "Optimize this query for large datasets"

Claude: *Uses Sequential MCP*

Thought 1: Analyze current query structure
Thought 2: Check index coverage
Thought 3: Test alternative approaches
Thought 4: Measure performance improvements
Thought 5: Recommend optimal solution
```

**Token Savings**: ~40% (structured analysis)

### Morphllm MCP: Bulk Edits

**Use Case**: Pattern-based code updates

```markdown
User: "Update all Supabase queries to use new schema fields"

Claude: *Uses Morphllm MCP*

Pattern: supabase.from('goals').select('*')
Replace: supabase.from('goals').select('id, athlete_id, status, target_value')

Applied to: coach-pwa-app.html (15 matches)
```

**Token Savings**: ~60% (single pattern vs 15 edits)

---

## Part 5: Slash Commands (Custom Automation)

### Create /db-query Command

**File**: `.claude/commands/db-query.md`

```markdown
Generate Supabase query using:
1. Schema from .specify/supabase/schema.sql (via Serena MCP)
2. TypeScript types from .specify/supabase/types.ts
3. Context7 for Supabase JS patterns

**Table**: $1
**Operation**: $2 (select|insert|update|delete)
**Filters**: $3 (optional, e.g., "status=completed")

Output: JavaScript code with error handling
```

**Usage**:
```bash
/db-query goals select "status=completed"
```

**Output**:
```javascript
const { data, error } = await supabaseClient
  .from('goals')
  .select('*')
  .eq('status', 'completed')

if (error) {
  console.error('Query failed:', error.message)
} else {
  console.log('Goals:', data)
}
```

### Create /db-migrate Command

**File**: `.claude/commands/db-migrate.md`

```markdown
Create migration file using:
1. Current schema from .specify/supabase/schema.sql
2. Requested changes: $1

Output:
- Timestamped migration file (migration/YYYYMMDD_HHMMSS_description.sql)
- Rollback script

**Changes**: $1
```

**Usage**:
```bash
/db-migrate "add column notes text to goals table"
```

**Output**:
```sql
-- migration/20241110_153000_add_notes_to_goals.sql

-- UP migration
ALTER TABLE goals ADD COLUMN notes text;

-- DOWN migration (rollback)
-- ALTER TABLE goals DROP COLUMN notes;
```

---

## Part 6: Testing Workflow

### Local Testing (Offline Mode)

1. **Open PWA in mobile browser**:
   ```
   http://localhost:8000/coach-pwa-app.html
   # Or file:///path/to/coach-pwa-app.html
   ```

2. **Enable airplane mode** (iOS/Android)

3. **Test offline functionality**:
   - Add new goal → Should save to localStorage
   - Edit goal → Should update localStorage
   - Check pending indicator → Should show ⏳

4. **Disable airplane mode**

5. **Click sync button**:
   - Pending changes upload to Supabase
   - Fresh data loads from Supabase
   - Pending indicator clears

### Production Testing (Real Device)

1. **Deploy PWA to web server**
2. **Open on Safari iOS or Chrome Android**
3. **Test all CRUD operations**:
   - Create goal
   - Update goal status
   - Delete goal
   - View performance history

4. **Test offline sync**:
   - Enable airplane mode
   - Make changes (5-10 goals)
   - Disable airplane mode
   - Sync
   - Verify all changes in Supabase dashboard

---

## Part 7: Data Migration (One-Time)

### Export from Google Sheets

**Manual CSV Export**:
1. Open Google Sheets
2. File → Download → Comma-separated values (.csv)
3. Save as `data/athletes.csv`, `data/goals.csv`, etc.

**Or use Google Sheets API** (optional):
```javascript
// migration/export-from-sheets.js
const { google } = require('googleapis')

async function exportSheets() {
  const sheets = google.sheets('v4')
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: 'YOUR_SHEET_ID',
    range: 'Athletes!A1:Z1000'
  })

  const athletes = response.data.values.map(row => ({
    id: crypto.randomUUID(),
    name: row[0],
    group_name: row[1],
    season: '2024-2025',
    status: row[2].toLowerCase()
  }))

  fs.writeFileSync('data/athletes.json', JSON.stringify(athletes, null, 2))
}
```

### Import to Supabase

**File**: `migration/import-to-supabase.js`

```javascript
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY) // Use service role!

async function importData() {
  // Load JSON files
  const athletes = JSON.parse(fs.readFileSync('data/athletes.json'))
  const exercises = JSON.parse(fs.readFileSync('data/exercises.json'))
  const goals = JSON.parse(fs.readFileSync('data/goals.json'))

  // Import athletes
  const { error: athletesError } = await supabase
    .from('athletes')
    .insert(athletes)

  if (athletesError) {
    console.error('❌ Athletes import failed:', athletesError)
    return
  }

  console.log(`✅ Imported ${athletes.length} athletes`)

  // Import exercises
  const { error: exercisesError } = await supabase
    .from('exercises')
    .insert(exercises)

  if (exercisesError) {
    console.error('❌ Exercises import failed:', exercisesError)
    return
  }

  console.log(`✅ Imported ${exercises.length} exercises`)

  // Import goals
  const { error: goalsError } = await supabase
    .from('goals')
    .insert(goals)

  if (goalsError) {
    console.error('❌ Goals import failed:', goalsError)
    return
  }

  console.log(`✅ Imported ${goals.length} goals`)
  console.log('🎉 Migration complete!')
}

importData()
```

**Run**:
```bash
node migration/import-to-supabase.js
```

### Verify Data Integrity

```javascript
// migration/verify-integrity.js

async function verifyIntegrity() {
  // Count records
  const { count: athletesCount } = await supabase
    .from('athletes')
    .select('*', { count: 'exact', head: true })

  const { count: goalsCount } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })

  console.log(`Athletes: ${athletesCount}`)
  console.log(`Goals: ${goalsCount}`)

  // Checksum (names sorted)
  const { data: athletes } = await supabase
    .from('athletes')
    .select('name')
    .order('name')

  const checksum = athletes.map(a => a.name).join('|')
  console.log(`Checksum: ${checksum.substring(0, 50)}...`)

  // Compare with original CSV/JSON
  // If match → ✅ Migration successful
}
```

---

## Troubleshooting

### Issue: "Invalid API key"

**Solution**: Check `.specify/memory/SUPABASE_CONTEXT.md` for correct keys

### Issue: "new row violates row-level security policy"

**Solution**: Verify RLS policies deployed correctly:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Issue: Offline sync not working

**Solution**:
1. Check `pendingChanges` in localStorage
2. Verify network status: `navigator.onLine`
3. Check Supabase function exists: `SELECT * FROM pg_proc WHERE proname = 'sync_offline_changes';`

---

## Next Steps

1. ✅ Setup complete
2. ⏳ Execute migration (`/speckit.tasks` to generate tasks)
3. ⏳ Test PWA on mobile devices
4. ⏳ Measure token usage with MCP workflow
5. ⏳ Update constitution.md with Supabase principles

---

**Setup Status**: ✅ Ready for development
**Estimated Total Time**: 30 minutes
**Support**: See `specs/004-supabase-migration/` for detailed docs
