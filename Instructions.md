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

# Customizing Branding: Name, Favicon, Assistant Avatar, and App Icon

## 1. **Frontend Name (App Name/Title/Brand)**

### Where It Is Set:
- **App Metadata:**  
  - `app/[locale]/layout.tsx`  
    - Constants: `APP_NAME`, `APP_DEFAULT_TITLE`, `APP_TITLE_TEMPLATE`, `APP_DESCRIPTION`
    - Used in the `metadata` export for Next.js, which sets the page title, app name, and meta tags.
- **Manifest:**  
  - `public/manifest.json`  
    - `"short_name"` and `"name"` fields.
- **UI Display:**  
  - `components/ui/brand.tsx`  
    - The `Brand` component displays the logo and the name ("Chatbot UI" hardcoded).
    - Used on the login page and likely in other header areas.

### How to Change:
- Update the constants in `app/[locale]/layout.tsx`.
- Update the `"short_name"` and `"name"` in `public/manifest.json`.
- Update the hardcoded name in `components/ui/brand.tsx` (and any other places you want the new name to appear).

### Potential Issues:
- If you change only the manifest or only the layout, the name may be inconsistent across the PWA install, browser tab, and UI.
- The name is hardcoded in some places, so a global search/replace is safest.

---

## 2. **Favicon**

### Where It Is Set:
- **File:**  
  - `public/favicon.ico` (standard location for Next.js/React apps).
- **Reference:**  
  - No explicit `<link rel="icon">` found in code; Next.js automatically serves `public/favicon.ico` as the default favicon.

### How to Change:
- Replace `public/favicon.ico` with your new favicon file (must be named `favicon.ico`).

### Potential Issues:
- If you want to use a different file name or format, you must add a `<link rel="icon" href="/yourfile.png">` in a custom `_document.js` or in the `<head>` of your layout (not currently present).
- Browsers may cache favicons aggressively; clear cache or do a hard refresh to see changes.

---

## 3. **App Icon (PWA/Installable App Icon)**

### Where It Is Set:
- **Manifest:**  
  - `public/manifest.json`  
    - `"icons"` array references `/icon-192x192.png`, `/icon-256x256.png`, `/icon-512x512.png`.
- **Files:**  
  - `public/icon-192x192.png`
  - `public/icon-256x256.png`
  - `public/icon-512x512.png`

### How to Change:
- Replace the PNG files in `public/` with your new icons (keep the same file names and sizes).
- Optionally update the `"icons"` array in `manifest.json` if you want to use different sizes or add more.

### Potential Issues:
- If you change file names, update the manifest accordingly.
- PWA/app icon changes may require uninstalling/reinstalling the app or clearing browser cache to take effect.

---

## 4. **Assistant Avatar**

### Where It Is Set:
- **Assistant Images:**  
  - Managed via Supabase storage and referenced by `assistant.image_path`.
  - Code for uploading and retrieving:  
    - `db/storage/assistant-images.ts`
    - `components/sidebar/items/assistants/assistant-item.tsx` (and similar for creation)
    - `components/chat/assistant-picker.tsx`, `components/chat/chat-input.tsx`, `components/messages/message.tsx`, etc.
- **Default Icon:**  
  - If no image is set, falls back to an icon (e.g., `IconRobotFace`).

### How to Change:
- When creating or editing an assistant (sidebar or settings), use the UI to upload a new image.
- The image is stored in Supabase and referenced by path.
- To change the default fallback icon, update the relevant components (e.g., replace `IconRobotFace` with your own SVG or image).

### Potential Issues:
- Uploaded images are user/workspace/assistant-specific, not global.
- If you want a global default avatar, you must change the fallback icon in all relevant components.

---

## 5. **App Logo in UI**

### Where It Is Set:
- **SVG Logo:**  
  - `components/icons/chatbotui-svg.tsx` (used in `Brand` component).
- **Brand Component:**  
  - `components/ui/brand.tsx` (renders the SVG and app name).

### How to Change:
- Replace the SVG code in `components/icons/chatbotui-svg.tsx` with your own logo.
- Update the `Brand` component if you want to change layout, link, or other branding.

---

## 6. **Other Branding Considerations**

- **Provider Logos:**  
  - `public/providers/` contains PNGs for model/provider branding (e.g., Groq, Mistral). Update as needed.
- **Theme/Colors:**  
  - `app/[locale]/style/page.tsx` and related files control theme and style customization.

---

## 7. **Summary Table**

| What                | Where to Change                                      | How to Change                        |
|---------------------|------------------------------------------------------|--------------------------------------|
| App Name            | `layout.tsx`, `manifest.json`, `brand.tsx`           | Edit constants, manifest, UI text    |
| Favicon             | `public/favicon.ico`                                 | Replace file                         |
| App Icon (PWA)      | `public/icon-*.png`, `manifest.json`                 | Replace files, update manifest       |
| Assistant Avatar    | UI (sidebar/settings), fallback in components        | Upload via UI, edit fallback icon    |
| App Logo in UI      | `chatbotui-svg.tsx`, `brand.tsx`                     | Replace SVG, update component        |

---

## 8. **Why Might Branding Not Update?**

- **Browser Cache:** Browsers cache favicons and manifest icons. Hard refresh or clear cache if changes don't appear.
- **PWA Cache:** If installed as a PWA, you may need to uninstall/reinstall.
- **Hardcoded Names:** Some names/logos are hardcoded in components; search and replace all instances.
- **No `<link rel="icon">`:** If you want a non-default favicon, you must add a `<link rel="icon">` in the HTML head.

---

## 9. **Is Anything Impossible?**

- **No.** All requested changes are possible with the current codebase and tools.  
- **Note:** If you want to make the assistant avatar global (not per-assistant), you would need to refactor the logic to use a global default.

---

## 10. **Step-by-Step Checklist**

1. **Change App Name:**
   - Edit `APP_NAME`, `APP_DEFAULT_TITLE`, etc. in `app/[locale]/layout.tsx`
   - Edit `"name"` and `"short_name"` in `public/manifest.json`
   - Edit `components/ui/brand.tsx` and any other UI text

2. **Change Favicon:**
   - Replace `public/favicon.ico` with your new icon

3. **Change App Icon:**
   - Replace `public/icon-192x192.png`, `icon-256x256.png`, `icon-512x512.png`
   - Update `public/manifest.json` if needed

4. **Change Assistant Avatar:**
   - Use the UI to upload a new image for each assistant
   - (Optional) Change fallback icon in relevant components

5. **Change App Logo in UI:**
   - Replace SVG in `components/icons/chatbotui-svg.tsx`
   - Update `components/ui/brand.tsx` if needed

6. **Clear Browser/PWA Cache** after making changes

---

**End of Instructions** 