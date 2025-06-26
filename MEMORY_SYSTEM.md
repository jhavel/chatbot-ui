# 🧠 Enhanced Memory System

The Chatbot UI now features a sophisticated, brain-like memory system that provides semantic clustering, contextual retrieval, and adaptive relevance scoring.

## 🎯 Overview

The Enhanced Memory System mirrors how the human brain processes and retrieves memories:

- **Semantic Clustering**: Automatically groups related memories together
- **Contextual Retrieval**: Retrieves only relevant memories based on current conversation
- **Adaptive Relevance**: Memories become more or less accessible based on usage and time
- **Intelligent Classification**: Automatically categorizes memories by type and importance

## 🚀 Quick Start

### 1. Setup the Enhanced Memory System

```bash
# Run the setup script
npm run setup-memory
```

This will:
- Apply the database migration
- Generate updated TypeScript types
- Set up all necessary database functions and indexes

### 2. Configure OpenAI API Key

Ensure your OpenAI API key is set in your environment variables for embeddings and semantic processing:

```bash
# In your .env.local file
OPENAI_API_KEY=your_openai_api_key
```

### 3. Access the Memory Interface

Visit `/memories` to see the new enhanced memory management interface.

## 🏗️ Architecture

### Database Schema

The enhanced memory system adds several new fields to the `memories` table:

```sql
-- New columns for enhanced memory system
embedding vector(1536)           -- Semantic embedding for similarity search
cluster_id UUID                  -- Reference to memory cluster
relevance_score REAL DEFAULT 1.0 -- Dynamic relevance score
access_count INTEGER DEFAULT 0   -- Number of times accessed
last_accessed TIMESTAMPTZ        -- Last access timestamp
semantic_tags TEXT[]             -- Auto-extracted semantic tags
memory_type TEXT                 -- Classification (personal, technical, etc.)
importance_score REAL            -- Calculated importance score
```

### Memory Clusters

Memories are automatically organized into semantic clusters:

```sql
CREATE TABLE memory_clusters (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    centroid_embedding vector(1536),
    memory_count INTEGER DEFAULT 0,
    average_relevance_score REAL DEFAULT 0.0
);
```

## 🔧 Features

### 1. Semantic Memory Clustering

**Automatic Organization**: Memories are automatically grouped based on semantic similarity using OpenAI embeddings.

**Smart Clustering**: The system finds existing similar clusters or creates new ones as needed.

**Visual Organization**: View memories organized by clusters in the `/memories` interface.

### 2. Contextual Memory Retrieval

**Smart Retrieval**: Only the most relevant memories are injected into conversations based on current context.

**Similarity Scoring**: Uses cosine similarity to find the most contextually relevant memories.

**Performance Optimized**: Uses HNSW indexes for fast similarity search.

### 3. Adaptive Relevance Scoring

**Usage-Based Reinforcement**: Frequently accessed memories become more accessible.

**Temporal Decay**: Memories become less accessible over time if not used.

**Dynamic Scoring**: Relevance scores are updated automatically based on access patterns.

### 4. Memory Classification

**Automatic Typing**: Memories are automatically classified into types:
- `personal`: Personal information, names, work details
- `preference`: Likes, dislikes, preferences
- `technical`: Code, programming, technical details
- `project`: Project-related information, tasks, goals
- `general`: General information

**Importance Scoring**: Each memory gets an importance score based on content and type.

### 5. Enhanced User Interface

**Dashboard Overview**: 
- Total memories and clusters
- Average relevance scores
- Memory type distribution
- Access statistics

**Cluster Management**:
- View all memory clusters
- Explore memories within clusters
- Visual cluster organization

**Memory Details**:
- Relevance scores
- Access counts
- Semantic tags
- Memory types
- Creation dates

## 📡 API Endpoints

### Enhanced Memory API

```typescript
// Get contextually relevant memories
GET /api/memory/enhanced?action=contextual&context=current_conversation&limit=5

// Get memory clusters
GET /api/memory/enhanced?action=clusters

// Get memories in a cluster
GET /api/memory/enhanced?action=cluster-memories&clusterId=uuid

// Get memory statistics
GET /api/memory/enhanced?action=stats

// Mark memory as accessed
POST /api/memory/enhanced
{
  "action": "access",
  "memoryId": "uuid"
}
```

## 🧩 Integration

### Chat Integration

The enhanced memory system is automatically integrated into the chat system:

