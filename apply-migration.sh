#!/bin/bash

# LegalSmart Migration Application Script
# This script applies the complete database migration for the users table refactor

set -e

echo "🚀 LegalSmart Database Migration Application"
echo "============================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "src/supabase/migrations/20250615181517_solitary_haze.sql" ]; then
    echo "❌ Migration file not found. Please run this script from the wakiliaiweb directory."
    exit 1
fi

echo "📋 Checking Supabase connection..."

# Apply the migration
echo "🔄 Applying database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please check the logs above."
    exit 1
fi

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📊 Database Schema Summary:"
echo "- ✅ Users table with user_type enum (citizen/lawyer)"
echo "- ✅ Lawyer profiles for additional lawyer info"
echo "- ✅ AI conversations and messages tables"
echo "- ✅ AI usage analytics tracking"
echo "- ✅ Legal knowledge base for RAG"
echo "- ✅ All existing tables (contracts, documents, cases, etc.)"
echo "- ✅ Row Level Security (RLS) policies"
echo "- ✅ Indexes for optimal performance"
echo "- ✅ User creation trigger for auto profile creation"
echo ""
echo "🔧 Next Steps:"
echo "1. Test user registration and profile creation"
echo "2. Test AI chat functionality with new schema"
echo "3. Verify usage analytics are being tracked"
echo "4. Test lawyer profile creation for lawyer users"
echo ""
echo "📚 For troubleshooting, see:"
echo "- LEGAL_AI_RAG_DEPLOYMENT_GUIDE.md"
echo "- DEPLOYMENT_CHECKLIST.md"
