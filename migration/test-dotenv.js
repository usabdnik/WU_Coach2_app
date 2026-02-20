import dotenv from 'dotenv';

console.log('Testing dotenv loading...\n');

dotenv.config();
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Found' : '❌ Not found');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Found' : '❌ Not found');
