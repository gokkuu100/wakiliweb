#!/bin/bash

# Script to apply database optimizations and schema changes
# Created: 2025-06-17

# Set variables
DB_NAME="wakilia_legal_ai"
MIGRATIONS_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")/supabase/migrations"

echo "======================================================"
echo "LegalAI Database Performance Update Script"
echo "======================================================"
echo "This script will apply performance optimizations to your Supabase database."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first:"
    echo "https://supabase.io/docs/guides/cli"
    exit 1
fi

# Apply migrations
echo "Applying database migrations..."
supabase db push

# Run optimization queries directly
echo "Applying additional performance optimizations..."
supabase db execute "$MIGRATIONS_DIR/20250617143000_performance_optimizations.sql"

# Verify the changes
echo "Verifying database changes..."
supabase db execute "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';"

echo ""
echo "======================================================"
echo "Database optimization complete!"
echo "======================================================"
echo "The following changes were applied:"
echo "1. Added indexes to frequently queried tables"
echo "2. Created a materialized view for dashboard stats"
echo "3. Added triggers to keep stats updated"
echo "4. Created a mark_all_notifications_read function"
echo ""
echo "Your application should now perform significantly better"
echo "and make fewer redundant database requests."
echo "======================================================"
