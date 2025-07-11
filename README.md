# Chatbot UI

An open source AI chatbot app template built with Next.js 14.

<!-- Deployment trigger: Intelligent Memory System Update -->

## Features

- 🤖 **AI Chat**: Chat with GPT-4, Claude, and more
- 🎨 **Modern UI**: Beautiful, responsive design
- 🔧 **Customizable**: Easy to customize and extend
- 📱 **PWA**: Progressive Web App support
- 🌍 **Internationalization**: Multi-language support
- 🧠 **Intelligent Memory**: Smart conversation memory system
- 📁 **AI-Powered File Management**: Intelligent file upload, tagging, and organization
- ⚡ **Fast**: Built with Next.js 14 and optimized for performance

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mckaywrigley/chatbot-ui.git
   cd chatbot-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your API keys.

4. **Set up the database**
   ```bash
   # Start Supabase locally (optional)
   supabase start
   
   # Apply database migrations
   supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the root directory:

> **📖 For detailed environment setup instructions, see [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md)**

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google (Optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub (Optional)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## Key Features

### 🤖 AI-Powered File Management

The enhanced file system provides intelligent file handling with AI-powered features:

- **Automatic Metadata Generation**: AI analyzes file content to generate titles, descriptions, and tags
- **Smart Tagging**: Suggests relevant tags based on file content and context
- **Content Extraction**: Extracts text from various file formats (PDF, DOCX, TXT, etc.)
- **Batch Processing**: Handle multiple files with AI analysis
- **Advanced Search**: Search by content, tags, and AI-generated metadata
- **Reliable File Operations**: Robust file deletion with graceful error handling for database triggers

### 🧠 Intelligent Memory System

Advanced conversation memory with:
- Context-aware memory retrieval
- Automatic memory summarization
- Smart memory deduplication
- Memory optimization and cleanup

### 🎨 Modern Chat Interface

- Real-time chat with multiple AI models
- File upload and management
- Code highlighting and formatting
- Responsive design for all devices

## Deployment

### Vercel (Recommended)

1. **Fork this repository**
2. **Connect to Vercel**
3. **Add environment variables**
4. **Deploy**

### Other Platforms

This app can be deployed to any platform that supports Next.js:

- **Netlify**
- **Railway**
- **DigitalOcean App Platform**
- **AWS Amplify**

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI GPT-4
- **File Processing**: AI-powered content analysis
- **Deployment**: Vercel

## Documentation

- [Enhanced File System](./docs/ENHANCED_FILE_SYSTEM.md) - Complete guide to AI-powered file management
- [Memory System](./docs/MEMORY_SYSTEM.md) - Intelligent conversation memory
- [API Reference](./docs/API_REFERENCE.md) - API documentation
- [Architecture](./docs/ARCHITECTURE.md) - System architecture overview
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment instructions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you have any questions or need help, please open an issue on GitHub.
