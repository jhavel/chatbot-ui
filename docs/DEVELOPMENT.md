# Development Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Code Quality](#code-quality)
7. [Troubleshooting](#troubleshooting)
8. [Contributing](#contributing)

## Prerequisites

### Required Software

- **Node.js**: Version 18.17 or higher
- **npm**: Version 9.0 or higher
- **Git**: Version 2.30 or higher
- **Supabase CLI**: Version 1.0 or higher
- **PostgreSQL**: Version 14 or higher (for local development)

### Optional Software

- **Docker**: For containerized development
- **VS Code**: Recommended IDE with extensions
- **Postman**: For API testing
- **TablePlus**: For database management

### System Requirements

- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: At least 5GB free space
- **OS**: macOS, Windows, or Linux

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mckaywrigley/chatbot-ui.git
cd chatbot-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

#### Required Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Authentication (Optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Optional Environment Variables

```env
# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id_here

# Edge Config
EDGE_CONFIG=your_edge_config_here

# Memory System Configuration
MEMORY_SIMILARITY_THRESHOLD=0.8
MEMORY_MAX_LENGTH=8192
MEMORY_DEFAULT_LIMIT=5
MEMORY_DECAY_RATE=0.1
```

### 4. API Key Setup

#### OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add the key to your `.env.local` file

#### Supabase Setup

1. Visit [Supabase](https://supabase.com/)
2. Create a new project
3. Get your project URL and API keys
4. Add them to your `.env.local` file

## Database Setup

### 1. Local Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# This will output your local credentials
# Add them to your .env.local file
```

### 2. Database Migrations

```bash
# Run database migrations
npm run db-migrate

# Generate TypeScript types
npm run db-types
```

### 3. Seed Data (Optional)

```bash
# Seed the database with sample data
npm run db-seed
```

### 4. Database Reset

```bash
# Reset database to clean state
npm run db-reset
```

### 5. Database Schema

The application uses the following main tables:

- `profiles`: User profile information
- `workspaces`: User workspaces
- `chats`: Chat conversations
- `messages`: Chat messages
- `memories`: User memories
- `memory_clusters`: Memory clusters
- `assistants`: AI assistants
- `files`: Uploaded files
- `collections`: File collections

## Development Workflow

### 1. Start Development Server

```bash
# Start the development server
npm run dev

# Or use the chat script (includes Supabase)
npm run chat
```

The application will be available at `http://localhost:3000`

### 2. Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run preview          # Preview production build

# Database
npm run db-migrate       # Run database migrations
npm run db-types         # Generate TypeScript types
npm run db-reset         # Reset database
npm run db-pull          # Pull remote database schema
npm run db-push          # Push local schema to remote

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format:write     # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # Run TypeScript type checking

# Testing
npm run test             # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate test coverage

# Memory System
npm run setup-memory     # Setup memory system locally
npm run setup-memory-cloud # Setup memory system in cloud
```

### 3. Git Workflow

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Stage and commit changes
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create a pull request
# ... via GitHub/GitLab interface ...
```

### 4. Code Organization

```
app/
├── api/                 # API routes
├── [locale]/           # Localized pages
│   ├── workspace/      # Workspace pages
│   ├── setup/          # Setup pages
│   └── ...
components/
├── chat/               # Chat components
├── sidebar/            # Sidebar components
├── ui/                 # UI components
└── ...
lib/
├── memory-system.ts    # Memory system
├── supabase/           # Supabase utilities
└── ...
db/
├── *.ts               # Database utilities
└── ...
types/
├── *.ts               # TypeScript types
└── ...
```

## Testing

### 1. Unit Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- memory-system.test.ts
```

### 2. Integration Testing

```bash
# Run integration tests
npm run test:integration

# Run API tests
npm run test:api
```

### 3. E2E Testing

```bash
# Install Playwright
cd playwright-test
npm install

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### 4. Test Structure

```
__tests__/
├── lib/
│   ├── memory-system.test.ts
│   └── openapi-conversion.test.ts
├── memory-integration.test.ts
└── playwright-test/
    ├── tests/
    │   └── login.spec.ts
    └── playwright.config.ts
```

### 5. Writing Tests

#### Unit Test Example

```typescript
import { generateEmbedding } from '@/lib/memory-system'

describe('Memory System', () => {
  test('should generate embeddings', async () => {
    const text = 'Hello world'
    const embedding = await generateEmbedding(text)
    
    expect(embedding).toBeInstanceOf(Array)
    expect(embedding.length).toBeGreaterThan(0)
  })
})
```

#### API Test Example

```typescript
import { createClient } from '@/lib/supabase/client'

describe('Memory API', () => {
  test('should save memory', async () => {
    const response = await fetch('/api/memory/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Test memory',
        user_id: 'test-user'
      })
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.content).toBe('Test memory')
  })
})
```

## Code Quality

### 1. ESLint Configuration

The project uses ESLint with the following configuration:

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "plugins": ["tailwindcss"],
  "rules": {
    "tailwindcss/classnames-order": "warn",
    "tailwindcss/no-custom-classname": "warn",
    "tailwindcss/no-contradicting-classname": "error"
  }
}
```

### 2. Prettier Configuration

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 3. TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 4. Pre-commit Hooks

The project uses Husky for pre-commit hooks:

```bash
# Install Husky
npm run prepare

# Pre-commit hooks will run:
# - ESLint
# - Prettier
# - TypeScript type checking
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Problem**: Cannot connect to Supabase
**Solutions**:
```bash
# Check Supabase status
supabase status

# Restart Supabase
supabase stop
supabase start

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### 2. Memory System Issues

**Problem**: Memory operations failing
**Solutions**:
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Test memory system
npm run setup-memory

# Check memory system logs
tail -f logs/memory.log
```

#### 3. Build Issues

**Problem**: Build failing
**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install

# Run type checking
npm run type-check
```

#### 4. Port Conflicts

**Problem**: Port 3000 already in use
**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

#### 5. TypeScript Errors

**Problem**: TypeScript compilation errors
**Solutions**:
```bash
# Run type checking
npm run type-check

# Update database types
npm run db-types

# Check for missing dependencies
npm install @types/node @types/react
```

### Debug Tools

#### 1. Development Tools

```bash
# Bundle analyzer
npm run analyze

# Memory usage
npm run dev -- --inspect

# Performance profiling
npm run dev -- --profile
```

#### 2. Database Debugging

```bash
# Supabase logs
supabase logs

# Database queries
supabase db diff

# Schema inspection
supabase db inspect
```

#### 3. API Debugging

```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/memory/save \
  -H "Content-Type: application/json" \
  -d '{"content":"test","user_id":"test"}'

# Check API logs
tail -f logs/api.log
```

## Contributing

### 1. Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new features**
5. **Update documentation**
6. **Submit a pull request**

### 2. Code Standards

- **TypeScript**: Use strict typing
- **ESLint**: Follow linting rules
- **Prettier**: Use consistent formatting
- **Tests**: Add tests for new features
- **Documentation**: Update relevant docs

### 3. Commit Message Format

```
type(scope): description

feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### 4. Pull Request Process

1. **Create descriptive PR title**
2. **Add detailed description**
3. **Include screenshots for UI changes**
4. **Link related issues**
5. **Request reviews from maintainers**

### 5. Review Process

- **Code review required**
- **Tests must pass**
- **Documentation updated**
- **No linting errors**
- **TypeScript compilation successful**

### 6. Release Process

1. **Create release branch**
2. **Update version numbers**
3. **Update changelog**
4. **Run full test suite**
5. **Create release tag**
6. **Deploy to production**

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Status**: Complete
