# Environment Setup Guide

This guide helps you set up the required environment variables for the chatbot-ui project.

## Required Environment Variables

### Supabase Configuration

1. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
   - Found in: Supabase Dashboard > Settings > API > Project URL
   - Example: `https://your-project-id.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key
   - Found in: Supabase Dashboard > Settings > API > Project API keys > anon public
   - Used for client-side operations

3. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key
   - Found in: Supabase Dashboard > Settings > API > Project API keys > service_role
   - Used for server-side admin operations
   - **⚠️ Keep this secret - never expose it to the client**

## Setup Instructions

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Getting Your Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

### "Supabase admin configuration is missing" Error

If you see this error, it means the `SUPABASE_SERVICE_ROLE_KEY` is not set in your `.env.local` file.

**Solution:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API > Project API keys
3. Copy the `service_role` key
4. Add it to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### "User not found (no Supabase user in session)" Error

This is normal when testing API endpoints directly. The application requires user authentication for most operations.

**Solution:**
- Use the web interface instead of direct API calls
- Or implement proper authentication headers for API testing

## Security Notes

- Never commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges - keep it secure
- Use the `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
- Use the `SUPABASE_SERVICE_ROLE_KEY` only for server-side operations

## Optional Environment Variables

For additional features, you may also need:

- **OpenAI API Key** - For AI-powered features
- **Azure OpenAI Configuration** - For Azure OpenAI integration
- **Other Provider Keys** - For various AI service integrations

See the main README.md for complete configuration options. 