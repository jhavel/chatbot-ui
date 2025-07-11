# 🔌 API Reference Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Chat API](#chat-api)
- [Memory API](#memory-api)
- [File API](#file-api)
- [Assistant API](#assistant-api)
- [Workspace API](#workspace-api)
- [User API](#user-api)
- [Tool API](#tool-api)

## 🎯 Overview

The Chatbot UI API provides comprehensive endpoints for managing conversations, memories, files, and AI assistants. All endpoints are RESTful and return JSON responses.

### Key Features

- 🔐 **Secure Authentication**: JWT-based authentication with Supabase
- 📡 **Real-time Streaming**: WebSocket support for chat responses
- 🧠 **Memory Integration**: Automatic memory retrieval and storage
- 📁 **File Management**: Upload, process, and retrieve files
- 🤖 **Multi-Provider AI**: Support for OpenAI, Anthropic, Google, and more
- 🔧 **Function Calling**: Tool and function execution capabilities

## 🔐 Authentication

### Authentication Method

All API endpoints require authentication using Supabase JWT tokens.

```http
Authorization: Bearer <jwt_token>
```

### Getting a JWT Token

1. **Sign in through Supabase Auth**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

const token = data.session.access_token
```

2. **Use the token in API requests**
```javascript
const response = await fetch('/api/chat/openai', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
})
```

### Token Refresh

Tokens automatically refresh through Supabase Auth. The client should handle token refresh:

```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Update stored token
    localStorage.setItem('access_token', session.access_token)
  }
})
```

## 🌐 Base URL

### Development
```
http://localhost:3000/api
```

### Production
```
https://your-domain.com/api
```

## ❌ Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common HTTP Status Codes

| Status | Code | Description |
|--------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication token required |
| `INVALID_TOKEN` | Invalid or expired token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INVALID_REQUEST` | Request data validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `PROVIDER_ERROR` | AI provider error |
| `MEMORY_ERROR` | Memory system error |
| `FILE_ERROR` | File processing error |

## ⏱️ Rate Limiting

### Rate Limits

- **Chat API**: 100 requests per minute per user
- **Memory API**: 200 requests per minute per user
- **File API**: 50 requests per minute per user
- **General API**: 500 requests per minute per user

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "code": "RATE_LIMIT_EXCEEDED",
    "retry_after": 60
  }
}
```

## 💬 Chat API

### Send Message

**Endpoint:** `POST /api/chat/{provider}`

**Providers:** `openai`, `anthropic`, `google`, `azure`, `mistral`, `groq`, `perplexity`, `openrouter`

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": true,
  "chat_id": "chat-uuid",
  "workspace_id": "workspace-uuid",
  "assistant_id": "assistant-uuid",
  "files": [
    {
      "id": "file-uuid",
      "name": "document.pdf"
    }
  ],
  "tools": [
    {
      "id": "tool-uuid",
      "name": "web_search"
    }
  ],
  "memory_enabled": true,
  "memory_limit": 5
}
```

**Response (Non-streaming):**
```json
{
  "id": "msg-uuid",
  "role": "assistant",
  "content": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "model": "gpt-4",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  },
  "created_at": "2024-12-01T10:00:00Z"
}
```

**Response (Streaming):**
```http
Content-Type: text/event-stream

data: {"id": "msg-uuid", "role": "assistant", "content": "Hello", "model": "gpt-4"}

data: {"id": "msg-uuid", "role": "assistant", "content": "Hello! I'm doing well", "model": "gpt-4"}

data: {"id": "msg-uuid", "role": "assistant", "content": "Hello! I'm doing well, thank you for asking.", "model": "gpt-4"}

data: [DONE]
```

### Get Chat History

**Endpoint:** `GET /api/chat/{chat_id}/messages`

