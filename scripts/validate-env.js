// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { validateSupabaseConfig } = require('../lib/supabase/validation')

const validateEnvironment = () => {
  try {
    validateSupabaseConfig()
    console.log('✅ Environment validation passed')
    return true
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message)
    return false
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const isValid = validateEnvironment()
  process.exit(isValid ? 0 : 1)
}

module.exports = { validateEnvironment } 