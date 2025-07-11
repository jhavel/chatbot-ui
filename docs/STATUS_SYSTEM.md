# System Status & Health Monitoring

## Overview

The Chatbot UI includes a comprehensive status monitoring system that validates all major functionality to ensure the application is working correctly. This system provides both real-time status checks and automated testing capabilities.

## Features

### 🔍 **Real-time Status Monitoring**
- **Live Health Checks**: Continuous monitoring of all system components
- **Performance Metrics**: Response time tracking for all operations
- **Error Detection**: Automatic identification of system issues
- **Visual Dashboard**: Beautiful, modern status page interface

### 🧪 **Comprehensive Testing**
- **Database Connectivity**: Supabase connection validation
- **Storage Operations**: File upload/download testing
- **Memory System**: Save/retrieve/duplication testing
- **File Processing**: Multi-format file processing validation
- **API Endpoints**: All major API route testing
- **Vector Database**: pgvector extension validation
- **Authentication**: User session validation

### 📊 **Detailed Reporting**
- **Test Results**: Individual test status and details
- **Performance Metrics**: Response times and throughput
- **Error Details**: Specific error messages and troubleshooting
- **Historical Data**: Status tracking over time

## API Endpoints

### `/api/status` - Comprehensive System Status

**Method**: `GET`

**Authentication**: Required (user must be logged in)

**Response**:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "overallStatus": "healthy",
  "tests": [
    {
      "name": "Database Connection",
      "description": "Supabase database connectivity",
      "status": "pass",
      "details": "Database connection successful",
      "duration": 45,
      "error": null
    }
  ],
  "summary": {
    "total": 12,
    "passed": 11,
    "failed": 0,
    "warnings": 1
  }
}
```

**Status Levels**:
- `healthy`: All tests passed
- `degraded`: Some warnings, no failures
- `unhealthy`: One or more failures

### `/api/health` - Basic Health Check

**Method**: `GET`

**Authentication**: Not required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "storage": "connected",
  "version": "1.0.0"
}
```

## Status Page UI

### Access
Navigate to `/status` in your browser to view the comprehensive status dashboard.

### Features
- **Real-time Updates**: Click "Refresh Status" to run new tests
- **Visual Indicators**: Color-coded status badges and icons
- **Performance Metrics**: Response time tracking
- **Error Details**: Expandable error information
- **Responsive Design**: Works on all device sizes

### Status Indicators
- 🟢 **Pass**: Test completed successfully
- 🔴 **Fail**: Test failed with error
- 🟡 **Warning**: Test completed with warnings

## Test Categories

### 1. Database Connectivity
- **Database Connection**: Basic Supabase connectivity
- **Storage Connection**: Supabase storage bucket access
- **Database Schema**: Required table validation
- **Vector Database**: pgvector extension functions

### 2. Memory System
- **Memory Save**: Create and store memories
- **Memory Retrieve**: Semantic search and retrieval
- **Memory Deduplication**: Duplicate detection
- **Memory Clustering**: Automatic memory grouping

### 3. File Processing
- **Text Files**: Plain text processing and chunking
- **CSV Files**: Comma-separated value processing
- **JSON Files**: JSON document processing
- **Markdown Files**: Markdown formatting processing
- **PDF Files**: PDF text extraction (if available)
- **DOCX Files**: Word document processing (if available)

### 4. Storage Operations
- **File Upload**: Upload test files to storage
- **File Deletion**: Remove test files
- **Bucket Listing**: List available storage buckets

### 5. API Key Validation
- **OpenAI API**: OpenAI key availability
- **Anthropic API**: Anthropic key availability
- **Google API**: Google Gemini key availability
- **Other Providers**: Azure, Mistral, Groq, etc.

### 6. Performance Tests
- **Response Times**: Operation duration tracking
- **Throughput**: Batch operation testing
- **Memory Usage**: Resource consumption monitoring

## Automated Testing

### Running Tests

#### Manual Testing
```bash
# Run all status tests
npm run test:status

# Run specific test categories
npm run test:status -- --grep "Database"
npm run test:status -- --grep "Memory"
npm run test:status -- --grep "File"
```

#### Continuous Integration
The status tests are automatically run in CI/CD pipelines to ensure system health before deployments.

### Test Configuration

#### Environment Variables
```env
# Required for testing
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Test timeouts
STATUS_TEST_TIMEOUT=30000
```

#### Test Data
- Test files are automatically cleaned up after testing
- Test memories are isolated to test user accounts
- No production data is affected by testing

## Monitoring & Alerts

### Automated Monitoring
- **Scheduled Checks**: Status checks run every 5 minutes
- **Alert Thresholds**: Configurable failure thresholds
- **Notification System**: Email/Slack alerts for failures

### Manual Monitoring
- **Status Dashboard**: Real-time status page
- **API Monitoring**: Direct API endpoint checking
- **Log Analysis**: Detailed error logging

## Troubleshooting

### Common Issues

#### Database Connection Failures
```bash
# Check Supabase configuration
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test direct connection
curl -X GET "https://your-project.supabase.co/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: your_anon_key"
```

#### Storage Connection Failures
```bash
# Check storage bucket configuration
# Ensure 'files' bucket exists in Supabase storage
```

#### Memory System Failures
```bash
# Check OpenAI API key for embeddings
echo $OPENAI_API_KEY

# Verify pgvector extension
# Run in Supabase SQL editor:
SELECT * FROM pg_extension WHERE extname = 'vector';
```

#### File Processing Failures
```bash
# Check file processing dependencies
npm list langchain
npm list mammoth
npm list pdf-parse
```

### Debug Mode
Enable detailed logging by setting:
```env
DEBUG_STATUS=true
```

This will provide detailed information about each test step.

## Integration

### External Monitoring
The status endpoints can be integrated with external monitoring services:

- **Uptime Robot**: Monitor `/api/health`
- **PagerDuty**: Alert on status failures
- **Grafana**: Dashboard integration
- **Prometheus**: Metrics collection

### Webhook Integration
```javascript
// Example webhook for status failures
fetch('/api/status')
  .then(response => response.json())
  .then(data => {
    if (data.overallStatus === 'unhealthy') {
      // Send alert
      notifyTeam(data);
    }
  });
```

## Best Practices

### 1. Regular Monitoring
- Check status page daily
- Set up automated alerts
- Monitor performance trends

### 2. Proactive Testing
- Run tests before deployments
- Test after configuration changes
- Validate new features

### 3. Documentation
- Keep test descriptions updated
- Document new test requirements
- Maintain troubleshooting guides

### 4. Performance Optimization
- Monitor test execution times
- Optimize slow operations
- Set appropriate timeouts

## Future Enhancements

### Planned Features
- **Historical Trends**: Status history tracking
- **Custom Tests**: User-defined test scenarios
- **Performance Benchmarks**: Baseline performance tracking
- **Integration Tests**: End-to-end workflow testing
- **Load Testing**: High-volume operation testing

### Monitoring Improvements
- **Real-time Metrics**: Live performance monitoring
- **Predictive Alerts**: Failure prediction
- **Auto-recovery**: Automatic issue resolution
- **Capacity Planning**: Resource usage forecasting

## Support

For issues with the status system:

1. Check the troubleshooting guide above
2. Review the test logs for specific errors
3. Verify environment configuration
4. Contact the development team with detailed error information

## Contributing

To add new tests:

1. Add test logic to `/api/status/route.ts`
2. Update test documentation
3. Add corresponding automated tests
4. Update this documentation

For more information, see the [Development Guide](./DEVELOPMENT.md). 