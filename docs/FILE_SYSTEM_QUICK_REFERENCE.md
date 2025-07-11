# AI-Powered File System Quick Reference

## 🚀 Quick Start

### 1. Upload Files with AI Processing

```typescript
// Using AI-powered upload
const formData = new FormData()
formData.append('files', file1)
formData.append('files', file2)
formData.append('workspace_id', workspaceId)
formData.append('enable_ai_processing', 'true')

const response = await fetch('/api/files/ai-upload', {
  method: 'POST',
  body: formData
})
```

### 2. Use AI File Upload Component

```tsx
import { AIFileUpload } from "@/components/chat/ai-file-upload"

<AIFileUpload
  workspaceId={workspace.id}
  onUploadComplete={(files) => console.log('Uploaded:', files)}
  enableAIProcessing={true}
  maxFiles={10}
/>
```

### 3. Enhanced File Manager

```tsx
import { EnhancedFileManager } from "@/components/sidebar/items/files/enhanced-file-manager"

<EnhancedFileManager
  workspaceId={workspace.id}
  onFileSelect={(file) => handleFileSelect(file)}
  enableAIUpload={true}
  showAIStats={true}
/>
```

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/files/ai-upload` | POST | AI-powered file upload |
| `/api/files/upload` | POST | Standard file upload |
| `/api/files/list` | GET | List files with filters |
| `/api/files/stats` | GET | File statistics |
| `/api/files/{id}` | GET | Get file details |
| `/api/files/{id}` | PATCH | Update file metadata |
| `/api/files/{id}/download` | GET | Download file |
| `/api/files/{id}/reprocess` | POST | Re-run AI processing |

## 🔧 Environment Variables

```env
# Required for AI processing
OPENAI_API_KEY=your_openai_api_key

# File storage configuration
SUPABASE_STORAGE_BUCKET=your_bucket_name
FILE_UPLOAD_MAX_SIZE=10485760
AI_PROCESSING_ENABLED=true
```

## 📊 Database Schema

### Enhanced Files Table

```sql
-- Key new fields
tags TEXT[] DEFAULT '{}',
ai_generated_title TEXT,
ai_generated_description TEXT,
ai_generated_tags TEXT[],
ai_processing_status TEXT DEFAULT 'pending',
ai_processing_error TEXT,
uploaded_by TEXT,
uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
related_entity_id UUID,
related_entity_type TEXT
```

## 🎯 Common Use Cases

### 1. Upload Project Documentation

```typescript
// Upload multiple project files with AI analysis
const projectFiles = [requirementsDoc, designDoc, apiDoc]
const formData = new FormData()

projectFiles.forEach(file => {
  formData.append('files', file)
})

formData.append('workspace_id', projectWorkspaceId)
formData.append('custom_tags', 'project,documentation,important')

const response = await fetch('/api/files/ai-upload', {
  method: 'POST',
  body: formData
})
```

### 2. Search Files by Content

```typescript
// Search files with AI-generated content
const params = new URLSearchParams({
  search: 'authentication system',
  ai_processed: 'true',
  tags: 'security,api'
})

const response = await fetch(`/api/files/list?${params}`)
const { files } = await response.json()
```

### 3. Get File Analytics

```typescript
// Get comprehensive file statistics
const response = await fetch('/api/files/stats?workspace_id=' + workspaceId)
const { stats } = await response.json()

console.log('AI processed files:', stats.aiProcessedFiles)
console.log('Popular AI tags:', stats.aiGeneratedTags)
```

## 🔍 AI Processing Status

| Status | Description |
|--------|-------------|
| `pending` | File uploaded, AI processing queued |
| `processing` | AI currently analyzing file |
| `completed` | AI processing finished successfully |
| `failed` | AI processing encountered an error |
| `skipped` | AI processing disabled for this file |

## 📁 Supported File Types

### AI Processing Supported
- **Text**: TXT, MD, JSON, CSV, TSV
- **Documents**: PDF, DOCX, DOC
- **Code**: JS, TS, PY, JAVA, CPP, etc.
- **Data**: CSV, TSV, XML, YAML

### Storage Supported
- All file types supported for storage
- AI processing available for text-based files

## 🛠️ Troubleshooting

### Common Issues

1. **AI Processing Fails**
   ```bash
   # Check OpenAI API key
   echo $OPENAI_API_KEY
   
   # Check API quota
   curl https://api.openai.com/v1/usage \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. **File Upload Errors**
   ```bash
   # Check file size limits
   ls -lh your-file.pdf
   
   # Verify storage bucket
   supabase storage list-buckets
   ```

3. **Database Issues**
   ```sql
   -- Check if enhanced files table exists
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'files' AND column_name LIKE 'ai_%';
   
   -- Check AI processing status
   SELECT id, name, ai_processing_status, ai_processing_error 
   FROM files WHERE ai_processing_status = 'failed';
   ```

### Debug Commands

```bash
# Test AI upload endpoint
curl -X POST http://localhost:3000/api/files/ai-upload \
  -F "files=@test.pdf" \
  -F "workspace_id=test-workspace" \
  -F "enable_ai_processing=true"

# Check file statistics
curl "http://localhost:3000/api/files/stats?workspace_id=test-workspace"

# List files with AI filter
curl "http://localhost:3000/api/files/list?ai_processed=true&limit=10"
```

## 📚 Related Documentation

- [Enhanced File System Guide](./ENHANCED_FILE_SYSTEM.md) - Complete implementation guide
- [API Reference](./API_REFERENCE.md) - Full API documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Architecture Overview](./ARCHITECTURE.md) - System architecture

## 🆘 Support

For issues with the AI-powered file system:

1. Check the troubleshooting section above
2. Verify environment variables are set correctly
3. Test API endpoints individually
4. Check browser console for frontend errors
5. Review database migration logs
6. Monitor AI processing logs

The AI-powered file system provides intelligent file management with automatic metadata generation, content analysis, and smart organization capabilities. 