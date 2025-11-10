# Row Level Security (RLS) Policies

**Feature**: 004-supabase-migration
**Purpose**: Data access control policies for Supabase PostgreSQL
**Security Model**: Authenticated-only access (single coach)
**Date**: 2025-11-10

---

## Overview

Row Level Security (RLS) policies control access to database rows based on user authentication and permissions. For WU Coach 2 MVP, we use a simple authenticated-only model (no row-level filtering) suitable for single-coach usage.

**Security Principles**:
- ✅ Enable RLS on all tables (defense in depth)
- ✅ Require authentication (no anonymous access)
- ✅ Full access for authenticated users (simple, performant)
- ❌ No row-level filtering (unnecessary for single coach)
- ❌ No complex permission hierarchies

---

## RLS Status by Table

| Table | RLS Enabled | Policy Type | Access Level |
|-------|-------------|-------------|--------------|
| `athletes` | ✅ Yes | Authenticated-only | Full CRUD |
| `exercises` | ✅ Yes | Authenticated-only | Full CRUD |
| `goals` | ✅ Yes | Authenticated-only | Full CRUD |
| `performances` | ✅ Yes | Authenticated-only | Full CRUD |

---

## Enable RLS on All Tables

```sql
-- Enable Row Level Security
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
```

**Why Enable RLS?**
- Security best practice (explicit > implicit)
- Prevents accidental data exposure
- Easy to add filtering later if needed
- Required for Supabase realtime subscriptions

---

## Policy Definitions

### 1. Athletes Table Policies

```sql
-- Policy: Allow authenticated users to SELECT all athletes
CREATE POLICY "Authenticated users can view athletes"
ON athletes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT athletes
CREATE POLICY "Authenticated users can insert athletes"
ON athletes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE athletes
CREATE POLICY "Authenticated users can update athletes"
ON athletes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE athletes
CREATE POLICY "Authenticated users can delete athletes"
ON athletes
FOR DELETE
TO authenticated
USING (true);
```

**Simplified Alternative** (Single policy for all operations):

```sql
CREATE POLICY "Authenticated users full access to athletes"
ON athletes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### 2. Exercises Table Policies

```sql
CREATE POLICY "Authenticated users full access to exercises"
ON exercises
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Rationale**:
- Exercises are shared resources (not user-specific)
- Coach needs to add/edit/delete exercises
- No filtering needed (all exercises visible to coach)

---

### 3. Goals Table Policies

```sql
CREATE POLICY "Authenticated users full access to goals"
ON goals
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Rationale**:
- Goals belong to athletes, not coaches (for MVP)
- Single coach sees all goals for all athletes
- Filtering by athlete_id done in application layer

---

### 4. Performances Table Policies

```sql
CREATE POLICY "Authenticated users full access to performances"
ON performances
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Rationale**:
- Performance records are historical data
- Coach needs full read/write access
- No sensitive data requiring filtering

---

## Authentication Flow

### PWA Authentication (Future)

**Current MVP**: No authentication (anon key for public access)

```javascript
// Option A: Public anon access (MVP)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// All queries work without auth (if RLS disabled or policies allow anon)
// NOT RECOMMENDED for production
```

**Recommended (Post-MVP)**: Authenticated access with email/password

```javascript
// Option B: Email/password authentication
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sign in
const { data: session, error } = await supabase.auth.signInWithPassword({
  email: 'coach@example.com',
  password: 'secure-password'
})

if (!error) {
  // Session stored in localStorage automatically
  // All future queries use authenticated session

  const { data: athletes } = await supabase.from('athletes').select('*')
  // Works because user is authenticated
}
```

---

## Migration Path to Multi-Coach

### Current (Single Coach)

```sql
-- No coach_id column needed
CREATE POLICY "Authenticated users full access"
ON athletes FOR ALL TO authenticated
USING (true) WITH CHECK (true);
```

### Future (Multi-Coach)

**Step 1**: Add coach_id column

```sql
ALTER TABLE athletes ADD COLUMN coach_id uuid REFERENCES auth.users(id);
ALTER TABLE goals ADD COLUMN coach_id uuid REFERENCES auth.users(id);
ALTER TABLE performances ADD COLUMN coach_id uuid REFERENCES auth.users(id);

-- Exercises remain shared (no coach_id)
```

**Step 2**: Update policies to filter by coach

```sql
-- Drop old policies
DROP POLICY "Authenticated users full access" ON athletes;
DROP POLICY "Authenticated users full access" ON goals;
DROP POLICY "Authenticated users full access" ON performances;

-- Create new filtered policies
CREATE POLICY "Users can access their own athletes"
ON athletes FOR ALL TO authenticated
USING ((SELECT auth.uid()) = coach_id)
WITH CHECK ((SELECT auth.uid()) = coach_id);

CREATE POLICY "Users can access their own goals"
ON goals FOR ALL TO authenticated
USING ((SELECT auth.uid()) = coach_id)
WITH CHECK ((SELECT auth.uid()) = coach_id);

CREATE POLICY "Users can access their own performances"
ON performances FOR ALL TO authenticated
USING ((SELECT auth.uid()) = coach_id)
WITH CHECK ((SELECT auth.uid()) = coach_id);

-- Exercises remain shared (all coaches see all exercises)
CREATE POLICY "All authenticated users can access exercises"
ON exercises FOR ALL TO authenticated
USING (true) WITH CHECK (true);
```

