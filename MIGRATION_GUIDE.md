# LegalSmart Migration Guide: User Profiles to Users Table

## Overview

This migration refactors the LegalSmart database to use a unified `users` table with `user_type` enum instead of separate `user_profiles` table. This change is part of the RAG system enhancement to support Pinecone vector storage and OpenAI integration.

## Key Changes

### 1. Database Schema Changes

#### Before (user_profiles approach):
```sql
-- Separate user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT,
  user_type TEXT, -- 'citizen' or 'lawyer'
  -- other fields...
);
```

#### After (unified users approach):
```sql
-- Unified users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'citizen', -- ENUM
  -- other fields...
);

-- Additional lawyer-specific info in separate table
CREATE TABLE lawyer_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  firm_name TEXT,
  practice_areas TEXT[],
  -- lawyer-specific fields...
);
```

### 2. New AI Tables

The migration adds comprehensive AI system tables:

- `ai_conversations` - Tracks AI chat conversations
- `ai_messages` - Stores individual AI chat messages
- `ai_usage_analytics` - Tracks usage for billing and analytics
- `legal_knowledge_base` - Stores legal documents for RAG system

### 3. Enhanced User Management

- **User Type Enum**: `user_type` is now a proper PostgreSQL enum with values: `citizen`, `lawyer`, `admin`
- **Automatic Profile Creation**: Trigger automatically creates user profile when someone signs up
- **Lawyer Profiles**: Separate table for lawyer-specific information (bar number, practice areas, etc.)

## Migration Files

### Main Migration File
- **Location**: `src/supabase/migrations/20250615181517_solitary_haze.sql`
- **Purpose**: Complete database schema with users table and AI system
- **Features**:
  - Creates all necessary tables and relationships
  - Sets up proper indexes for performance
  - Implements Row Level Security (RLS) policies
  - Creates triggers for automatic profile creation and timestamp updates

### Helper Scripts

1. **apply-migration.sh** - Applies the migration to your Supabase database
2. **verify-migration.sh** - Verifies that the migration was applied correctly

## How to Apply Migration

### Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Supabase project linked**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

### Step 1: Apply Migration

```bash
cd wakiliaiweb
./apply-migration.sh
```

Or manually:
```bash
supabase db push
```

### Step 2: Verify Migration

```bash
./verify-migration.sh
```

This will check:
- All tables were created correctly
- Foreign key relationships are in place
- Indexes are created for performance
- RLS policies are active
- Triggers are working

## Backend Code Changes Required

### 1. Update Import Statements

Replace any imports of `user_profiles` with `users`:

```python
# Before
from app.database.user_profiles import get_user_profile

# After
from app.database.users import get_user
```

### 2. Update Database Queries

Replace `user_profiles` table references:

```python
# Before
query = "SELECT * FROM user_profiles WHERE user_id = %s"

# After  
query = "SELECT * FROM users WHERE id = %s"
```

### 3. Update Foreign Key References

Update any foreign keys that referenced `user_profiles.id`:

```python
# Before
"user_profile_id": user_profile.id

# After
"user_id": user.id
```

## Frontend Code Changes Required

### 1. Update Type Definitions

```typescript
// Before
interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  user_type: 'citizen' | 'lawyer';
}

// After
interface User {
  id: string; // This is now the primary key
  email: string;
  full_name: string;
  user_type: 'citizen' | 'lawyer' | 'admin';
  avatar_url?: string;
  is_verified: boolean;
}
```

### 2. Update API Calls

```typescript
// Before
const { data: userProfile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// After
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

### 3. Update Auth Context

```typescript
// Before
interface AuthUser {
  id: string;
  profile?: UserProfile;
}

// After
interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  user_type: 'citizen' | 'lawyer' | 'admin';
  // ... other user fields
}
```

## Testing Checklist

After applying the migration, test the following:

### 1. User Registration
- [ ] New users can sign up successfully
- [ ] User profile is automatically created in `users` table
- [ ] Default `user_type` is set to 'citizen'
- [ ] Email and full_name are properly stored

### 2. User Authentication
- [ ] Existing users can still log in
- [ ] User data is loaded correctly from `users` table
- [ ] User type is properly displayed in UI

### 3. Lawyer Profiles
- [ ] Lawyers can create additional profile information
- [ ] Lawyer-specific fields are stored in `lawyer_profiles` table
- [ ] Foreign key relationship to `users` table works correctly

### 4. AI System
- [ ] AI conversations can be created and stored
- [ ] AI messages are properly linked to conversations
- [ ] Usage analytics are being tracked
- [ ] RAG system can access legal knowledge base

### 5. Existing Features
- [ ] Contract creation and management still works
- [ ] Document upload and analysis still works
- [ ] Chat functionality still works
- [ ] Billing and subscriptions still work

## Rollback Plan

If you need to rollback the migration:

1. **Create a backup** before applying:
   ```bash
   supabase db dump > backup-before-migration.sql
   ```

2. **Rollback using Supabase CLI**:
   ```bash
   supabase db reset
   # Then apply your previous migration
   ```

3. **Manual rollback** (if needed):
   - Drop the new tables
   - Recreate the old `user_profiles` table
   - Migrate data back if necessary

## Troubleshooting

### Common Issues

1. **Migration fails with foreign key constraint errors**
   - Ensure you have backed up your data
   - Check if there are orphaned records in related tables
   - Clean up orphaned data before reapplying

2. **RLS policies prevent data access**
   - Check that your JWT tokens include the correct user ID
   - Verify RLS policies match your authentication setup
   - Test with service role key first (bypasses RLS)

3. **User creation trigger not working**
   - Check if trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
   - Verify trigger function exists and has correct permissions
   - Test with manual user creation

### Debug Commands

```sql
-- Check table structure
\d users
\d lawyer_profiles
\d ai_conversations

-- Verify foreign keys
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'lawyer_profiles';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Test user creation trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

## Performance Considerations

The migration includes several optimizations:

1. **Indexes**: Created on commonly queried columns
2. **Foreign Key Constraints**: Ensure data integrity
3. **Row Level Security**: Protects user data while maintaining performance
4. **Triggers**: Automatic timestamp updates and profile creation

## Security Considerations

1. **Row Level Security**: All user-related tables have RLS enabled
2. **User Isolation**: Users can only access their own data
3. **Admin Policies**: Separate policies for admin users when needed
4. **Trigger Security**: User creation trigger uses SECURITY DEFINER for proper permissions

## Next Steps

After successful migration:

1. **Update all backend services** to use new table structure
2. **Update frontend components** to use new user model
3. **Test AI system integration** with new schema
4. **Monitor performance** and optimize if needed
5. **Update documentation** to reflect new user model

## Support

For issues with this migration:

1. Check the verification script output
2. Review the troubleshooting section
3. Check Supabase logs for detailed error messages
4. Test with a smaller dataset first if migrating production data

---

**Note**: This migration is part of the larger RAG system refactor. Ensure you've also updated your vector storage (Pinecone) and AI service configurations as documented in `LEGAL_AI_RAG_DEPLOYMENT_GUIDE.md`.
