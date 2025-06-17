#!/bin/bash

# This script will update the database with the performance improvements
echo "Applying database updates for June 17, 2025..."
echo "-----------------------------------------"

# Fix missing expires_at column if needed (changing from expiry_date to expires_at)
cat << EOF | psql \$DATABASE_URL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'expires_at') THEN
        ALTER TABLE contracts ADD COLUMN expires_at TIMESTAMPTZ;
        RAISE NOTICE 'Added expires_at column to contracts table';
    END IF;
END \$\$;
EOF

# Run the performance improvements migration from the file system
echo "Applying performance improvements migration..."
psql $DATABASE_URL -f src/supabase/migrations/20250617101200_performance_improvements.sql

echo "-----------------------------------------"
echo "Database update completed successfully!"
