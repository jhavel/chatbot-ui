# Enhanced File Storage and Handling System

## Overview

This document describes the enhanced file storage and handling system that provides advanced file management capabilities including AI-powered uploads, tagging, search, filtering, and better organization.

## Features

### 🤖 AI-Powered File Upload
- **Automatic Metadata Generation**: AI analyzes file content to generate titles, descriptions, and tags
- **Content Extraction**: Extracts text from various file formats (PDF, DOCX, TXT, etc.)
- **Smart Tagging**: Suggests relevant tags based on file content and context
- **Intelligent Naming**: Generates descriptive file names based on content
- **Batch Processing**: Handle multiple files with AI analysis

### 🏷️ Tagging System
- **File Tags**: Add multiple tags to files for better categorization
- **Tag Filtering**: Filter files by one or more tags
- **Popular Tags**: View most commonly used tags
- **Tag Management**: Edit tags on existing files
- **AI-Generated Tags**: Automatic tag suggestions from file content

### 🔍 Advanced Search & Filtering
- **Text Search**: Search by file name and description
- **Type Filtering**: Filter by file type (PDF, DOCX, TXT, etc.)
- **Date Sorting**: Sort by upload date, name, or size
- **Combined Filters**: Use multiple filters simultaneously
- **Full-Text Search**: Search within file content

### 📊 File Analytics
- **Usage Statistics**: View total files, size, and token counts
- **Type Distribution**: See breakdown by file type
- **Tag Analytics**: Most popular tags and usage patterns
- **Recent Activity**: Files uploaded in the last 7 days
- **AI Processing Stats**: Track AI-generated metadata usage

### 🔗 Entity Linking
- **Related Files**: Link files to chats, projects, or other entities
- **Context Awareness**: AI can suggest related files based on context
- **Cross-Reference**: Find files related to current work
- **Workspace Organization**: Files organized by workspace

## Database Schema

### Enhanced Files Table

```sql
-- Enhanced files table with AI-powered features
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Enhanced fields for AI and organization
  tags TEXT[] DEFAULT '{}',
  url TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  related_entity_id UUID,
  related_entity_type TEXT,
  
  -- AI-generated metadata
  ai_generated_title TEXT,
  ai_generated_description TEXT,
  ai_generated_tags TEXT[],
  ai_processing_status TEXT DEFAULT 'pending',
  ai_processing_error TEXT
);
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `tags` | `TEXT[]` | Array of tags for categorization |
| `url` | `TEXT` | Optional external URL |
| `uploaded_by` | `TEXT` | Name of person who uploaded |
| `uploaded_at` | `TIMESTAMPTZ` | When file was uploaded |
| `related_entity_id` | `UUID` | ID of related entity (chat, project, etc.) |
| `related_entity_type` | `TEXT` | Type of related entity |
| `ai_generated_title` | `TEXT` | AI-generated file title |
| `ai_generated_description` | `TEXT` | AI-generated description |
| `ai_generated_tags` | `TEXT[]` | AI-suggested tags |
| `ai_processing_status` | `TEXT` | Status of AI processing |
| `ai_processing_error` | `TEXT` | Error message if AI processing failed |

## API Endpoints

### AI-Powered File Upload
```http
POST /api/files/ai-upload
Content-Type: multipart/form-data

Parameters:
- files: Array of files to upload
- workspace_id: Target workspace
- enable_ai_processing: Boolean (default: true)
- custom_tags: Comma-separated custom tags
- related_entity_id: Optional related entity ID
- related_entity_type: Optional entity type

Response:
{
  "success": true,
  "files": [
    {
      "id": "uuid",
      "name": "AI Generated Title",
      "description": "AI Generated Description",
      "tags": ["ai-generated", "documentation"],
      "ai_processing_status": "completed",
      "file_size": 12345,
      "file_type": "pdf"
    }
  ]
}
```

### Standard File Upload
```http
POST /api/files/upload
Content-Type: multipart/form-data

Parameters:
- file: File to upload
- name: File name
- description: File description
- tags: Comma-separated tags
- workspace_id: Target workspace
- related_entity_id: Optional related entity ID
- related_entity_type: Optional entity type
```

### File List with Filters
```http
GET /api/files/list?search=query&tags=tag1,tag2&types=pdf,docx&sort_by=uploaded_at&sort_order=DESC&limit=20&offset=0&ai_processed=true
```

### File Statistics
```http
GET /api/files/stats
```

### File Management
```http
GET /api/files/{fileId}           # Get file details
PATCH /api/files/{fileId}         # Update file metadata
DELETE /api/files/{fileId}        # Delete file
GET /api/files/{fileId}/download  # Download file
POST /api/files/{fileId}/reprocess # Re-run AI processing
```

## Frontend Components

### AIFileUpload Component

A React component for AI-powered file uploads with drag-and-drop support:

```tsx
import { AIFileUpload } from "@/components/chat/ai-file-upload"