**Query Parameters:**
- `limit` (number): Number of messages to return (default: 50)
- `offset` (number): Number of messages to skip (default: 0)
- `before` (string): Get messages before this timestamp

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "role": "user",
      "content": "Hello, how are you?",
      "model": "gpt-4",
      "sequence_number": 1,
      "created_at": "2024-12-01T10:00:00Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "Hello! I'm doing well, thank you for asking.",
      "model": "gpt-4",
      "sequence_number": 2,
      "created_at": "2024-12-01T10:00:01Z"
    }
  ],
  "total_count": 2,
  "has_more": false
}
```

### Update Chat

**Endpoint:** `PUT /api/chat/{chat_id}`

**Request:**
```json
{
  "name": "Updated Chat Name",
  "model": "gpt-4-turbo",
  "temperature": 0.8,
  "context_length": 4000
}
```

### Delete Chat

**Endpoint:** `DELETE /api/chat/{chat_id}`

**Response:**
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

## 🧠 Memory API

### Save Memory

**Endpoint:** `POST /api/memory/save`

**Request:**
```json
{
  "content": "I prefer dark mode interfaces",
  "user_id": "user-uuid",
  "source": "user",
  "context": {
    "chat_id": "chat-uuid",
    "timestamp": "2024-12-01T10:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "memory": {
    "id": "memory-uuid",
    "content": "I prefer dark mode interfaces",
    "memory_type": "preference",
    "relevance_score": 1.0,
    "importance_score": 0.7,
    "semantic_tags": ["ui", "preference", "dark-mode"],
    "created_at": "2024-12-01T10:00:00Z"
  }
}
```

### Retrieve Memories

**Endpoint:** `GET /api/memory/retrieve`

**Query Parameters:**
- `user_id` (string, required): User ID
- `context` (string): Query context for relevance
- `limit` (number): Number of memories to return (default: 5)
- `type` (string): Filter by memory type
- `min_relevance` (number): Minimum relevance score

**Response:**
```json
{
  "memories": [
    {
      "id": "memory-uuid",
      "content": "I prefer dark mode interfaces",
      "memory_type": "preference",
      "relevance_score": 0.95,
      "similarity": 0.87,
      "last_accessed": "2024-12-01T10:00:00Z"
    }
  ],
  "total_count": 1,
  "processing_time": "45ms"
}
```

### List Memories

**Endpoint:** `GET /api/memory/list`

**Query Parameters:**
- `user_id` (string, required): User ID
- `type` (string): Filter by memory type
- `limit` (number): Number of memories (default: 20)
- `offset` (number): Number to skip (default: 0)
- `sort_by` (string): Sort field (relevance_score, created_at, last_accessed)
- `sort_order` (string): Sort order (asc, desc)

**Response:**
```json
{
  "memories": [
    {
      "id": "memory-uuid",
      "content": "I prefer dark mode interfaces",
      "memory_type": "preference",
      "relevance_score": 0.95,
      "importance_score": 0.7,
      "access_count": 5,
      "last_accessed": "2024-12-01T10:00:00Z",
      "created_at": "2024-12-01T09:00:00Z"
    }
  ],
  "total_count": 150,
  "has_more": true
}
```

### Delete Memory

**Endpoint:** `DELETE /api/memory/delete/{memory_id}`

**Response:**
```json
{
  "success": true,
  "message": "Memory deleted successfully"
}
```

### Memory Statistics

**Endpoint:** `GET /api/memory/stats`

**Query Parameters:**
- `user_id` (string, required): User ID

**Response:**
```json
{
  "total_memories": 150,
  "total_clusters": 12,
  "avg_relevance_score": 0.75,
  "avg_importance_score": 0.62,
  "type_distribution": {
    "personal": 45,
    "preference": 30,
    "technical": 40,
    "project": 25,
    "general": 10
  },
  "most_relevant_memories": [
    {
      "id": "memory-uuid",
      "content": "I work at Google as a senior developer",
      "relevance_score": 0.95,
      "memory_type": "personal"
    }
  ]
}
```

### Memory Clusters

**Endpoint:** `GET /api/memory/clusters`

**Query Parameters:**
- `user_id` (string, required): User ID

**Response:**
```json
{
  "clusters": [
    {
      "id": "cluster-uuid",
      "name": "UI Preferences",
      "description": "User interface preferences and settings",
      "memory_count": 8,
      "average_relevance_score": 0.85,
      "created_at": "2024-12-01T09:00:00Z"
    }
  ]
}
```

### Optimize Memory System

**Endpoint:** `POST /api/memory/optimize`

**Request:**
```json
{
  "user_id": "user-uuid",
  "options": {
    "prune_threshold": 0.3,
    "consolidate_threshold": 0.9,
    "max_memories": 1000
  }
}
```

**Response:**
```json
{
  "success": true,
  "optimization_result": {
    "memories_pruned": 15,
    "clusters_consolidated": 3,
    "processing_time": "2.5s"
  }
}
```

## 📁 File API

### AI-Powered File Upload

**Endpoint:** `POST /api/files/ai-upload`

**Request:** Multipart form data

```javascript
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)
formData.append('workspace_id', 'workspace-uuid')
formData.append('enable_ai_processing', 'true')
formData.append('custom_tags', 'project,important')

