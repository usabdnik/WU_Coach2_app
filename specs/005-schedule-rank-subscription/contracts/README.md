# API Contracts

**Feature**: 005-schedule-rank-subscription
**Date**: 2025-11-11

## No New API Endpoints

This feature does **not** introduce new API endpoints or contracts. All data operations use existing Supabase client methods:

### Database Operations (Supabase Client)

All operations use standard Supabase JS SDK methods on existing `athletes` table:

```javascript
// READ: Fetch athlete with schedule/ranks
const { data } = await supabase
  .from('athletes')
  .select('*')
  .eq('id', athleteId)
  .single();

// UPDATE: Save schedule
await supabase
  .from('athletes')
  .update({ schedule: 'Пн 18:00, Ср 19:00' })
  .eq('id', athleteId);

// UPDATE: Save ranks
await supabase
  .from('athletes')
  .update({
    rank_start: 'III юношеский разряд',
    rank_end: 'II юношеский разряд'
  })
  .eq('id', athleteId);
```

### External API (Moyklass CRM)

Subscription history filtering uses existing Moyklass API integration:

```javascript
// Fetch subscription history (existing endpoint)
GET https://api.moyklass.com/v1/subscriptions
Authorization: Bearer {MOYKLASS_API_KEY}

// Filter by date range (client-side)
subscriptions.filter(sub =>
  sub.start_date <= seasonEnd && sub.end_date >= seasonStart
);
```

**Reference**: See `SUPABASE_MOYKLASS_INTEGRATION.md` for existing API integration details.

## Why No New Contracts?

1. **Schema Extension Only**: Feature adds columns to existing `athletes` table (no new resources)
2. **Supabase Auto-Generated**: Supabase automatically exposes new columns via existing CRUD endpoints
3. **No Custom Endpoints**: No business logic requiring custom API routes
4. **Client-Side Filtering**: Subscription filtering done in JavaScript (no server-side endpoint needed)

## Data Model Reference

See [data-model.md](../data-model.md) for complete schema specification of new `schedule`, `rank_start`, and `rank_end` fields.
