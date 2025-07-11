const validateSupabaseConfig = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  // Validate URL format
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
  }
  
  // Validate keys are not empty
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty')
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY.trim()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY cannot be empty')
  }
}

module.exports = { validateSupabaseConfig } 