<AIFileUpload
  workspaceId={workspace.id}
  onUploadComplete={(files) => handleUploadComplete(files)}
  onUploadError={(error) => handleUploadError(error)}
  enableAIProcessing={true}
  maxFiles={10}
  acceptedFileTypes={['.pdf', '.docx', '.txt', '.md']}
/>
```

### EnhancedFileManager

A comprehensive file management component with AI features:

```tsx
import { EnhancedFileManager } from "@/components/sidebar/items/files/enhanced-file-manager"

<EnhancedFileManager
  workspaceId={workspace.id}
  onFileSelect={(file) => handleFileSelect(file)}
  selectedFileIds={selectedFiles}
  enableAIUpload={true}
  showAIStats={true}
/>
```

### File Integration in Chat

AI-powered file upload integrated into chat interface:

```tsx
import { FileManagerDemo } from "@/components/chat/file-manager-demo"

<FileManagerDemo
  workspaceId={workspace.id}
  onFileSelect={(file) => handleFileSelect(file)}
/>
```

## Usage Examples

### 1. AI-Powered File Upload

```typescript
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)
formData.append('workspace_id', workspaceId)
formData.append('enable_ai_processing', 'true')
formData.append('custom_tags', 'project,important')

const response = await fetch('/api/files/ai-upload', {
  method: 'POST',
  body: formData
})

const { files } = await response.json()
console.log('AI-generated metadata:', files[0].ai_generated_title)
```

### 2. Standard Upload with Manual Metadata

```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('name', 'Project Documentation')
formData.append('description', 'Complete project documentation')
formData.append('tags', 'documentation, project, important')
formData.append('workspace_id', workspaceId)

const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData
})
```

### 3. Search Files with AI Processing Filter

```typescript
const params = new URLSearchParams({
  tags: 'documentation,important',
  ai_processed: 'true',
  sort_by: 'uploaded_at',
  sort_order: 'DESC'
})

const response = await fetch(`/api/files/list?${params}`)
const { files } = await response.json()
```

### 4. Get File Statistics Including AI Data

```typescript
const response = await fetch('/api/files/stats')
const { stats } = await response.json()

console.log(`Total files: ${stats.totalFiles}`)
console.log(`AI processed: ${stats.aiProcessedFiles}`)
console.log(`Popular AI tags:`, stats.aiGeneratedTags)
```

## AI Integration

### AI Processing Pipeline

1. **File Upload**: User uploads files via drag-and-drop or file picker
2. **Content Extraction**: AI extracts text from various file formats
3. **Analysis**: GPT-4 analyzes content for context and meaning
4. **Metadata Generation**: AI generates title, description, and tags
5. **Storage**: Enhanced metadata stored in database
6. **User Review**: User can edit AI-generated metadata

### Supported File Types for AI Processing

- **Text Files**: TXT, MD, JSON, CSV, TSV
- **Documents**: PDF, DOCX, DOC
- **Code Files**: JS, TS, PY, JAVA, CPP, etc.
- **Data Files**: CSV, TSV, XML, YAML

### AI Processing Status

- `pending`: File uploaded, AI processing queued
- `processing`: AI currently analyzing file
- `completed`: AI processing finished successfully
- `failed`: AI processing encountered an error
- `skipped`: AI processing disabled for this file

### Example AI-Generated Metadata

**Input File**: `document.pdf` (Project requirements document)

**AI Output**:
```json
{
  "ai_generated_title": "E-commerce Platform Requirements Specification",
  "ai_generated_description": "Comprehensive requirements document for a modern e-commerce platform including user authentication, product management, payment processing, and order fulfillment systems.",
  "ai_generated_tags": ["requirements", "e-commerce", "specification", "technical", "project"]
}
```

## Migration Guide

### 1. Run Database Migration

```bash
# Apply the enhanced files table migration
supabase db push

# Verify migration
supabase db diff
```

### 2. Update TypeScript Types

```bash
# Generate updated types
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### 3. Deploy API Routes

