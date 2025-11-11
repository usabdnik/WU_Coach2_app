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
 * Fetch active subscriptions with pagination
 */
async function fetchActiveSubscriptions(token) {
  const subscriptions = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      'statusId[]': '2', // Active status
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

  return subscriptions;
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

    let successCount = 0;
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
          group: 'Начинающие', // Default group (can be enhanced later)
          status: status
        };

        // Call Supabase function
        const { data, error } = await supabase.rpc('save_athlete_with_validation', {
          p_athlete_data: athleteData
        });

        if (error) throw error;

        console.log(`✅ ${fullName} → ${status}`);
        successCount++;

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
    console.log(`✅ Success: ${successCount}`);
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
