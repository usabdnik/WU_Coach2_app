#!/bin/bash

echo "🚀 Opening Supabase SQL Editor..."
open "https://supabase.com/dashboard/project/mjkssesvhowmncyctmvs/sql/new"

echo ""
echo "📋 SQL to execute (also in migration/APPLY_SQL_FIX.md):"
echo ""
cat migration/APPLY_SQL_FIX.md | grep -A 100 "CREATE OR REPLACE FUNCTION" | grep -B 100 '$$;' | head -n -1
echo ""
echo "✅ After running SQL, groups will be protected from CRM overwrites"
