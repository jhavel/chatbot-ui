# AI-Powered File Upload RLS Fix

## Problem Description

The AI-powered file upload was failing with the error:
```
Error: new row violates row-level security policy for table "files"
```

## Root Cause Analysis

The issue was caused by a mismatch between client-side and server-side Supabase authentication contexts:

1. **Client-Server Context Mismatch**: The AI upload API route was using server-side Supabase client, but the `createFileBasedOnExtension` function in `db/files.ts` was using the browser client (`@/lib/supabase/browser-client`).

2. **RLS Policy Enforcement**: Row Level Security (RLS) policies require the authenticated user context to match the `user_id` being inserted. When using the browser client in a server context, the authentication context was lost.

3. **Missing Workspace Validation**: The original code didn't validate workspace access before attempting file creation.

## Solution Implemented

### 1. Server-Side File Creation Functions

Replaced the client-side `createFileBasedOnExtension` call with server-side functions:

- `createFileServerSide()` - Main function that handles both regular and DOCX files
- `createRegularFileServerSide()` - Handles regular file uploads
- `createDocXFileServerSide()` - Handles DOCX file processing

### 2. Workspace Access Validation

Added proper workspace validation before file creation:

```typescript
// Validate workspace access
const { data: workspace, error: workspaceError } = await supabase
  .from("workspaces")
  .select("id, user_id")
  .eq("id", workspace_id)
  .single()

if (workspaceError || !workspace) {
  return NextResponse.json(
    { error: "Workspace not found or access denied" },
    { status: 404 }
  )
}

if (workspace.user_id !== profile.user_id) {
  return NextResponse.json(
    { error: "Access denied to workspace" },
    { status: 403 }
  )
}
```

### 3. Enhanced Error Handling

Added specific error handling for RLS violations:

```typescript
if (error.message?.includes("row-level security policy")) {
  return NextResponse.json(
    { 
      error: "Access denied. Please ensure you have permission to upload files to this workspace.",
      details: error.message
    },
    { status: 403 }
  )
}
```

### 4. Database Migration

Created a new migration (`20250111000004_fix_ai_upload_rls.sql`) to:

- Ensure RLS is properly enabled on tables
- Recreate policies with correct syntax
- Add debugging functions for troubleshooting
- Add RLS status checking function

## Files Modified

1. **`app/api/files/ai-upload/route.ts`**
   - Replaced client-side file creation with server-side functions
   - Added workspace validation
   - Enhanced error handling
   - Added comprehensive logging

2. **`supabase/migrations/20250111000004_fix_ai_upload_rls.sql`** (new)
   - RLS policy fixes
   - Debugging functions
   - Status checking utilities

## Testing Instructions

### 1. Apply the Migration

```bash
# Apply the new migration
supabase db reset
# or
supabase migration up
```

### 2. Test the Fix

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test via UI:**
   - Navigate to a workspace
   - Click the "AI File Upload" button
   - Upload a file
   - Verify it works without RLS errors

3. **Test via API directly:**
   ```bash
   # Create a test file
   echo "Test content" > test-file.txt
   
   # Upload using curl (replace with actual workspace ID and auth token)
   curl -X POST http://localhost:3000/api/files/ai-upload \
     -H "Content-Type: multipart/form-data" \
     -F "file=@test-file.txt" \
     -F "workspace_id=YOUR_WORKSPACE_ID" \
     -H "Cookie: YOUR_AUTH_COOKIE"
   ```

### 3. Debug RLS Issues

If you encounter RLS issues, use the debugging functions:

```sql
-- Check RLS status
SELECT * FROM check_rls_status();

-- Test file insertion
SELECT * FROM test_file_insert(
  'user-uuid',
  'test.txt',
  'Test file',
  'user-uuid/test.txt',
  'text/plain',
  100,
  0,
  ARRAY['test'],
  'testuser',
  NOW(),
  NULL,
  NULL,
  NULL,
  'private'
);
```

## Verification Steps

1. **Check RLS Policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
   FROM pg_policies 
   WHERE tablename IN ('files', 'file_workspaces');
   ```

2. **Verify Authentication Context:**
   ```sql
   SELECT auth.uid() as current_user_id;
   ```

3. **Test File Creation:**
   - Upload a file through the UI
   - Check the database to ensure the file was created with correct `user_id`
   - Verify the file-workspace relationship was created

## Common Issues and Solutions

### Issue: Still getting RLS errors
**Solution:** Ensure you're logged in and the session is valid. Check the browser's network tab for authentication headers.

### Issue: Workspace not found
**Solution:** Verify the workspace ID is correct and belongs to the authenticated user.

### Issue: File processing fails
**Solution:** Check that the retrieval processing API endpoints are working correctly.

## Monitoring

Monitor the following for ongoing issues:

1. **Server logs** for detailed error messages
2. **Database logs** for RLS policy violations
3. **Network requests** for authentication issues
4. **File storage** for upload failures

## Future Improvements

1. **Add retry logic** for transient failures
2. **Implement file validation** before upload
3. **Add progress tracking** for large files
4. **Implement batch upload** capabilities
5. **Add file type restrictions** if needed 