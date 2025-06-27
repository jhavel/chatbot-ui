# 🧠 Memory Clusters: Deep-Dive Analysis, Troubleshooting, and Fix Plan

## 1. **System Overview**

- **Memory clusters** are designed to group related memories for each user, using semantic embeddings and automatic clustering.
- The system uses Supabase/Postgres for storage, with Row Level Security (RLS) to ensure user data isolation.
- Clusters are created or found automatically when a new memory is saved, and are referenced by the `cluster_id` field in the `memories` table.

## 2. **Key Files and Functions**

### **Backend Logic**
- `lib/memory-system.ts`
  - `findOrCreateCluster`: Finds a similar cluster or creates a new one for a memory.
  - `saveEnhancedMemory`: Handles the full memory save pipeline, including clustering.
  - `getMemoryClusters`, `getMemoriesByCluster`: Retrieval functions.
- `db/memories.ts`: Exposes cluster/memory retrieval and saving for the rest of the app.
- `lib/memory-interface.ts`: Unified memory save interface, with audit logging.
- `lib/memory-validation.ts`: Ensures only valid user content is saved as a memory.

### **API Endpoints**
- `app/api/memory/clusters/route.ts`: Returns clusters for a user.
- `app/api/memory/cluster/[clusterId]/route.ts`: Returns memories in a cluster.
- `app/api/memory/enhanced/route.ts`: Enhanced memory API (contextual, clusters, stats, etc).
- `app/api/memory/test-rls/route.ts`: Tests RLS policies and cluster/memory insert/query.

### **Database & Migrations**
- `supabase/migrations/20240315000000_enhance_memories.sql`: Adds clustering columns, creates `memory_clusters`, sets up RLS.
- `fix-memory-rls.sql`, `fix-memory-rls-final.sql`: Scripts to fix and verify RLS policies.

### **Frontend**
- `app/[locale]/memories/page.tsx`: UI for viewing clusters, selecting clusters, and viewing cluster details.

## 3. **How Clustering Works**

- When a memory is saved:
  1. Embedding is generated.
  2. Semantic tags and type are extracted.
  3. `findOrCreateCluster` is called:
     - Tries to find a similar cluster (via embedding similarity).
     - If none found, attempts to create a new cluster.
     - If cluster creation fails (e.g., RLS error), memory is saved with `cluster_id = null`.
  4. Memory is saved, referencing the cluster if available.

## 4. **Common Failure Modes**

### **A. RLS (Row Level Security) Policy Issues**
- **Symptom:** Error like `new row violates row-level security policy for table "memory_clusters"` when creating a cluster.
- **Root Cause:** RLS policy is too restrictive or missing for `INSERT` on `memory_clusters`.
- **Fix:** Ensure separate RLS policies for SELECT, INSERT, UPDATE, DELETE on `memory_clusters` (see fix scripts).

### **B. Migration/Schema Drift**
- **Symptom:** Table or column does not exist, or missing fields in clusters.
- **Root Cause:** Migration not applied, or schema drift between code and DB.
- **Fix:** Re-run the latest migrations, especially `20240315000000_enhance_memories.sql`.

### **C. Supabase Client Context**
- **Symptom:** Cluster creation fails only in some environments (e.g., serverless, local dev).
- **Root Cause:** Supabase client not authenticated as the user, or using wrong API key.
- **Fix:** Ensure all cluster/memory operations are performed with the correct user context.

### **D. Validation/Logic Errors**
- **Symptom:** Memory not saved, or cluster not assigned, but no DB error.
- **Root Cause:** Validation fails, duplicate detection, or logic bug.
- **Fix:** Check logs for validation failures, and ensure `validateMemoryContent` is not overly strict.

## 5. **How to Diagnose Cluster Issues**

### **A. Use the RLS Test Endpoint**
- Call `/api/memory/test-rls` to verify:
  - Can query and insert into both `memories` and `memory_clusters`.
  - Returns detailed error messages if RLS is blocking.

### **B. Use the Debug Endpoint**
- Call `/api/memory/debug` to see:
  - User's clusters, sample memories, and any errors.
  - Table structure and embedding status.

### **C. Check Logs**
- Look for errors like:
  - `Error creating cluster: ... violates row-level security policy ...`
  - `Error saving enhanced memory: ...`
- These indicate RLS or validation issues.

### **D. Manual DB Inspection**
- Use Supabase Studio or psql to:
  - List policies: `SELECT * FROM pg_policies WHERE tablename IN ('memories', 'memory_clusters');`
  - Check if clusters exist for your user.

## 6. **How to Fix Cluster Creation Issues**

### **A. Fix RLS Policies**
- Run the script in `fix-memory-rls-final.sql`:
  - Drops all old policies.
  - Creates correct policies for SELECT, INSERT, UPDATE, DELETE for both tables.
  - Ensures `WITH CHECK (user_id = auth.uid())` for INSERT/UPDATE.
- **How to run:**
  - In Supabase SQL editor or psql, paste and execute the script.

### **B. Re-Apply Migrations**
- Run all migrations in `supabase/migrations/` to ensure schema is up to date.

### **C. Test Again**
- Use `/api/memory/test-rls` and `/api/memory/debug` to confirm:
  - You can insert/query clusters and memories.
  - No RLS errors are returned.

### **D. Check Cluster Creation in Code**
- In `lib/memory-system.ts`, ensure that:
  - The `user_id` is always set when creating a cluster.
  - The Supabase client is authenticated as the user.

### **E. Validate Frontend**
- In `/memories`, check that clusters appear as you add new memories.
- If "No clusters yet" persists, check backend logs for errors.

## 7. **Best Practices for Ongoing Maintenance**

- **Always run RLS fix scripts after changing policies or updating Supabase.**
- **Keep migrations in sync with production.**
- **Use the debug/test endpoints regularly to catch issues early.**
- **Log all errors with enough detail to diagnose RLS and validation failures.**
- **Document any manual changes to policies or schema.**

---

## **Summary Table: Troubleshooting Checklist**

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| RLS error on cluster creation | Missing/incorrect RLS policy | Run `fix-memory-rls-final.sql` |
| No clusters appear in UI | RLS, migration, or logic error | Check `/api/memory/debug`, logs, and run migrations |
| Cluster creation works in dev but not prod | Auth context or migration drift | Check Supabase client context and re-run migrations |
| Memory not saved | Validation or duplicate detection | Check logs for validation failures |

---

## **Action Items**

1. **Run the RLS fix script** (`fix-memory-rls-final.sql`) in your Supabase SQL editor.
2. **Re-run all migrations** in `supabase/migrations/`.
3. **Test** using `/api/memory/test-rls` and `/api/memory/debug`.
4. **Check logs** for any errors during memory or cluster creation.
5. **Verify** in the UI that clusters are created and populated as you add new memories.

---

**If you follow these steps and still encounter issues, provide the error logs from the debug/test endpoints for further diagnosis.**

---

*This plan and report were generated by a deep analysis of your codebase, migrations, and error logs. It is designed to be actionable and comprehensive for both developers and operators of the memory system.*

---

**End of Instructions** 