Ensure all new API routes are deployed:
- `/api/files/ai-upload` - AI-powered upload
- `/api/files/upload` - Standard upload
- `/api/files/list` - Enhanced listing with filters
- `/api/files/stats` - File statistics
- `/api/files/[fileId]` - File management
- `/api/files/[fileId]/download` - File download
- `/api/files/[fileId]/reprocess` - Re-run AI processing

### 4. Update Frontend Components

Replace existing file picker with AI-powered components:
- Use `AIFileUpload` for uploads
- Use `EnhancedFileManager` for file management
- Integrate `FileManagerDemo` in chat interface

### 5. Environment Configuration

Ensure OpenAI API key is configured:
```env
OPENAI_API_KEY=your_openai_api_key
```

## Best Practices

### AI Processing Guidelines

1. **File Size Limits**: Keep files under 10MB for optimal AI processing
2. **File Type Selection**: Use supported formats for best AI analysis
3. **Batch Uploads**: Upload multiple related files together
4. **Review AI Output**: Always review and edit AI-generated metadata
5. **Custom Tags**: Add project-specific tags alongside AI suggestions

### Tagging Guidelines

1. **Use Consistent Tags**: Establish a tagging convention
2. **Keep Tags Short**: Use 1-3 word tags
3. **Use Hierarchical Tags**: `project:frontend`, `type:documentation`
4. **Avoid Over-tagging**: 3-5 tags per file is usually sufficient
5. **Combine AI and Manual**: Use AI suggestions as starting point

### File Organization

1. **Descriptive Names**: Use clear, searchable file names
2. **Add Descriptions**: Provide context for file content
3. **Link to Context**: Associate files with relevant entities
4. **Regular Cleanup**: Archive or delete unused files
5. **Workspace Organization**: Keep files organized by workspace

### Performance Considerations

1. **Pagination**: Use limit/offset for large file lists
2. **Caching**: Cache file metadata and statistics
3. **Indexing**: Database indexes on tags and search fields
4. **Storage Limits**: Monitor file sizes and storage usage
5. **AI Processing**: Queue large files for background processing

## Troubleshooting

### Common Issues

1. **AI Processing Fails**: Check OpenAI API key and quota
2. **Tags Not Saving**: Ensure migration has been applied
3. **Search Not Working**: Check database indexes are created
4. **Upload Fails**: Verify file size limits and storage permissions
5. **Download Errors**: Check file path and storage bucket access

### Debug Commands

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'files';

-- Test AI processing status
SELECT id, name, ai_processing_status, ai_processing_error 
FROM files 
WHERE ai_processing_status = 'failed';

-- View AI-generated tags
SELECT unnest(ai_generated_tags) as tag, COUNT(*) 
FROM files 
WHERE ai_generated_tags IS NOT NULL 
GROUP BY tag 
ORDER BY COUNT(*) DESC;

-- Test search function
SELECT * FROM search_files('user-uuid', 'documentation', ARRAY['important']);

-- View file statistics
SELECT * FROM get_file_stats('user-uuid');
```

### API Testing

```bash
# Test AI upload endpoint
curl -X POST http://localhost:3000/api/files/ai-upload \
  -F "files=@test.pdf" \
  -F "workspace_id=your-workspace-id" \
  -F "enable_ai_processing=true"

# Test file listing with AI filter
curl "http://localhost:3000/api/files/list?ai_processed=true&limit=10"

# Test file statistics
curl "http://localhost:3000/api/files/stats"
```

## Future Enhancements

### Planned Features

1. **File Previews**: In-browser preview for supported formats
2. **Version Control**: Track file versions and changes
3. **Collaboration**: Share files with team members
4. **Advanced Analytics**: Usage patterns and insights
5. **AI Summarization**: Automatic file content summaries
6. **Integration**: Connect with external storage providers
7. **Smart Recommendations**: AI suggests related files
8. **Content Analysis**: Extract key topics and themes
9. **Multi-language Support**: Process files in multiple languages
10. **Custom AI Models**: Use fine-tuned models for specific domains

### API Extensions

- Batch operations for multiple files
- File sharing and permissions
- Advanced search with full-text indexing
- File conversion and format support
- Webhook notifications for file events
- AI model selection and configuration
- Custom processing pipelines
- File relationship mapping

## Support

For issues or questions about the enhanced file system:

1. Check the troubleshooting section above
2. Review database migration logs
3. Test API endpoints individually
4. Verify frontend component integration
5. Check browser console for errors
6. Monitor AI processing logs
7. Verify OpenAI API configuration

The enhanced file system with AI-powered features provides a robust foundation for intelligent file management with room for future expansion and integration with advanced AI capabilities. 