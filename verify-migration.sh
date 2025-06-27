#!/bin/bash

# LegalSmart Migration Verification Script
# This script verifies that the migration was applied correctly

set -e

echo "🔍 LegalSmart Migration Verification"
echo "====================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "📋 Verifying database schema..."

# Function to run SQL and check result
run_verification_query() {
    local description=$1
    local query=$2
    local expected_result=$3
    
    echo -n "  ➤ $description... "
    
    result=$(supabase db psql -c "$query" -t --csv 2>/dev/null | head -1 | tr -d ' ')
    
    if [ "$result" = "$expected_result" ]; then
        echo "✅"
    else
        echo "❌ (Expected: $expected_result, Got: $result)"
        return 1
    fi
}

# Verify core tables exist
echo ""
echo "🗃️  Verifying core tables..."
run_verification_query "Users table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users';" "1"
run_verification_query "Lawyer profiles table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'lawyer_profiles';" "1"
run_verification_query "AI conversations table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ai_conversations';" "1"
run_verification_query "AI messages table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ai_messages';" "1"
run_verification_query "AI usage analytics table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ai_usage_analytics';" "1"
run_verification_query "Legal knowledge base table exists" "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'legal_knowledge_base';" "1"

# Verify user_type enum
echo ""
echo "🏷️  Verifying enums..."
run_verification_query "user_type enum exists" "SELECT COUNT(*) FROM pg_type WHERE typname = 'user_type';" "1"
run_verification_query "user_type has citizen option" "SELECT COUNT(*) FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_type' AND e.enumlabel = 'citizen';" "1"
run_verification_query "user_type has lawyer option" "SELECT COUNT(*) FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_type' AND e.enumlabel = 'lawyer';" "1"

# Verify user table structure
echo ""
echo "👤 Verifying users table structure..."
run_verification_query "Users table has user_type column" "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type';" "1"
run_verification_query "Users table has email column" "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email';" "1"
run_verification_query "Users table has full_name column" "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name';" "1"

# Verify foreign key relationships
echo ""
echo "🔗 Verifying foreign key relationships..."
run_verification_query "Lawyer profiles references users" "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'lawyer_profiles' AND constraint_name LIKE '%user_id%';" "1"
run_verification_query "AI conversations references users" "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'ai_conversations' AND constraint_name LIKE '%user_id%';" "1"
run_verification_query "AI usage analytics references users" "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'ai_usage_analytics' AND constraint_name LIKE '%user_id%';" "1"

# Verify RLS is enabled
echo ""
echo "🔐 Verifying Row Level Security..."
run_verification_query "RLS enabled on users" "SELECT COUNT(*) FROM pg_class WHERE relname = 'users' AND relrowsecurity = true;" "1"
run_verification_query "RLS enabled on ai_conversations" "SELECT COUNT(*) FROM pg_class WHERE relname = 'ai_conversations' AND relrowsecurity = true;" "1"
run_verification_query "RLS enabled on ai_usage_analytics" "SELECT COUNT(*) FROM pg_class WHERE relname = 'ai_usage_analytics' AND relrowsecurity = true;" "1"

# Verify indexes exist
echo ""
echo "📊 Verifying performance indexes..."
run_verification_query "Index on ai_conversations.user_id" "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ai_conversations' AND indexname = 'idx_ai_conversations_user_id';" "1"
run_verification_query "Index on ai_messages.conversation_id" "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ai_messages' AND indexname = 'idx_ai_messages_conversation_id';" "1"
run_verification_query "Index on ai_usage_analytics.user_id" "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'ai_usage_analytics' AND indexname = 'idx_ai_usage_analytics_user_id';" "1"

# Verify triggers exist
echo ""
echo "⚡ Verifying triggers..."
run_verification_query "User creation trigger exists" "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';" "1"
run_verification_query "Updated_at trigger on users" "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'update_users_updated_at';" "1"
run_verification_query "Updated_at trigger on ai_conversations" "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'update_ai_conversations_updated_at';" "1"

echo ""
echo "🎉 Migration verification completed!"
echo ""
echo "✅ All critical components verified:"
echo "   • Core tables structure"
echo "   • User type enum and relationships" 
echo "   • AI system tables"
echo "   • Foreign key constraints"
echo "   • Row Level Security policies"
echo "   • Performance indexes"
echo "   • Database triggers"
echo ""
echo "🚀 Your database is ready for the new user model and RAG system!"
echo ""
echo "📋 Next steps:"
echo "1. Test user registration in your frontend"
echo "2. Test AI chat functionality"
echo "3. Verify usage analytics are being tracked"
echo "4. Run end-to-end tests"
