# Troubleshooting Guide

## Table of Contents

1. [Overview](#overview)
2. [Common Issues](#common-issues)
3. [Development Issues](#development-issues)
4. [Production Issues](#production-issues)
5. [Database Issues](#database-issues)
6. [Memory System Issues](#memory-system-issues)
7. [Performance Issues](#performance-issues)
8. [Authentication Issues](#authentication-issues)
9. [API Issues](#api-issues)
10. [Debug Procedures](#debug-procedures)
11. [Emergency Procedures](#emergency-procedures)

## Overview

This troubleshooting guide provides solutions for common issues encountered when developing, deploying, and maintaining the Chatbot UI application. Each section includes problem descriptions, diagnostic steps, and resolution procedures.

### Quick Diagnostic Commands

```bash
# Check application status
npm run health-check

# Check database connection
npm run db-check

# Check memory system
npm run memory-check

# Check API endpoints
npm run api-check

# Check environment variables
npm run env-check
```

### Log Locations

- **Application Logs**: `logs/app.log`
- **Database Logs**: `logs/db.log`
- **Memory System Logs**: `logs/memory.log`
- **API Logs**: `logs/api.log`
- **Error Logs**: `logs/error.log`

## Common Issues

### 1. Application Won't Start

**Symptoms**:
- Application fails to start
- Port already in use errors
- Missing dependencies

**Diagnostic Steps**:
```bash
# Check if port is in use
lsof -i :3000

# Check Node.js version
node --version

# Check npm version
npm --version

# Check dependencies
npm ls --depth=0
```

**Solutions**:

#### Port Already in Use
```bash
# Kill process using port 3000
kill -9 $(lsof -t -i:3000)

# Or use different port
npm run dev -- -p 3001
```

#### Missing Dependencies
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Node.js Version Issues
```bash
# Install correct Node.js version
nvm install 18.17.0
nvm use 18.17.0

# Or use Docker
docker run -it --rm -v $(pwd):/app -w /app node:18-alpine npm install
```

### 2. Build Failures

**Symptoms**:
- Build process fails
- TypeScript compilation errors
- Missing environment variables

**Diagnostic Steps**:
```bash
# Check TypeScript errors
npm run type-check

# Check linting errors
npm run lint

# Check environment variables
npm run env-validate
```

**Solutions**:

#### TypeScript Errors
```bash
# Fix TypeScript errors
npm run type-check -- --noEmit

# Update database types
npm run db-types

# Check for missing type definitions
npm install @types/node @types/react @types/react-dom
```

#### Environment Variables Missing
```bash
# Copy example environment file
cp .env.example .env.local

# Validate environment variables
npm run env-validate

# Check required variables
cat .env.local | grep -E "^(OPENAI_API_KEY|SUPABASE_URL|SUPABASE_ANON_KEY)"
```

#### Build Memory Issues
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Or use build optimization
npm run build -- --no-lint
```

### 3. Database Connection Issues

**Symptoms**:
- Database connection errors
- Supabase connection failures
- RLS policy errors

**Diagnostic Steps**:
```bash
# Check Supabase status
supabase status

# Test database connection
npm run db-test

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Solutions**:

#### Supabase Not Running
```bash
# Start Supabase
supabase start

# Check Supabase logs
supabase logs

# Restart Supabase
supabase stop
supabase start
```

#### Connection String Issues
```bash
# Verify connection string format
# Should be: https://project-ref.supabase.co

# Test connection
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=count"
```

#### RLS Policy Issues
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Disable RLS temporarily for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

## Development Issues

### 1. Hot Reload Not Working

**Symptoms**:
- Changes not reflected in browser
- Manual refresh required
- File watching issues

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev

# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. TypeScript Errors in Development

**Symptoms**:
- TypeScript errors in editor
- Incorrect type suggestions
- Missing type definitions

**Solutions**:
```bash
# Restart TypeScript server
# In VS Code: Cmd+Shift+P > "TypeScript: Restart TS Server"

# Regenerate types
npm run db-types

# Check TypeScript configuration
npx tsc --noEmit

# Install missing types
npm install @types/package-name
```

### 3. ESLint/Prettier Issues

**Symptoms**:
- Formatting inconsistencies
- Linting errors
- Pre-commit hook failures

**Solutions**:
```bash
# Fix formatting
npm run format:write

# Fix linting issues
npm run lint:fix

# Check configuration
npx eslint --print-config .eslintrc.js

# Reset Prettier cache
npm run format:write -- --cache-location .prettiercache
```

### 4. Test Failures

**Symptoms**:
- Tests failing locally
- Inconsistent test results
- Mock issues

**Solutions**:
```bash
# Clear test cache
npm test -- --clearCache

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- memory-system.test.ts

# Check test environment
npm test -- --verbose
```

## Production Issues

### 1. Application Crashes

**Symptoms**:
- Application stops responding
- 500 errors
- Memory leaks

**Diagnostic Steps**:
```bash
# Check application logs
tail -f logs/app.log

# Check memory usage
ps aux | grep node

# Check system resources
htop
```

**Solutions**:

#### Memory Leaks
```bash
# Monitor memory usage
node --inspect npm start

# Use memory profiling
node --inspect --expose-gc npm start

# Check for memory leaks in code
npm run analyze:memory
```

#### Process Crashes
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "chatbot-ui" -- start

# Monitor with PM2
pm2 monit
pm2 logs chatbot-ui
```

### 2. Performance Issues

**Symptoms**:
- Slow response times
- High CPU usage
- Database query timeouts

**Diagnostic Steps**:
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "https://your-domain.com"

# Monitor database queries
supabase db analyze

# Check API performance
npm run api-benchmark
```

**Solutions**:

#### Database Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add missing indexes
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_memories_user_id ON memories(user_id);
```

#### API Performance
```typescript
// Add caching
response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')

// Implement rate limiting
import { checkRateLimit } from '@/lib/rate-limit'

if (!checkRateLimit(userId, 100)) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

### 3. SSL/HTTPS Issues

**Symptoms**:
- Mixed content warnings
- SSL certificate errors
- Redirect loops

**Solutions**:
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Verify redirects
curl -I http://your-domain.com
curl -I https://your-domain.com

# Check security headers
curl -I https://your-domain.com | grep -i security
```

## Database Issues

### 1. Migration Failures

**Symptoms**:
- Database schema out of sync
- Migration errors
- Data loss

**Solutions**:
```bash
# Check migration status
supabase migration list

# Reset database
supabase db reset

# Apply migrations manually
supabase db push

# Check for conflicts
supabase db diff
```

### 2. Connection Pool Exhaustion

**Symptoms**:
- Database connection timeouts
- "Too many connections" errors
- Slow database responses

**Solutions**:
```typescript
// Implement connection pooling
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

### 3. Data Corruption

**Symptoms**:
- Inconsistent data
- Missing records
- Duplicate entries

**Solutions**:
```sql
-- Check for duplicates
SELECT content, COUNT(*) 
FROM memories 
GROUP BY content 
HAVING COUNT(*) > 1;

-- Remove duplicates
DELETE FROM memories 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM memories 
  GROUP BY content
);

-- Verify data integrity
SELECT COUNT(*) FROM memories;
SELECT COUNT(*) FROM memory_clusters;
```

## Memory System Issues

### 1. Memory Save Failures

**Symptoms**:
- Memories not being saved
- OpenAI API errors
- Embedding generation failures

**Diagnostic Steps**:
```bash
# Check OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Test memory system
npm run test:memory

# Check memory logs
tail -f logs/memory.log
```

**Solutions**:

#### OpenAI API Issues
```bash
# Verify API key
echo $OPENAI_API_KEY | wc -c

# Check API quota
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/usage

# Test embedding generation
npm run test:embedding
```

#### Memory Validation Issues
```typescript
// Check memory content validation
import { validateMemoryContent } from '@/lib/memory-validation'

const isValid = validateMemoryContent(content)
console.log('Memory validation:', isValid)
```

### 2. Memory Retrieval Issues

**Symptoms**:
- Irrelevant memories returned
- No memories found
- Poor similarity matching

**Solutions**:
```typescript
// Adjust similarity threshold
const memories = await getRelevantMemories(
  supabase,
  userId,
  context,
  5,
  0.5 // Lower threshold for more results
)

// Check embedding quality
const embedding = await generateEmbedding(context)
console.log('Embedding length:', embedding.length)
```

### 3. Memory Clustering Issues

**Symptoms**:
- Too many clusters
- Poor cluster organization
- Memory fragmentation

**Solutions**:
```bash
# Run memory optimization
npm run memory-optimize

# Regenerate embeddings
npm run memory-regenerate-embeddings

# Check cluster statistics
npm run memory-stats
```

## Performance Issues

### 1. Slow Page Loads

**Symptoms**:
- Long initial load times
- Slow navigation
- Poor Core Web Vitals

**Diagnostic Steps**:
```bash
# Check bundle size
npm run analyze

# Monitor Core Web Vitals
npm run lighthouse

# Check loading performance
npm run performance-check
```

**Solutions**:

#### Bundle Optimization
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  compress: true,
  swcMinify: true,
}
```

#### Image Optimization
```bash
# Optimize images
npm run optimize-images

# Use Next.js Image component
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority
/>
```

### 2. API Response Delays

**Symptoms**:
- Slow API responses
- Timeout errors
- High latency

**Solutions**:
```typescript
// Implement caching
const cache = new Map()

export async function cachedApiCall(key: string, fn: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const result = await fn()
  cache.set(key, result)
  return result
}

// Add timeout handling
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30000)

try {
  const response = await fetch(url, { signal: controller.signal })
  clearTimeout(timeoutId)
  return response
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timeout')
  }
  throw error
}
```

### 3. Database Query Performance

**Symptoms**:
- Slow database queries
- High database CPU usage
- Query timeouts

**Solutions**:
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM messages WHERE chat_id = 'chat-123';

-- Add composite indexes
CREATE INDEX idx_messages_chat_user ON messages(chat_id, user_id);

-- Optimize vector queries
CREATE INDEX idx_memories_embedding ON memories 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

## Authentication Issues

### 1. Login Failures

**Symptoms**:
- Users cannot log in
- Authentication errors
- Session issues

**Diagnostic Steps**:
```bash
# Check Supabase auth status
supabase auth status

# Test authentication
npm run test:auth

# Check auth logs
tail -f logs/auth.log
```

**Solutions**:

#### Supabase Auth Issues
```bash
# Reset auth configuration
supabase auth reset

# Check auth settings
supabase auth config

# Test auth endpoints
curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### Session Management
```typescript
// Check session status
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  // Redirect to login
  window.location.href = '/login'
}
```

### 2. OAuth Provider Issues

**Symptoms**:
- OAuth login failures
- Provider configuration errors
- Redirect issues

**Solutions**:
```bash
# Check OAuth configuration
echo $GOOGLE_CLIENT_ID
echo $GITHUB_CLIENT_ID

# Verify redirect URIs
# Should include: https://your-domain.com/auth/callback

# Test OAuth flow
npm run test:oauth
```

## API Issues

### 1. API Endpoint Failures

**Symptoms**:
- 404/500 errors
- CORS issues
- Request timeouts

**Diagnostic Steps**:
```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/chat/openai \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Check API logs
tail -f logs/api.log

# Monitor API performance
npm run api-monitor
```

**Solutions**:

#### CORS Issues
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

#### Rate Limiting
```typescript
// Implement rate limiting
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const userId = getUserId(request)
  
  if (!checkRateLimit(userId, 100)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
  
  // Process request
}
```

### 2. Streaming Issues

**Symptoms**:
- Incomplete responses
- Connection drops
- Buffer issues

**Solutions**:
```typescript
// Implement proper streaming
export async function POST(request: Request) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stream response
        controller.enqueue(encoder.encode('data: {"content": "partial"}\n\n'))
        
        // Complete stream
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

## Debug Procedures

### 1. Application Debugging

```bash
# Enable debug mode
DEBUG=* npm run dev

# Use Node.js inspector
node --inspect npm run dev

# Check memory usage
node --inspect --expose-gc npm run dev

# Profile performance
node --prof npm run dev
```

### 2. Database Debugging

```bash
# Connect to database
supabase db connect

# Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# Monitor connections
SELECT count(*) FROM pg_stat_activity;

# Check table sizes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public';
```

### 3. Network Debugging

```bash
# Check DNS resolution
nslookup your-domain.com

# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Monitor network traffic
tcpdump -i any -w capture.pcap port 443

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s "https://your-domain.com"
```

### 4. Memory Debugging

```bash
# Check memory usage
ps aux | grep node

# Monitor memory with Node.js
node --inspect --expose-gc npm start

# Use heap snapshots
# In Chrome DevTools: Memory tab > Take heap snapshot

# Check for memory leaks
npm run memory-leak-check
```

## Emergency Procedures

### 1. Application Rollback

```bash
# Vercel rollback
vercel rollback

# Docker rollback
docker-compose down
docker-compose up -d chatbot-ui:previous-version

# Git rollback
git checkout HEAD~1
npm run build
npm start
```

### 2. Database Emergency

```bash
# Emergency database restore
supabase db reset --linked

# Point-in-time recovery
# Use Supabase dashboard: Settings > Database > Point-in-time recovery

# Manual backup restore
psql $DATABASE_URL < backup_20241201_120000.sql
```

### 3. Service Recovery

```bash
# Restart all services
docker-compose restart

# Check service health
docker-compose ps
docker-compose logs chatbot-ui

# Scale services
docker-compose up -d --scale chatbot-ui=3
```

### 4. Data Recovery

```bash
# Restore from backup
npm run db-restore

# Recover files
npm run files-restore

# Verify data integrity
npm run data-verify
```

### 5. Emergency Contact

**For Critical Issues**:
- **Database**: Supabase Support
- **Hosting**: Vercel/Netlify Support
- **Domain**: Domain Registrar Support
- **SSL**: Certificate Authority Support

**Internal Contacts**:
- **DevOps**: devops@company.com
- **Database Admin**: db-admin@company.com
- **Security**: security@company.com

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Status**: Complete
