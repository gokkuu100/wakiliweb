#!/bin/bash

# Apply user AI preferences table migration
# This script creates the user_ai_preferences table in Supabase

echo "🚀 Creating user AI preferences table..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Apply the SQL migration
echo "📊 Applying SQL migration..."
supabase db reset --db-url $SUPABASE_DB_URL --file scripts/create-user-ai-preferences-table.sql

if [ $? -eq 0 ]; then
    echo "✅ User AI preferences table created successfully!"
    echo ""
    echo "📋 Table features:"
    echo "  • Response style preferences (simple, balanced, detailed, technical)"
    echo "  • Model selection (Citizens: gpt-4o-mini, Lawyers: gpt-4)"
    echo "  • Usage limits and quotas"
    echo "  • Language preferences (English/Swahili)"
    echo "  • Privacy and data settings"
    echo "  • Row Level Security enabled"
    echo ""
    echo "🔧 Next steps:"
    echo "  1. Test the frontend preferences interface"
    echo "  2. Verify AI responses adapt to user preferences"
    echo "  3. Check that lawyers get gpt-4 and citizens get gpt-4o-mini"
else
    echo "❌ Failed to create user AI preferences table"
    exit 1
fi