1. **Contextual Retrieval**: Only relevant memories are injected into conversations
2. **Enhanced Saving**: Memories are automatically processed with semantic analysis
3. **Access Tracking**: Memory access is tracked when used in conversations

### Memory Triggers

Memories are automatically created when the AI responds with:
- "I'll remember..."
- "I will remember..."

The system then:
1. Generates semantic embeddings
2. Extracts relevant tags
3. Classifies the memory type
4. Calculates importance score
5. Assigns to appropriate cluster

## 🔍 Usage Examples

### Creating Memories

```typescript
import { saveEnhancedMemory } from '@/lib/memory-system'

// Save a memory with full semantic processing
const memory = await saveEnhancedMemory(
  "I'll remember that you prefer detailed explanations with code examples",
  user_id
)
```

### Retrieving Contextual Memories

```typescript
import { getRelevantMemories } from '@/lib/memory-system'

// Get memories relevant to current conversation
const relevantMemories = await getRelevantMemories(
  user_id,
  "I need help with React hooks",
  5
)
```

### Memory Statistics

```typescript
import { getMemoryStats } from '@/lib/memory-system'

// Get comprehensive memory statistics
const stats = await getMemoryStats(user_id)
// Returns: { totalMemories, totalClusters, avgRelevanceScore, typeDistribution, ... }
```

## 🎨 User Interface

### Memory Dashboard (`/memories`)

The enhanced memory interface provides:

1. **Overview Tab**:
   - Memory statistics cards
   - Memory type distribution chart
   - Most relevant memories list

2. **Clusters Tab**:
   - Visual cluster grid
   - Cluster details and statistics
   - Memory exploration within clusters

3. **All Memories Tab**:
   - Complete memory list
   - Advanced filtering and sorting
   - Detailed memory information

### Interactive Features

- **Click to Access**: Click any memory to mark it as accessed
- **Cluster Exploration**: Click clusters to explore their contents
- **Real-time Updates**: Statistics update automatically
- **Visual Indicators**: Color-coded relevance scores and memory types

## 🔧 Configuration

### Environment Variables

```bash
# Required for embeddings and semantic processing
OPENAI_API_KEY=your_openai_api_key

# Optional: Customize similarity thresholds
MEMORY_SIMILARITY_THRESHOLD=0.7
MEMORY_RETRIEVAL_LIMIT=5
```

### Database Functions

The system includes several PostgreSQL functions:

- `find_similar_memories()`: Find memories similar to given embedding
- `update_memory_access()`: Update access statistics
- `decay_memory_relevance()`: Apply temporal decay to relevance scores

## 🚀 Performance

### Optimizations

- **Vector Indexes**: HNSW indexes for fast similarity search
- **Caching**: Memory embeddings are cached for performance
- **Batch Processing**: Efficient batch operations for memory updates
- **Lazy Loading**: Memories are loaded on-demand

### Scalability

- **Efficient Storage**: Vector embeddings are stored efficiently
- **Indexed Queries**: All queries use optimized indexes
- **Memory Limits**: Configurable limits prevent memory bloat
- **Automatic Cleanup**: Old, low-relevance memories can be automatically pruned

## 🔮 Future Enhancements

### Phase 2 Features (Planned)

1. **Episodic Memory**: Group memories by conversation sessions
2. **Memory Synthesis**: Automatic summarization of related memories
3. **Conflict Resolution**: Detect and resolve contradictory memories
4. **Memory Compression**: Create compressed representations

### Phase 3 Features (Planned)

1. **Memory Health Dashboard**: System health and optimization
2. **Cognitive Load Management**: Balance memory richness with performance
3. **Advanced Forgetting**: Strategic memory pruning
4. **Memory Analytics**: Deep insights into memory patterns

## 🐛 Troubleshooting

### Common Issues

1. **Missing OpenAI API Key**: Ensure `OPENAI_API_KEY` is set
2. **Migration Errors**: Run `npm run setup-memory` to apply migrations
3. **Type Errors**: Run `npm run db-types` to regenerate types
4. **Performance Issues**: Check vector indexes are created properly

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG_MEMORY=true
```

This will log detailed information about memory operations.

## 📚 API Reference

For detailed API documentation, see the TypeScript interfaces in `lib/memory-system.ts`.

---

The Enhanced Memory System transforms Chatbot UI from a simple chat application into a sophisticated, brain-like AI assistant that truly remembers and learns from conversations. 