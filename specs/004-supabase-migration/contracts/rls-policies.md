# Row Level Security (RLS) Policies

**Feature**: Supabase Migration
**Purpose**: Define access control rules for all database tables

## Overview

RLS policies control who can read, insert, update, and delete rows in each table. For MVP (single coach, internal tool), we use permissive policies with future hardening planned.

---

## Policy Strategy

**MVP Phase (Current)**:
- **Anon Key**: Full read/write access to all tables (no authentication required)
- **Service Role Key**: Full admin access for migration scripts
- **Rationale**: Internal tool, trusted users, acceptable risk per constitution security posture

**Production Phase (Future)**:
- Google OAuth authentication required
- Coach role can CRUD their own data
- Students can read their own records only
- Admin role for multi-coach support

---

## Table Policies

### 1. athletes table

```sql
-- Enable RLS
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous full access (MVP)
CREATE POLICY "anon_athletes_all"
ON athletes
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Policy: Service role full access (migration scripts)
CREATE POLICY "service_athletes_all"
ON athletes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**Access Rules**:
- ✅ Anon users: SELECT, INSERT, UPDATE, DELETE all rows
- ✅ Service role: Full admin access
- ❌ No row-level filtering (all rows visible)

---

### 2. exercises table

```sql
-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous full access (MVP)
CREATE POLICY "anon_exercises_all"
ON exercises
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Policy: Service role full access
CREATE POLICY "service_exercises_all"
ON exercises
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**Access Rules**:
- ✅ Anon users: SELECT, INSERT, UPDATE, DELETE all rows
- ✅ Service role: Full admin access
- ❌ No row-level filtering (all rows visible)

---

### 3. goals table

```sql
-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous full access (MVP)
CREATE POLICY "anon_goals_all"
ON goals
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Policy: Service role full access
CREATE POLICY "service_goals_all"
ON goals
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**Access Rules**:
- ✅ Anon users: SELECT, INSERT, UPDATE, DELETE all rows
- ✅ Service role: Full admin access
- ❌ No row-level filtering (all rows visible)

---

### 4. performances table

```sql
-- Enable RLS
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous full access (MVP)
CREATE POLICY "anon_performances_all"
ON performances
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Policy: Service role full access
CREATE POLICY "service_performances_all"
ON performances
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**Access Rules**:
- ✅ Anon users: SELECT, INSERT, UPDATE, DELETE all rows
- ✅ Service role: Full admin access
- ❌ No row-level filtering (all rows visible)

---

## Security Notes

### Current Risk Acceptance (MVP)

**Acceptable because**:
- Internal tool for single coach
- No sensitive PII beyond first names
- Trusted user base (<50 students)
- Data is not confidential (exercise records)
- Can run offline (air-gapped option)

### Future Hardening (Production)

When user base exceeds 100 OR public launch occurs:

```sql
-- Example: Coach-owned data with Google OAuth
CREATE POLICY "coaches_own_data"
ON athletes
FOR ALL
TO authenticated
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

-- Example: Students read their own records
CREATE POLICY "students_read_own"
ON goals
FOR SELECT
TO authenticated
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE student_email = auth.jwt() ->> 'email'
  )
);
```

---

## Deployment

These policies are deployed via:
1. `.specify/supabase/rls_policies.sql` - SQL file with all policies
2. Task T008: Deploy via Supabase SQL Editor
3. Task T011: Verify policies exist in dashboard → Authentication → Policies

---

## Testing Verification

**Manual Testing Checklist**:
- [ ] All tables show "RLS enabled" in Supabase dashboard
- [ ] Each table has 2 policies (anon_*_all, service_*_all)
- [ ] PWA app can SELECT/INSERT/UPDATE/DELETE using anon key
- [ ] Migration scripts can operate using service role key
- [ ] No 403 Forbidden errors during normal operations

---

**Version**: 1.0.0
**Created**: 2025-11-10
**Author**: Analysis remediation (C2, H2 resolution)