**Step 3**: Update sync function to include coach_id

```sql
-- In sync_offline_changes function
INSERT INTO athletes (id, name, group_name, season, status, coach_id)
VALUES (
  ...,
  (SELECT auth.uid())  -- Auto-assign current user as coach
);
```

---

## Security Considerations

### Current MVP Security

**Strengths**:
- ✅ RLS enabled (baseline protection)
- ✅ Simple policies (easy to audit)
- ✅ No complex permission logic (fewer bugs)

**Weaknesses**:
- ❌ No authentication required (anon key access)
- ❌ Anyone with anon key can read/write all data
- ❌ No audit trail (who changed what)

**Acceptable Because**:
- Internal tool (single coach, trusted users)
- No sensitive PII (just athlete names and exercise data)
- Low risk tolerance (coaching records, not financial data)

---

### Future Production Security

**When to Harden** (before opening to multiple coaches):

1. **Add Authentication**:
   ```javascript
   // Require sign-in before any database access
   const { data: session } = await supabase.auth.getSession()
   if (!session) {
     // Redirect to login page
     window.location.href = '/login'
   }
   ```

2. **Add coach_id Filtering**:
   - Update policies to use `(SELECT auth.uid()) = coach_id`
   - Auto-assign coach_id on insert

3. **Add Audit Trail**:
   ```sql
   CREATE TABLE audit_log (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id),
     table_name text,
     action text, -- INSERT, UPDATE, DELETE
     row_id uuid,
     changes jsonb,
     created_at timestamptz DEFAULT NOW()
   );

   -- Trigger to log all changes
   CREATE TRIGGER audit_athletes_changes
   AFTER INSERT OR UPDATE OR DELETE ON athletes
   FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
   ```

4. **Add Rate Limiting**:
   - Use Supabase Edge Functions for API rate limiting
   - Prevent abuse from compromised anon key

---

## Performance Optimization

### RLS Performance Best Practices

**❌ SLOW** (function called for every row):
```sql
CREATE POLICY "slow_policy" ON goals
USING (auth.uid() = coach_id);
```

**✅ FAST** (function called once, result cached):
```sql
CREATE POLICY "fast_policy" ON goals
USING ((SELECT auth.uid()) = coach_id);
```

**Why?** Wrapping `auth.uid()` in `SELECT` allows PostgreSQL to cache the result instead of recalculating for every row.

### Index for RLS (Future)

```sql
-- When adding coach_id filtering
CREATE INDEX idx_athletes_coach_id ON athletes(coach_id);
CREATE INDEX idx_goals_coach_id ON goals(coach_id);
CREATE INDEX idx_performances_coach_id ON performances(coach_id);
```

---

## Testing Checklist

### MVP (No Auth)

- [ ] Verify RLS enabled on all tables
- [ ] Verify anon key can read athletes
- [ ] Verify anon key can insert goals
- [ ] Verify anon key can update performances
- [ ] Verify anon key can delete records

### Post-MVP (With Auth)

- [ ] Verify unauthenticated requests fail
- [ ] Verify authenticated user can read own data
- [ ] Verify authenticated user cannot read other coach's data
- [ ] Verify coach_id auto-assigned on insert
- [ ] Verify policy performance (no N+1 queries)

---

## Deployment SQL

```sql
-- Complete RLS setup for deployment

-- Step 1: Enable RLS
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies (MVP - authenticated-only)
CREATE POLICY "Authenticated users full access to athletes"
ON athletes FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to exercises"
ON exercises FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to goals"
ON goals FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access to performances"
ON performances FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Step 3: Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Troubleshooting

### Issue: "new row violates row-level security policy"

**Cause**: Trying to insert data that violates `WITH CHECK` clause

**Solution**:
```javascript
// Ensure authenticated session exists
const { data: session } = await supabase.auth.getSession()
if (!session) {
  await supabase.auth.signInWithPassword({ email, password })
}

// Then retry insert
```

### Issue: Queries return empty results despite data existing

**Cause**: RLS policy `USING` clause filtering out rows

**Solution**:
```sql
-- Check which policies apply to current user
SELECT * FROM pg_policies WHERE tablename = 'athletes';

-- Verify current user role
SELECT current_user, session_user;

-- Test with RLS disabled temporarily (dev only!)
ALTER TABLE athletes DISABLE ROW LEVEL SECURITY;
```

### Issue: Slow queries after enabling RLS

**Cause**: Missing indexes on filter columns

**Solution**:
```sql
-- Add indexes for coach_id filtering (future multi-coach)
CREATE INDEX idx_goals_coach_id ON goals(coach_id);

-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM goals WHERE coach_id = 'uuid-here';
```

---

## Summary

| Aspect | Current (MVP) | Future (Multi-Coach) |
|--------|--------------|---------------------|
| **RLS Enabled** | ✅ Yes | ✅ Yes |
| **Authentication** | ❌ Optional (anon) | ✅ Required |
| **Row Filtering** | ❌ No (all data visible) | ✅ Yes (coach_id filter) |
| **Audit Trail** | ❌ No | ✅ Yes |
| **Suitable For** | Single coach, internal tool | Multiple coaches, production |

---

**Status**: ✅ Complete
**Next Step**: Deploy RLS policies to Supabase
**Deployment**: Copy policy definitions to `.specify/supabase/rls_policies.sql`
