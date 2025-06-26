# Memory System Testing Guide

## Current Issue
The memory system is failing due to Row Level Security (RLS) policy violations when trying to create memory clusters.

## Fix Required
Run the RLS fix SQL script in your Supabase database:

```sql
-- Copy and paste the contents of fix-memory-rls.sql into your Supabase SQL editor
```

## Testing Workflow

### 1. Fix RLS Policies
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix-memory-rls.sql`
4. Run the script

### 2. Test Memory Saving
After fixing RLS, test the memory system:

```bash
# Save test memories
curl -X POST http://localhost:3000/api/memory/test \
  -H "Content-Type: application/json" \
  -d '{"action": "save_test_memories"}'
```

### 3. Test Memory Retrieval
```bash
# Test memory retrieval
curl -X POST http://localhost:3000/api/memory/test \
  -H "Content-Type: application/json" \
  -d '{"action": "test_retrieval"}'
```

### 4. Test in Chat
1. Start a conversation with: "My name is John and I'm a software developer"
2. Then ask: "Who am I?"
3. The assistant should remember your name and profession

### 5. Check Debug Info
Visit `/memories/debug` to see:
- Total memories count
- User memories count
- Sample memories
- Memory clusters
- Table structure

## Expected Behavior After Fix

### Memory Saving
- When you say "My name is John", it should be saved as a memory
- No more RLS policy errors in the logs
- Memories should appear in the debug page

### Memory Retrieval
- When you ask "Who am I?", the system should find relevant memories
- The assistant should reference your name and details
- Similarity scores should be above the threshold (0.3 for GPT-4 Turbo)

### Log Output
```
🔥 OpenAI route hit
👤 User profile: [user-id]
📝 Optimized context: [context]
🔍 Memory retrieval: [X] found, [Y] filtered
🔍 Found relevant memories: [count]
🧠 Injected contextual memory messages: [count] memories
📝 Relevant memories found: [count]
💡 Extracted important info: [count] items
💾 Saved memory: [memory content]
```

## Troubleshooting

### If RLS errors persist:
1. Check if you're logged in to the app
2. Verify the user ID matches in the database
3. Check if the policies were created successfully

### If no memories are saved:
1. Check the `extractImportantInfo` function logic
2. Verify the conversation contains personal information
3. Check the similarity threshold settings

### If memories aren't retrieved:
1. Lower the similarity threshold temporarily
2. Check if embeddings are being generated
3. Verify the `find_similar_memories` function works

## Memory System Features

### Automatic Memory Extraction
The system automatically detects and saves:
- Personal information (name, age, location)
- Preferences and likes/dislikes
- Work and project information
- Technical skills and experience
- Goals and aspirations
- Personal experiences

### Semantic Clustering
- Similar memories are grouped into clusters
- Clusters help organize related information
- Improves retrieval relevance

### Adaptive Retrieval
- Memories are retrieved based on conversation context
- Similarity scoring determines relevance
- Access patterns influence future retrieval

### Relevance Scoring
- Memories gain relevance when accessed
- Relevance decays over time
- Important memories maintain higher scores

## Manual Testing in Chat

### Step 1: Save Personal Information
Tell the AI:
- "My name is [Your Name]"
- "I work as a [Your Job]"
- "I like [Your Preferences]"

### Step 2: Check Console Logs
Look for:
- `💾 Saved memory:` messages
- `🔍 Found relevant memories:` messages
- `🧠 Injected contextual memory messages:` messages

### Step 3: Test Memory Retrieval
Ask the AI:
- "What's my name?"
- "What do I do for work?"
- "What do I like?"

## Expected Behavior

### GPT-4o:
- More natural memory integration
- Subtle references to personal information
- Better context understanding

### GPT-4 Turbo:
- More explicit memory references
- Direct answers using stored information
- Clearer personalization

## Debug Endpoints

- `/api/memory/debug` - Check database state
- `/memories` - View memory dashboard
- `/memories/debug` - Run system diagnostics

## Common Issues

1. **No memories saved**: Check console for `💾 Saved memory:` logs
2. **No memories retrieved**: Check console for `🔍 Found relevant memories:` logs
3. **AI doesn't reference memories**: Check if memories are being injected in `🧠 Injected contextual memory messages:` logs
4. **Database errors**: Check `/api/memory/debug` endpoint 