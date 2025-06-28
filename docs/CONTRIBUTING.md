# Contributing Guidelines

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation Standards](#documentation-standards)
7. [Pull Request Process](#pull-request-process)
8. [Issue Guidelines](#issue-guidelines)
9. [Community Guidelines](#community-guidelines)
10. [Release Process](#release-process)

## Overview

Thank you for your interest in contributing to Chatbot UI! This document provides guidelines and standards for contributing to the project. We welcome contributions from developers of all skill levels.

### Types of Contributions

- **Bug Fixes**: Fix issues and improve stability
- **Feature Development**: Add new features and capabilities
- **Documentation**: Improve documentation and guides
- **Testing**: Add tests and improve test coverage
- **Code Quality**: Refactor and optimize code
- **Design**: Improve UI/UX and accessibility

### Before You Start

- Read the [README.md](../README.md) to understand the project
- Check existing [issues](../../issues) to avoid duplicates
- Review the [architecture documentation](ARCHITECTURE.md)
- Familiarize yourself with the [development setup](DEVELOPMENT.md)

## Getting Started

### Prerequisites

- **Node.js**: Version 18.17 or higher
- **npm**: Version 9.0 or higher
- **Git**: Version 2.30 or higher
- **Supabase CLI**: For database operations

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/chatbot-ui.git
   cd chatbot-ui
   ```

2. **Set Up Development Environment**
   ```bash
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env.local
   # Edit .env.local with your API keys
   
   # Start development server
   npm run dev
   ```

3. **Set Up Database**
   ```bash
   # Start local Supabase
   supabase start
   
   # Run migrations
   npm run db-migrate
   
   # Generate types
   npm run db-types
   ```

4. **Verify Setup**
   ```bash
   # Run tests
   npm test
   
   # Check linting
   npm run lint
   
   # Type check
   npm run type-check
   ```

### Development Environment

#### Recommended Tools

- **VS Code**: Primary IDE with extensions
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense
  - GitLens

- **Browser Extensions**
  - React Developer Tools
  - Redux DevTools (if using Redux)

#### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Required
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Development Workflow

### Branch Strategy

We use a feature branch workflow:

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description

# Or for documentation
git checkout -b docs/documentation-update
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### Development Process

1. **Create Issue** (if applicable)
   - Describe the problem or feature
   - Include steps to reproduce
   - Add screenshots if relevant

2. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code following our standards
   - Add tests for new functionality
   - Update documentation

4. **Test Your Changes**
   ```bash
   # Run all tests
   npm test
   
   # Run specific tests
   npm test -- --testNamePattern="your test"
   
   # Check linting
   npm run lint
   
   # Type check
   npm run type-check
   
   # Build check
   npm run build
   ```

5. **Commit Your Changes**
   ```bash
   # Stage changes
   git add .
   
   # Commit with conventional commit message
   git commit -m "feat: add new chat feature"
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

## Code Standards

### TypeScript Standards

- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type - use proper typing
- Use generics where appropriate

```typescript
// Good
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

// Avoid
const message: any = { /* ... */ }
```

### React Standards

- Use functional components with hooks
- Follow React best practices
- Use proper prop typing
- Implement error boundaries

```typescript
// Good
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  onClick,
  children
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### Naming Conventions

- **Files**: kebab-case (`chat-message.tsx`)
- **Components**: PascalCase (`ChatMessage`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase with `I` prefix (`IChatMessage`)

### Code Organization

```
components/
├── ui/                    # Base UI components
├── chat/                  # Chat-specific components
├── sidebar/               # Sidebar components
└── ...

lib/
├── providers/             # AI provider integrations
├── chat/                  # Chat logic
├── memory/                # Memory system
└── ...

types/
├── chat.ts               # Chat-related types
├── memory.ts             # Memory-related types
└── ...
```

### Import Organization

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react'

// 2. Third-party libraries
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'

// 3. Local imports
import { useChat } from '@/lib/chat/use-chat'
import type { ChatMessage } from '@/types/chat'
```

## Testing Guidelines

### Test Structure

```
__tests__/
├── components/            # Component tests
├── lib/                   # Library tests
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests
```

### Writing Tests

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatInput } from '@/components/chat/chat-input'

describe('ChatInput', () => {
  it('should send message when form is submitted', async () => {
    const onSendMessage = jest.fn()
    
    render(<ChatInput onSendMessage={onSendMessage} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const button = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Hello world' } })
    fireEvent.click(button)
    
    expect(onSendMessage).toHaveBeenCalledWith('Hello world')
  })
})
```

### Test Coverage Requirements

- **Components**: 80% coverage
- **Library functions**: 90% coverage
- **API routes**: 85% coverage
- **Critical paths**: 95% coverage

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- chat-input.test.tsx

# Run E2E tests
npm run test:e2e
```

## Documentation Standards

### Code Documentation

- Use JSDoc for functions and classes
- Document complex algorithms
- Include examples for public APIs

```typescript
/**
 * Saves a memory with enhanced processing including embedding generation
 * and semantic analysis.
 * 
 * @param supabase - Supabase client instance
 * @param content - Memory content to save
 * @param userId - User ID for the memory
 * @returns Promise resolving to the saved memory
 * 
 * @example
 * ```typescript
 * const memory = await saveEnhancedMemory(
 *   supabaseClient,
 *   "I prefer TypeScript for my projects",
 *   "user-123"
 * )
 * ```
 */
export async function saveEnhancedMemory(
  supabase: any,
  content: string,
  userId: string
): Promise<Memory> {
  // Implementation...
}
```

### README Updates

- Update README.md for new features
- Include setup instructions
- Add usage examples
- Document breaking changes

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error codes
- Add authentication requirements

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] Tests pass and coverage is adequate
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] TypeScript compilation succeeds
- [ ] Build succeeds without errors
- [ ] Feature is tested manually

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have made corresponding changes to documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass locally
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests
   - Code quality checks
   - Security scanning

2. **Code Review**
   - At least one maintainer review required
   - Address all review comments
   - Request review when ready

3. **Merge Requirements**
   - All checks must pass
   - At least one approval
   - No merge conflicts

### Commit Message Format

Use conventional commit format:

```
type(scope): description

feat(chat): add streaming support
fix(memory): resolve duplicate memory issue
docs(api): update API documentation
style(ui): improve button styling
refactor(auth): simplify authentication logic
test(memory): add memory system tests
chore(deps): update dependencies
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Issue Guidelines

### Issue Templates

#### Bug Report
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 2.0.0]

## Additional Context
Screenshots, logs, etc.
```

#### Feature Request
```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches considered

## Additional Context
Screenshots, mockups, etc.
```

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `priority: high`: High priority issue
- `priority: low`: Low priority issue

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors.

#### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

#### Unacceptable Behavior

- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct inappropriate in a professional setting

### Communication

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: For real-time chat and collaboration

### Getting Help

- Check existing documentation first
- Search existing issues and discussions
- Ask questions in GitHub Discussions
- Join our Discord community

## Release Process

### Version Management

We use semantic versioning (SemVer):

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

### Release Checklist

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Changelog is updated
- [ ] Version is bumped
- [ ] Release notes are prepared
- [ ] Assets are prepared (screenshots, etc.)

### Release Steps

1. **Prepare Release**
   ```bash
   # Update version
   npm version patch|minor|major
   
   # Update changelog
   npm run changelog
   ```

2. **Create Release Branch**
   ```bash
   git checkout -b release/v2.1.0
   git push origin release/v2.1.0
   ```

3. **Create Pull Request**
   - Update version numbers
   - Update changelog
   - Add release notes

4. **Merge and Tag**
   ```bash
   git checkout main
   git merge release/v2.1.0
   git tag v2.1.0
   git push origin main --tags
   ```

5. **Deploy**
   - Deploy to staging
   - Run smoke tests
   - Deploy to production

### Release Notes Template

```markdown
# Release v2.1.0

## 🎉 New Features
- Added streaming chat support
- Implemented file upload functionality
- Enhanced memory system

## 🐛 Bug Fixes
- Fixed memory retrieval issues
- Resolved authentication problems
- Fixed UI responsiveness

## 🔧 Improvements
- Improved error handling
- Enhanced performance
- Updated dependencies

## 📚 Documentation
- Added API documentation
- Updated setup guide
- Improved troubleshooting guide

## 🚀 Migration Guide
If upgrading from v2.0.0, no breaking changes.
```

---

## Getting Help

If you need help with contributing:

1. **Check Documentation**: Review the [docs](../docs/) folder
2. **Search Issues**: Look for similar issues or questions
3. **Ask Questions**: Use GitHub Discussions
4. **Join Community**: Connect on Discord

## Recognition

Contributors are recognized in:

- **README.md**: Contributors section
- **Release Notes**: For significant contributions
- **GitHub**: Contributor graph and profile

Thank you for contributing to Chatbot UI! 🚀

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Status**: Complete 