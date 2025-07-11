# Manual Deployment Guide for Enhanced File System

This guide provides step-by-step instructions for manually deploying the enhanced file storage system when the automated script encounters issues.

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Access to your Supabase project
- Node.js and npm installed

## Option 1: Local Development Setup

### 1. Start Local Supabase (if using local development)

```bash
# Start Docker Desktop first
# Then start Supabase
supabase start
```

### 2. Apply Database Migration

```bash
# Apply the migration to add new columns
supabase db push
```

### 3. Generate TypeScript Types

```bash
# Generate updated types with new columns
supabase gen types typescript --local > supabase/types.ts
```

## Option 2: Remote Database Setup

### 1. Set Environment Variables

```bash
# Set your Supabase database URL
export SUPABASE_DB_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

# Or add to your .env file
echo "SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:[port]/postgres" >> .env
```

### 2. Apply Migration to Remote Database

```bash
# Apply the migration
supabase db push --db-url "$SUPABASE_DB_URL"
```

### 3. Generate Types from Remote Database

```bash
# Generate types from remote database
supabase gen types typescript --project-id [your-project-id] > supabase/types.ts
```

## Option 3: Manual SQL Execution

If the CLI methods don't work, you can manually execute the SQL:

### 1. Connect to Your Database

Use your preferred database client (pgAdmin, DBeaver, etc.) or the Supabase dashboard SQL editor.

### 2. Execute the Migration SQL

Copy and paste the contents of `supabase/migrations/20241201000000_enhance_files_table.sql` into your SQL editor and execute it.

### 3. Verify the Changes

```sql
-- Check if new columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY column_name;

-- You should see the new columns:
-- tags, url, uploaded_by, uploaded_at, related_entity_id, related_entity_type
```

## Verify Installation

### 1. Check API Routes

Ensure these files exist:
- `app/api/files/upload/route.ts`
- `app/api/files/list/route.ts`
- `app/api/files/stats/route.ts`
- `app/api/files/[fileId]/route.ts`
- `app/api/files/[fileId]/download/route.ts`

### 2. Check Frontend Components

Ensure these files exist:
- `components/chat/enhanced-file-manager.tsx`
- `components/chat/file-integration-example.tsx`

### 3. Test the System

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your application and test:
   - File upload with tags
   - File search and filtering
   - File management operations

## Troubleshooting

### Docker Issues

If you get Docker-related errors:

1. **Start Docker Desktop** before running Supabase commands
2. **Alternative**: Use remote database setup (Option 2 above)
3. **Alternative**: Use manual SQL execution (Option 3 above)

### Database Connection Issues

If you can't connect to the database:

1. Check your `SUPABASE_DB_URL` environment variable
2. Verify your database credentials
3. Ensure your IP is whitelisted in Supabase
4. Try connecting through the Supabase dashboard

### TypeScript Errors

If you see TypeScript errors about missing properties:

1. Regenerate the types after applying the migration
2. Restart your TypeScript server in your editor
3. Clear your TypeScript cache

### API Route Errors

If API routes return errors:

1. Check that the migration was applied successfully
2. Verify the new columns exist in the database
3. Check the browser console for detailed error messages
4. Verify your environment variables are set correctly

## Testing the Enhanced File System

### 1. Upload a Test File

```javascript
// Test file upload with tags
const formData = new FormData()
formData.append('file', file)
formData.append('name', 'Test Document')
formData.append('description', 'A test document')
formData.append('tags', 'test, document, important')
formData.append('workspace_id', 'your-workspace-id')

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData
})
```

### 2. Test File Search

```javascript
// Test file search
const params = new URLSearchParams({
  search: 'test',
  tags: 'important',
  sort_by: 'uploaded_at',
  sort_order: 'DESC'
})

const response = await fetch(`/api/files/list?${params}`)
const data = await response.json()
console.log('Search results:', data.files)
```

### 3. Test File Statistics

```javascript
// Test file statistics
const response = await fetch('/api/files/stats')
const data = await response.json()
console.log('File stats:', data.stats)
```

## Next Steps

After successful deployment:

1. **Integrate the EnhancedFileManager** into your chat interface
2. **Test AI integration** by linking files to chats
3. **Customize the UI** to match your application's design
4. **Add additional features** like file previews or version control

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the main documentation: `docs/ENHANCED_FILE_SYSTEM.md`
3. Check the Supabase logs for database errors
4. Verify all files are in the correct locations

The enhanced file system should now be ready to use! 