const response = await fetch('/api/files/ai-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file-uuid",
      "name": "AI Generated Title",
      "description": "AI Generated Description",
      "tags": ["ai-generated", "documentation"],
      "ai_processing_status": "completed",
      "ai_generated_title": "E-commerce Platform Requirements",
      "ai_generated_description": "Comprehensive requirements document...",
      "ai_generated_tags": ["requirements", "e-commerce", "specification"],
      "file_size": 12345,
      "file_type": "pdf",
      "uploaded_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### Standard File Upload

**Endpoint:** `POST /api/files/upload`

**Request:** Multipart form data

```javascript
const formData = new FormData()
formData.append('file', file)
formData.append('name', 'document.pdf')
formData.append('description', 'Project documentation')
formData.append('tags', 'documentation,project,important')
formData.append('workspace_id', 'workspace-uuid')
formData.append('related_entity_id', 'chat-uuid')
formData.append('related_entity_type', 'chat')

const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "description": "Project documentation",
    "tags": ["documentation", "project", "important"],
    "type": "pdf",
    "size": 1024000,
    "tokens": 5000,
    "file_path": "/files/user-uuid/document.pdf",
    "workspace_id": "workspace-uuid",
    "related_entity_id": "chat-uuid",
    "related_entity_type": "chat",
    "uploaded_at": "2024-12-01T10:00:00Z",
    "created_at": "2024-12-01T10:00:00Z"
  }
}
```

### List Files (Enhanced)

**Endpoint:** `GET /api/files/list`

**Query Parameters:**
- `workspace_id` (string, required): Workspace ID
- `search` (string): Search query for file name and description
- `tags` (string): Comma-separated tags to filter by
- `types` (string): Comma-separated file types to filter by
- `sort_by` (string): Sort field (name, uploaded_at, file_size, file_type)
- `sort_order` (string): Sort order (ASC, DESC)
- `limit` (number): Number of files (default: 20)
- `offset` (number): Number to skip (default: 0)
- `ai_processed` (boolean): Filter by AI processing status

**Response:**
```json
{
  "files": [
    {
      "id": "file-uuid",
      "name": "document.pdf",
      "description": "Project documentation",
      "tags": ["documentation", "project", "important"],
      "type": "pdf",
      "size": 1024000,
      "tokens": 5000,
      "file_path": "/files/user-uuid/document.pdf",
      "workspace_id": "workspace-uuid",
      "uploaded_by": "user@example.com",
      "uploaded_at": "2024-12-01T10:00:00Z",
      "ai_processing_status": "completed",
      "ai_generated_title": "E-commerce Platform Requirements",
      "ai_generated_description": "Comprehensive requirements document...",
      "ai_generated_tags": ["requirements", "e-commerce", "specification"],
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total_count": 25,
  "has_more": true,
  "filters": {
    "available_tags": ["documentation", "project", "important", "requirements"],
    "available_types": ["pdf", "docx", "txt", "md"]
  }
}
```

### File Statistics

**Endpoint:** `GET /api/files/stats`

**Query Parameters:**
- `workspace_id` (string, required): Workspace ID

**Response:**
```json
{
  "stats": {
    "totalFiles": 150,
    "totalSize": 1024000000,
    "totalTokens": 500000,
    "aiProcessedFiles": 75,
    "aiProcessingFailed": 3,
    "fileTypeDistribution": {
      "pdf": 45,
      "docx": 30,
      "txt": 25,
      "md": 20,
      "other": 30
    },
    "tagCounts": {
      "documentation": 60,
      "project": 45,
      "important": 30,
      "requirements": 25
    },
    "aiGeneratedTags": {
      "requirements": 20,
      "e-commerce": 15,
      "specification": 12,
      "technical": 10
    },
    "recentActivity": {
      "last7Days": 15,
      "last30Days": 45
    }
  }
}
```

### Get File Content

**Endpoint:** `GET /api/files/{file_id}/content`

**Query Parameters:**
- `chunk_size` (number): Size of content chunks (default: 1000)

**Response:**
```json
{
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "type": "pdf"
  },
  "chunks": [
    {
      "id": "chunk-uuid",
      "content": "This is the first chunk of content...",
      "tokens": 150,
      "sequence": 1
    },
    {
      "id": "chunk-uuid-2",
      "content": "This is the second chunk of content...",
      "tokens": 200,
      "sequence": 2
    }
  ],
  "total_chunks": 10
}
```

### Get File Details

**Endpoint:** `GET /api/files/{file_id}`

**Response:**
```json
{
  "file": {
    "id": "file-uuid",
    "name": "document.pdf",
    "description": "Project documentation",
    "tags": ["documentation", "project", "important"],
    "type": "pdf",
    "size": 1024000,
    "tokens": 5000,
    "file_path": "/files/user-uuid/document.pdf",
    "workspace_id": "workspace-uuid",
    "uploaded_by": "user@example.com",
    "uploaded_at": "2024-12-01T10:00:00Z",
    "ai_processing_status": "completed",
    "ai_generated_title": "E-commerce Platform Requirements",
    "ai_generated_description": "Comprehensive requirements document...",
    "ai_generated_tags": ["requirements", "e-commerce", "specification"],
    "related_entity_id": "chat-uuid",
    "related_entity_type": "chat",
    "created_at": "2024-12-01T10:00:00Z"
  }
}
```

### Update File Metadata

**Endpoint:** `PATCH /api/files/{file_id}`

**Request:**
```json
{
  "name": "Updated Document Name",
  "description": "Updated description",
  "tags": ["updated", "documentation", "project"],
  "related_entity_id": "new-chat-uuid",
  "related_entity_type": "chat"
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-uuid",
    "name": "Updated Document Name",
    "description": "Updated description",
    "tags": ["updated", "documentation", "project"],
    "updated_at": "2024-12-01T11:00:00Z"
  }
}
```

### Download File

**Endpoint:** `GET /api/files/{file_id}/download`

**Response:** File binary data with appropriate headers

### Re-run AI Processing

**Endpoint:** `POST /api/files/{file_id}/reprocess`

**Response:**
```json
{
  "success": true,
  "message": "AI processing restarted",
  "file": {
    "id": "file-uuid",
    "ai_processing_status": "processing"
  }
}
```

### Delete File

**Endpoint:** `DELETE /api/files/{file_id}`

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Search Files

**Endpoint:** `GET /api/files/search`

**Query Parameters:**
- `user_id` (string, required): User ID
- `query` (string, required): Search query
- `limit` (number): Number of results (default: 10)

**Response:**
```json
{
  "results": [
    {
      "file": {
        "id": "file-uuid",
        "name": "document.pdf",
        "type": "pdf"
      },
      "chunk": {
        "id": "chunk-uuid",
        "content": "This chunk contains the search term...",
        "similarity": 0.87
      }
    }
  ],
  "total_count": 5
}
```

## 🤖 Assistant API

### Create Assistant

**Endpoint:** `POST /api/assistants`

**Request:**
```json
{
  "name": "Code Review Assistant",
  "description": "An assistant that helps with code reviews",
  "prompt": "You are a senior software engineer who specializes in code reviews...",
  "model": "gpt-4",
  "temperature": 0.7,
  "context_length": 4000,
  "embeddings_provider": "openai",
  "include_profile_context": true,
  "include_workspace_instructions": true,
  "image_path": "/assistants/code-review.png",
  "folder_id": "folder-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "assistant": {
    "id": "assistant-uuid",
    "name": "Code Review Assistant",
    "description": "An assistant that helps with code reviews",
    "prompt": "You are a senior software engineer...",
    "model": "gpt-4",
    "temperature": 0.7,
    "context_length": 4000,
    "embeddings_provider": "openai",
    "include_profile_context": true,
    "include_workspace_instructions": true,
    "image_path": "/assistants/code-review.png",
    "created_at": "2024-12-01T10:00:00Z"
  }
}
```

### List Assistants

**Endpoint:** `GET /api/assistants`

**Query Parameters:**
- `user_id` (string, required): User ID
- `folder_id` (string): Filter by folder
- `limit` (number): Number of assistants (default: 20)
- `offset` (number): Number to skip (default: 0)

**Response:**
```json
{
  "assistants": [
    {
      "id": "assistant-uuid",
      "name": "Code Review Assistant",
      "description": "An assistant that helps with code reviews",
      "model": "gpt-4",
      "temperature": 0.7,
      "image_path": "/assistants/code-review.png",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total_count": 5,
  "has_more": false
}
```

### Get Assistant

**Endpoint:** `GET /api/assistants/{assistant_id}`

**Response:**
```json
{
  "assistant": {
    "id": "assistant-uuid",
    "name": "Code Review Assistant",
    "description": "An assistant that helps with code reviews",
    "prompt": "You are a senior software engineer...",
    "model": "gpt-4",
    "temperature": 0.7,
    "context_length": 4000,
    "embeddings_provider": "openai",
    "include_profile_context": true,
    "include_workspace_instructions": true,
    "image_path": "/assistants/code-review.png",
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T11:00:00Z"
  }
}
```

### Update Assistant

**Endpoint:** `PUT /api/assistants/{assistant_id}`

**Request:**
```json
{
  "name": "Updated Code Review Assistant",
  "description": "Updated description",
  "prompt": "Updated prompt...",
  "temperature": 0.8
}
```

### Delete Assistant

**Endpoint:** `DELETE /api/assistants/{assistant_id}`

**Response:**
```json
{
  "success": true,
  "message": "Assistant deleted successfully"
}
```

## 🏢 Workspace API

### Create Workspace

**Endpoint:** `POST /api/workspaces`

**Request:**
```json
{
  "name": "My Project",
  "description": "Workspace for my main project",
  "instructions": "This workspace is for developing a chatbot application",
  "default_context_length": 4000,
  "default_model": "gpt-4",
  "default_prompt": "You are a helpful assistant...",
  "default_temperature": 0.7,
  "embeddings_provider": "openai",
  "include_profile_context": true,
  "include_workspace_instructions": true
}
```

**Response:**
```json
{
  "success": true,
  "workspace": {
    "id": "workspace-uuid",
    "name": "My Project",
    "description": "Workspace for my main project",
    "instructions": "This workspace is for developing a chatbot application",
    "default_context_length": 4000,
    "default_model": "gpt-4",
    "default_prompt": "You are a helpful assistant...",
    "default_temperature": 0.7,
    "embeddings_provider": "openai",
    "include_profile_context": true,
    "include_workspace_instructions": true,
    "is_home": false,
    "created_at": "2024-12-01T10:00:00Z"
  }
}
```

### List Workspaces

**Endpoint:** `GET /api/workspaces`

**Query Parameters:**
- `user_id` (string, required): User ID
- `include_home` (boolean): Include home workspace (default: true)

**Response:**
```json
{
  "workspaces": [
    {
      "id": "workspace-uuid",
      "name": "My Project",
      "description": "Workspace for my main project",
      "default_model": "gpt-4",
      "is_home": false,
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total_count": 3
}
```

### Get Workspace

**Endpoint:** `GET /api/workspaces/{workspace_id}`

**Response:**
```json
{
  "workspace": {
    "id": "workspace-uuid",
    "name": "My Project",
    "description": "Workspace for my main project",
    "instructions": "This workspace is for developing a chatbot application",
    "default_context_length": 4000,
    "default_model": "gpt-4",
    "default_prompt": "You are a helpful assistant...",
    "default_temperature": 0.7,
    "embeddings_provider": "openai",
    "include_profile_context": true,
    "include_workspace_instructions": true,
    "is_home": false,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T11:00:00Z"
  }
}
```

### Update Workspace

**Endpoint:** `PUT /api/workspaces/{workspace_id}`

**Request:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "default_temperature": 0.8
}
```

### Delete Workspace

**Endpoint:** `DELETE /api/workspaces/{workspace_id}`

**Response:**
```json
{
  "success": true,
  "message": "Workspace deleted successfully"
}
```

## 👤 User API

### Get User Profile

**Endpoint:** `GET /api/user/profile`

**Response:**
```json
{
  "profile": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "display_name": "John Doe",
    "username": "johndoe",
    "bio": "Software engineer passionate about AI",
    "profile_context": "I'm a senior developer with 10 years of experience...",
    "image_url": "https://example.com/avatar.jpg",
    "image_path": "/avatars/user-uuid/avatar.jpg",
    "has_onboarded": true,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T11:00:00Z"
  }
}
```

### Update User Profile

**Endpoint:** `PUT /api/user/profile`

**Request:**
```json
{
  "display_name": "John Smith",
  "bio": "Updated bio",
  "profile_context": "Updated context..."
}
```

### Get API Keys

**Endpoint:** `GET /api/user/keys`

**Response:**
```json
{
  "keys": {
    "openai_api_key": "sk-...",
    "anthropic_api_key": "sk-ant-...",
    "google_gemini_api_key": "AIza...",
    "azure_openai_api_key": "sk-...",
    "azure_openai_endpoint": "https://...",
    "mistral_api_key": "sk-...",
    "groq_api_key": "gsk_...",
    "perplexity_api_key": "pplx-...",
    "openrouter_api_key": "sk-or-..."
  }
}
```

### Update API Keys

**Endpoint:** `PUT /api/user/keys`

**Request:**
```json
{
  "openai_api_key": "sk-new-key",
  "anthropic_api_key": "sk-ant-new-key"
}
```

## 🔧 Tool API

### Create Tool

**Endpoint:** `POST /api/tools`

**Request:**
```json
{
  "name": "Web Search",
  "description": "Search the web for current information",
  "url": "https://api.search.com/search",
  "schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query"
      }
    },
    "required": ["query"]
  },
  "custom_headers": {
    "Authorization": "Bearer ${API_KEY}"
  },
  "folder_id": "folder-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "tool": {
    "id": "tool-uuid",
    "name": "Web Search",
    "description": "Search the web for current information",
    "url": "https://api.search.com/search",
    "schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query"
        }
      },
      "required": ["query"]
    },
    "custom_headers": {
      "Authorization": "Bearer ${API_KEY}"
    },
    "created_at": "2024-12-01T10:00:00Z"
  }
}
```

### List Tools

**Endpoint:** `GET /api/tools`

**Query Parameters:**
- `user_id` (string, required): User ID
- `folder_id` (string): Filter by folder
- `limit` (number): Number of tools (default: 20)
- `offset` (number): Number to skip (default: 0)

**Response:**
```json
{
  "tools": [
    {
      "id": "tool-uuid",
      "name": "Web Search",
      "description": "Search the web for current information",
      "url": "https://api.search.com/search",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total_count": 5,
  "has_more": false
}
```

### Get Tool

**Endpoint:** `GET /api/tools/{tool_id}`

**Response:**
```json
{
  "tool": {
    "id": "tool-uuid",
    "name": "Web Search",
    "description": "Search the web for current information",
    "url": "https://api.search.com/search",
    "schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query"
        }
      },
      "required": ["query"]
    },
    "custom_headers": {
      "Authorization": "Bearer ${API_KEY}"
    },
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T11:00:00Z"
  }
}
```

### Update Tool

**Endpoint:** `PUT /api/tools/{tool_id}`

**Request:**
```json
{
  "name": "Updated Web Search",
  "description": "Updated description",
  "schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query"
      },
      "limit": {
        "type": "number",
        "description": "Number of results"
      }
    },
    "required": ["query"]
  }
}
```

### Delete Tool

**Endpoint:** `DELETE /api/tools/{tool_id}`

**Response:**
```json
{
  "success": true,
  "message": "Tool deleted successfully"
}
```

---

**Last Updated**: December 2024  
**API Version**: 2.0.0  
**Status**: Production Ready  
**Base URL**: https://your-domain.com/api 