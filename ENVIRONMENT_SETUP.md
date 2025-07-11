# Environment Setup Guide

## Quick Setup

To resolve the "Missing required environment variables" error, you need to set up your environment variables.

### Step 1: Create Environment File

Create a `.env.local` file in your project root:

```bash
touch .env.local
```

### Step 2: Add Required Variables

Add the following to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key_here

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Get Local Supabase Keys

If you're using local Supabase development:

```bash
# Start Supabase (if not already running)
supabase start

# The keys will be displayed in the output
# Copy them to your .env.local file
```

### Step 4: Verify Setup

```bash
# Validate environment variables
npm run validate-env

# Check health
npm run health-check
```

## Production Setup

For production, use your actual Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

## Troubleshooting

### If you get "Could not resolve host: supabase_kong_chatbotui"

1. **Restart Supabase:**
   ```bash
   supabase stop
   supabase start
   ```

2. **Check Supabase status:**
   ```bash
   supabase status
   ```

3. **Verify environment variables:**
   ```bash
   npm run validate-env
   ```

### If validation still fails

1. **Check file permissions:**
   ```bash
   ls -la .env.local
   ```

2. **Restart your development server:**
   ```bash
   npm run dev
   ```

3. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

## Next Steps

Once environment variables are set up:

1. **Test file deletion:**
   - Upload a file through the UI
   - Try deleting it
   - Check console for any errors

2. **Monitor health:**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Run tests:**
   ```bash
   npm test
   ``` 