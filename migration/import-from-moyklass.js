#!/usr/bin/env node

/**
 * Moyklass CRM → Supabase Import Script
 *
 * Синхронизирует учеников из api.moyklass.com в Supabase
 * - Получает токен через API ключ
 * - Загружает активные абонементы за текущий сезон
 * - Определяет активность по наличию действующего абонемента
 * - Сохраняет через save_athlete_with_validation()
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const MOYKLASS_API_KEY = process.env.MOYKLASS_API_KEY;
const MOYKLASS_BASE_URL = 'https://api.moyklass.com/v1';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mjkssesvhowmncyctmvs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ============================================
// VALIDATION
// ============================================

if (!MOYKLASS_API_KEY) {
  console.error('❌ MOYKLASS_API_KEY not found in environment variables');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in environment variables');
  process.exit(1);
}

// ============================================
// CLIENTS
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
console.log('✅ Supabase client initialized');

// ============================================
// MOYKLASS API FUNCTIONS
// ============================================

/**
 * Get access token from Moyklass API
 */
async function getToken() {
  const response = await fetch(`${MOYKLASS_BASE_URL}/company/auth/getToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: MOYKLASS_API_KEY })
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.accessToken) {
    throw new Error('No accessToken in response');
  }

  return data.accessToken;
}

/**
 * Fetch ALL subscriptions with pagination (not just active)
 * Then filter by season dates client-side
 */
async function fetchActiveSubscriptions(token) {
  const subscriptions = [];
  const limit = 100;
  let offset = 0;

  // Calculate current season: Sept 1 - Aug 31
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  
  // Season starts Sept 1
  // If we're before September, season started last year
  const seasonStartYear = currentMonth < 8 ? currentYear - 1 : currentYear;
  const seasonStart = new Date(seasonStartYear, 8, 1); // Sept 1
  const seasonEnd = today; // Today
  
  console.log(`📅 Сезон: ${seasonStart.toISOString().split('T')[0]} - ${seasonEnd.toISOString().split('T')[0]}`);

  while (true) {
    // Fetch ALL subscriptions (no statusId filter)
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await fetch(`${MOYKLASS_BASE_URL}/company/userSubscriptions?${params}`, {
      headers: { 'x-access-token': token }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
    }

    const data = await response.json();
    const batch = data.subscriptions || [];

    subscriptions.push(...batch);

    if (batch.length < limit) break;

    offset += limit;
    await sleep(250); // Rate limiting
  }

  console.log(`📊 Всего абонементов в CRM: ${subscriptions.length}`);

  // Filter: keep only subscriptions that were active during current season
  // A subscription overlaps with season if:
  // - endDate >= seasonStart (subscription didn't end before season)
  // - beginDate <= seasonEnd (subscription started before or during season)
  const seasonSubscriptions = subscriptions.filter(sub => {
    if (!sub.beginDate) return false; // Invalid subscription
    
    const subStart = new Date(sub.beginDate);
    const subEnd = sub.endDate ? new Date(sub.endDate) : new Date('2099-12-31'); // If no end date, consider it ongoing
    
    // Check overlap with season
    const overlaps = subEnd >= seasonStart && subStart <= seasonEnd;
    
    return overlaps;
  });

  console.log(`✅ Абонементов в текущем сезоне: ${seasonSubscriptions.length}`);
  
  // Log status distribution
  const statusCounts = {};
  seasonSubscriptions.forEach(sub => {
    const status = sub.statusId || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  console.log('📋 По статусам:', statusCounts);

  return seasonSubscriptions;
}

/**
 * Fetch user data by IDs
 */
async function fetchUsersMap(userIds, token) {
  const usersMap = {};
  const chunkSize = 100;

  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);

    const params = new URLSearchParams();
    chunk.forEach(id => params.append('userIds[]', id));

    const response = await fetch(`${MOYKLASS_BASE_URL}/company/users?${params}`, {
      headers: { 'x-access-token': token }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data = await response.json();
    const users = data.users || [];

    users.forEach(user => {
      usersMap[String(user.id)] = user;
    });

    if (chunk.length === chunkSize) {
      await sleep(250); // Rate limiting
    }
  }

  return usersMap;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current season date range (Sept - Aug)
 */
function getSeasonRange() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const seasonStartYear = today.getMonth() >= 8 ? currentYear : currentYear - 1;

  return {
    start: new Date(seasonStartYear, 8, 1), // Sept 1
    end: new Date(seasonStartYear + 1, 7, 31) // Aug 31
  };
}

/**
 * Check if subscription is in current season
 */
function isSubscriptionInSeason(subscription, season) {
  const subBegin = subscription.beginDate ? new Date(subscription.beginDate) : null;
  const subEnd = subscription.endDate ? new Date(subscription.endDate) : null;

  if (!subEnd && !subBegin) return true;

  const seasonStart = season.start.getTime();
  const seasonEnd = season.end.getTime();

  return (
    (!subEnd || subEnd.getTime() >= seasonStart) &&
    (!subBegin || subBegin.getTime() <= seasonEnd)
  );
}

/**
 * Map Moyklass subscription status to database status
 * statusId: 1=paused, 2=active, 3=expired, 4=cancelled
 */
function mapSubscriptionStatus(statusId) {
  const statusMap = {
    '1': 'paused',
    '2': 'active',
    '3': 'expired',
    '4': 'cancelled'
  };
  return statusMap[String(statusId)] || 'unknown';
}

/**
 * Parse full name to lastName + firstName
 */
function parseFullName(fullName) {
  if (!fullName) return { lastName: '', firstName: '' };

  const parts = fullName.trim().split(/\s+/).filter(p => p);

  if (parts.length === 0) return { lastName: '', firstName: '' };

  const lastName = parts[0];
  const firstName = parts.slice(1).join(' ');

  return { lastName, firstName };
}

/**
 * Group subscriptions by user ID
 */
function groupSubscriptionsByUser(subscriptions) {
  const map = {};

  subscriptions.forEach(sub => {
    const userId = String(sub.userId);
    if (!map[userId]) map[userId] = [];
    map[userId].push(sub);
  });

  return map;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SUPABASE SYNC FUNCTIONS
// ============================================

/**
 * Sync subscription records to Supabase
 * Uses upsert logic to avoid duplicates
 */
async function syncSubscriptionsToSupabase(athleteId, subscriptions) {
  if (!subscriptions || subscriptions.length === 0) return;

  let syncedCount = 0;

  for (const sub of subscriptions) {
    try {
      // Check if subscription already exists
      const { data: existing, error: checkError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('moyklass_subscription_id', String(sub.id))
        .maybeSingle();

      if (checkError) throw checkError;

      const subscriptionData = {
        athlete_id: athleteId,
        moyklass_subscription_id: String(sub.id),
        start_date: sub.beginDate || null,
        end_date: sub.endDate || null,
        status: mapSubscriptionStatus(sub.statusId)
      };

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert(subscriptionData);

        if (insertError) throw insertError;
      }

      syncedCount++;

    } catch (err) {
      console.error(`  ⚠️  Subscription ${sub.id} sync failed: ${err.message}`);
    }
  }

  return syncedCount;
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

async function syncAthletesFromMoyklass() {
  try {
    console.log('🚀 Starting Moyklass → Supabase sync...\n');

    // 1. Get access token
    console.log('🔑 Getting Moyklass access token...');
    const token = await getToken();
    console.log('✅ Token received\n');

    // 2. Get current season
    const season = getSeasonRange();
    console.log(`📅 Season: ${season.start.toISOString().split('T')[0]} → ${season.end.toISOString().split('T')[0]}\n`);

    // 3. Fetch active subscriptions
    console.log('📥 Fetching active subscriptions...');
    const allSubscriptions = await fetchActiveSubscriptions(token);
    console.log(`📊 Total subscriptions: ${allSubscriptions.length}`);

    // 4. Filter by season
    const seasonSubscriptions = allSubscriptions.filter(sub =>
      isSubscriptionInSeason(sub, season)
    );
    console.log(`✅ Season subscriptions: ${seasonSubscriptions.length}\n`);

    // 5. Group by user
    const subscriptionsByUser = groupSubscriptionsByUser(seasonSubscriptions);
    const userIds = Object.keys(subscriptionsByUser);
    console.log(`👥 Unique users with subscriptions: ${userIds.length}\n`);

    // 6. Fetch user data
    console.log('📥 Fetching user data...');
    const usersMap = await fetchUsersMap(userIds, token);
    console.log(`✅ Users data received: ${Object.keys(usersMap).length}\n`);

    // 7. Sync to Supabase
    console.log('💾 Syncing to Supabase...\n');

    let athleteSuccessCount = 0;
    let subscriptionSuccessCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const userId of userIds) {
      try {
        const userInfo = usersMap[userId];

        if (!userInfo || !userInfo.name) {
          console.warn(`⚠️  User ${userId}: No name, skipping`);
          continue;
        }

        const { lastName, firstName } = parseFullName(userInfo.name);
        const fullName = `${lastName} ${firstName}`.trim();

        // Determine status: active if has subscription in season
        const status = subscriptionsByUser[userId] && subscriptionsByUser[userId].length > 0
          ? 'active'
          : 'inactive';

        const athleteData = {
          name: fullName,
          // ❌ НЕ обновляем группу из CRM - группы устанавливаются вручную через приложение
          status: status
        };

        // Step 1: Save/update athlete
        const { data: athleteResult, error: athleteError } = await supabase.rpc('save_athlete_with_validation', {
          p_athlete_data: athleteData
        });

        if (athleteError) throw athleteError;

        const athleteId = athleteResult?.athlete_id || athleteResult;
        athleteSuccessCount++;

        // Step 2: Sync subscriptions for this athlete
        const userSubscriptions = subscriptionsByUser[userId] || [];
        const syncedSubs = await syncSubscriptionsToSupabase(athleteId, userSubscriptions);
        subscriptionSuccessCount += syncedSubs;

        console.log(`✅ ${fullName} → ${status} (${syncedSubs} subscriptions)`);

      } catch (err) {
        console.error(`❌ Error syncing user ${userId}:`, err.message);
        errorCount++;
        errors.push({
          userId,
          name: usersMap[userId]?.name,
          error: err.message
        });
      }
    }

    // ============================================
    // SUMMARY
    // ============================================

    console.log('\n' + '='.repeat(50));
    console.log('📊 SYNC RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Athletes synced: ${athleteSuccessCount}`);
    console.log(`✅ Subscriptions synced: ${subscriptionSuccessCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Error details:');
      errors.forEach(err => {
        console.log(`  User ${err.userId} (${err.name}): ${err.error}`);
      });
    }

    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('🎉 Sync completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Sync completed with errors');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Critical error:', error);
    process.exit(1);
  }
}

// ============================================
// RUN
// ============================================

console.log('🚀 Moyklass CRM → Supabase Sync\n');
syncAthletesFromMoyklass();
