#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data, error } = await supabase
  .from('athletes')
  .select('id, name')
  .ilike('name', '%Шайга%');

if (error) console.error('Error:', error);
else console.log('Found:', JSON.stringify(data, null, 2));
